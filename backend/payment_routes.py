from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import json
import logging
from cashflows_service import CashflowsService
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

class CreatePaymentRequest(BaseModel):
    amount: float = Field(gt=0, description="Payment amount")
    currency: str = Field(default="GBP", min_length=3, max_length=3)
    order_reference: str = Field(min_length=1, max_length=50)
    customer_email: str
    customer_name: str
    description: Optional[str] = None
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 0.01:
            raise ValueError('Amount must be at least 0.01')
        return round(v, 2)

@router.post("/payment/create")
async def create_payment(
    request: CreatePaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new payment job with Cashflows"""
    try:
        service = CashflowsService()
        
        # Generate return URLs
        backend_url = "http://localhost:8001"  # TODO: Get from env
        success_url = f"{backend_url}/api/payment/success?ref={{paymentRef}}"
        cancel_url = f"{backend_url}/api/payment/cancel"
        
        result = service.create_payment_job(
            amount=request.amount,
            currency=request.currency,
            order_reference=request.order_reference,
            customer_email=request.customer_email,
            customer_name=request.customer_name,
            description=request.description,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        
        return {
            "status": "success",
            "payment_job_reference": result.get("paymentJobReference"),
            "payment_reference": result.get("paymentReference"),
            "action_url": result.get("actionUrl"),
            "message": result.get("message", "Payment job created"),
            "is_mocked": not service.is_configured
        }
        
    except Exception as e:
        logger.error(f"Payment creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/webhooks/cashflows")
async def handle_cashflows_webhook(request: Request):
    """Handle webhook notifications from Cashflows"""
    try:
        body = await request.body()
        
        # Verify webhook signature
        signature = request.headers.get("X-Signature", "")
        service = CashflowsService()
        
        if not service.verify_webhook_signature(body.decode(), signature):
            logger.warning("Invalid webhook signature received")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
        
        payload = json.loads(body)
        
        # Process payment update based on status
        payment_status = payload.get("status")
        payment_ref = payload.get("paymentReference")
        order_ref = payload.get("orderReference")
        
        logger.info(f"Webhook received: Payment {payment_ref} - Status: {payment_status}")
        
        # TODO: Update your database with payment status
        # Handle different statuses: authorized, captured, declined, failed
        
        return {"status": "received"}
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )

@router.get("/payment/success")
async def payment_success(ref: Optional[str] = None, mocked: Optional[str] = None):
    """Handle successful payment redirect"""
    return {
        "status": "success",
        "message": "Payment completed successfully",
        "reference": ref,
        "is_mocked": mocked == "true"
    }

@router.get("/payment/cancel")
async def payment_cancel():
    """Handle cancelled payment"""
    return {
        "status": "cancelled",
        "message": "Payment was cancelled"
    }
