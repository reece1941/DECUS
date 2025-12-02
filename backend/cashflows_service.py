import requests
import hmac
import hashlib
import json
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class CashflowsService:
    """Service for interacting with Cashflows Payment Gateway"""
    
    def __init__(self):
        self.merchant_id = os.getenv('CASHFLOWS_MERCHANT_ID', '')
        self.api_key = os.getenv('CASHFLOWS_API_KEY', '')
        self.api_secret = os.getenv('CASHFLOWS_API_SECRET', '')
        self.gateway_url = os.getenv('CASHFLOWS_GATEWAY_URL', 'https://gateway.cashflows.com')
        self.webhook_secret = os.getenv('CASHFLOWS_WEBHOOK_SECRET', '')
        
        # Check if credentials are configured
        self.is_configured = all([
            self.merchant_id,
            self.api_key,
            self.api_secret
        ])
        
        if not self.is_configured:
            logger.warning("Cashflows credentials not fully configured. Payment processing will be mocked.")
    
    def _generate_hash(self, message_body: str) -> str:
        """Generate HMAC SHA256 hash for request authentication"""
        # Cashflows expects: HMAC(secret, secret + message_body)
        hash_input = f"{self.api_secret}{message_body}".encode('utf-8')
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            hash_input,
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _get_headers(self, message_body: str = "") -> Dict[str, str]:
        """Construct request headers with authentication"""
        hash_value = self._generate_hash(message_body)
        return {
            "Content-Type": "application/json",
            "ConfigurationId": self.merchant_id,
            "Hash": hash_value,
        }
    
    def create_payment_job(
        self,
        amount: float,
        currency: str,
        order_reference: str,
        customer_email: str,
        customer_name: str,
        description: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a payment job in the Cashflows system"""
        
        # If not configured, return mock response
        if not self.is_configured:
            logger.info("Returning mocked payment job (credentials not configured)")
            return {
                "paymentJobReference": f"MOCK-JOB-{order_reference}",
                "paymentReference": f"MOCK-PAY-{order_reference}",
                "actionUrl": f"{success_url or '/payment/mock-success'}?mocked=true",
                "status": "pending",
                "message": "MOCKED: Please configure Cashflows credentials in backend/.env"
            }
        
        payload = {
            "amountToCollect": f"{amount:.2f}",
            "currency": currency,
            "orderReference": order_reference,
            "customerEmail": customer_email,
            "customerName": customer_name,
            "description": description or "Payment for order",
            "returnUrlSuccess": success_url,
            "returnUrlCancel": cancel_url,
        }
        
        message_body = json.dumps(payload)
        headers = self._get_headers(message_body)
        
        endpoint = f"{self.gateway_url}/payment-jobs"
        
        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Payment job created: {result.get('paymentJobReference')}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create payment job: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def get_payment_job_status(self, payment_job_reference: str) -> Dict[str, Any]:
        """Retrieve the current status of a payment job"""
        
        if not self.is_configured:
            return {
                "paymentJobReference": payment_job_reference,
                "status": "captured",
                "message": "MOCKED"
            }
        
        headers = self._get_headers()
        endpoint = f"{self.gateway_url}/payment-jobs/{payment_job_reference}"
        
        try:
            response = requests.get(
                endpoint,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get payment job status: {str(e)}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def verify_webhook_signature(self, payload: str, received_signature: str) -> bool:
        """Verify that a webhook came from Cashflows"""
        if not self.webhook_secret:
            logger.warning("Webhook secret not configured, skipping verification")
            return True  # Allow in development
        
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(expected_signature, received_signature)
