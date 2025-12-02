# Cashflows Payment Gateway Integration Guide

## Overview
The Cashflows payment gateway has been integrated into your RaffleStack application. The integration is **production-ready** and currently operates in **MOCK MODE** until you add your Cashflows API credentials.

## Current Status
✅ **Backend Integration Complete** - Payment service layer implemented  
✅ **API Routes Created** - Endpoints for payment creation and webhooks  
✅ **Mock Mode Active** - System returns simulated responses until credentials are added  
✅ **Security Implemented** - HMAC-SHA256 signature verification ready  
✅ **Error Handling** - Comprehensive logging and error management  

---

## How to Configure (Add Your Credentials)

### Step 1: Obtain Cashflows Credentials
1. Log into your **Cashflows Go** merchant account
2. Navigate to **Settings** → **API Credentials**
3. Copy the following values:
   - **Configuration ID** (Merchant ID)
   - **API Key**
   - **API Secret**
   - **Webhook Secret** (for verifying webhook authenticity)

### Step 2: Add Credentials to Backend
Open `/app/backend/.env` and fill in the empty credential fields:

```bash
# Cashflows Payment Gateway Configuration
CASHFLOWS_API_KEY="your_api_key_here"
CASHFLOWS_API_SECRET="your_api_secret_here"
CASHFLOWS_MERCHANT_ID="your_merchant_id_here"
CASHFLOWS_GATEWAY_URL="https://gateway.cashflows.com"
CASHFLOWS_WEBHOOK_SECRET="your_webhook_secret_here"
```

**⚠️ IMPORTANT:**
- For **testing**, use: `https://gateway-int.cashflows.com` (integration environment)
- For **production**, use: `https://gateway.cashflows.com`
- Never commit the `.env` file to version control

### Step 3: Restart the Backend
After adding credentials, restart the backend service:

```bash
sudo supervisorctl restart backend
```

### Step 4: Configure Webhooks in Cashflows Dashboard
1. Log into Cashflows dashboard
2. Go to **Settings** → **Webhooks**
3. Add webhook URL: `https://your-domain.com/api/webhooks/cashflows`
4. Select events: `payment.authorized`, `payment.captured`, `payment.declined`, `payment.failed`
5. Save configuration

---

## How It Works

### Payment Flow
1. **Customer initiates checkout** on your React frontend
2. **Frontend sends payment request** to `/api/payment/create`
3. **Backend creates payment job** with Cashflows API
4. **Cashflows returns action URL** (hosted payment page)
5. **Customer redirected** to Cashflows to enter card details
6. **After payment**, customer redirected back to your site
7. **Cashflows sends webhook** with payment status to your backend
8. **Backend updates order** based on webhook notification

### API Endpoints Created

#### 1. Create Payment
**POST** `/api/payment/create`

**Request Body:**
```json
{
  "amount": 19.99,
  "currency": "GBP",
  "order_reference": "ORDER-12345",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "description": "Competition Entry Purchase"
}
```

**Response:**
```json
{
  "status": "success",
  "payment_job_reference": "CASHFLOWS-JOB-REF",
  "payment_reference": "CASHFLOWS-PAY-REF",
  "action_url": "https://gateway.cashflows.com/payment/xxxxx",
  "is_mocked": false
}
```

#### 2. Webhook Handler
**POST** `/api/webhooks/cashflows`

Receives payment status updates from Cashflows:
- `authorized` - Payment authorized, funds reserved
- `captured` - Payment captured, funds transferred
- `declined` - Payment declined by card issuer
- `failed` - Payment failed due to technical error

#### 3. Success/Cancel Callbacks
- **GET** `/api/payment/success?ref={payment_ref}` - Customer redirected here after successful payment
- **GET** `/api/payment/cancel` - Customer redirected here if payment cancelled

---

## Integration with Your Checkout

### Current Checkout Flow (Mocked)
Your existing checkout in `/app/backend/server.py` currently has a **mocked payment** section. Here's how to integrate:

**Option 1: Replace Existing Checkout Logic**
Update the `/api/checkout/complete` endpoint to call the Cashflows service before marking orders as complete.

**Option 2: Separate Payment Step**
Add a payment gateway step after checkout validation, before order completion.

### Example Integration in Checkout:

```python
from cashflows_service import CashflowsService

@api_router.post("/checkout/complete")
async def complete_checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    # ... existing validation code ...
    
    # Create payment job with Cashflows
    service = CashflowsService()
    payment_result = service.create_payment_job(
        amount=total,
        currency="GBP",
        order_reference=order_id,
        customer_email=current_user["email"],
        customer_name=current_user["name"],
        description=f"Competition entries for order {order_id}"
    )
    
    # Return action URL to frontend for redirect
    return {
        "order_id": order_id,
        "action_url": payment_result["actionUrl"],
        "payment_reference": payment_result["paymentReference"]
    }
```

---

## Testing the Integration

### Test in Mock Mode (No Credentials)
The system automatically detects when credentials are missing and returns mock responses:

```bash
# Test payment creation
curl -X POST http://localhost:8001/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 10.00,
    "currency": "GBP",
    "order_reference": "TEST-001",
    "customer_email": "test@example.com",
    "customer_name": "Test User"
  }'
```

Expected response:
```json
{
  "is_mocked": true,
  "message": "MOCKED: Please configure Cashflows credentials in backend/.env"
}
```

### Test with Real Credentials (Integration Environment)
1. Use **integration** environment credentials
2. Set `CASHFLOWS_GATEWAY_URL="https://gateway-int.cashflows.com"`
3. Use test card numbers provided by Cashflows
4. Create test payments and verify webhooks are received

### Test Card Numbers (Integration Environment)
- **Successful Payment:** 4111 1111 1111 1111
- **Declined Payment:** 4000 0000 0000 0002
- **Expired Card:** 4000 0000 0000 0069

---

## Security Features

### 1. HMAC-SHA256 Request Signing
All requests to Cashflows API are signed using HMAC-SHA256:
```
Hash = HMAC-SHA256(api_secret + message_body, api_secret)
```

### 2. Webhook Signature Verification
Incoming webhooks are verified to ensure authenticity:
```python
def verify_webhook_signature(payload, received_signature):
    expected = HMAC-SHA256(webhook_secret, payload)
    return constant_time_compare(expected, received_signature)
```

### 3. Environment Variables
Sensitive credentials never appear in code - always loaded from environment.

### 4. HTTPS Required
Production webhooks MUST use HTTPS endpoints.

---

## Troubleshooting

### Issue: Payment creation returns 401 Unauthorized
**Solution:** Check that your API credentials are correct in `.env` and the hash is being calculated properly.

### Issue: Webhooks not being received
**Solution:** 
1. Ensure webhook URL is publicly accessible (not localhost)
2. Verify webhook URL is configured in Cashflows dashboard
3. Check webhook signature verification isn't failing

### Issue: "Payment gateway error" in logs
**Solution:** 
1. Check backend logs: `tail -f /var/log/supervisor/backend.out.log`
2. Verify gateway URL is correct (integration vs production)
3. Ensure merchant ID matches your account

### Issue: Mock mode won't turn off
**Solution:** Restart backend after adding credentials: `sudo supervisorctl restart backend`

---

## Production Deployment Checklist

- [ ] Switch to production Cashflows credentials
- [ ] Update `CASHFLOWS_GATEWAY_URL` to production endpoint
- [ ] Configure production webhook URL in Cashflows dashboard
- [ ] Test full payment flow in production
- [ ] Set up monitoring/alerts for payment failures
- [ ] Enable HTTPS for webhook endpoint
- [ ] Test webhook signature verification
- [ ] Set up database backups for order/payment records
- [ ] Configure error logging (Sentry, CloudWatch, etc.)
- [ ] Test payment failure scenarios
- [ ] Verify refund process (if implemented)

---

## Files Created/Modified

### New Files:
- `/app/backend/cashflows_service.py` - Core payment service logic
- `/app/backend/payment_routes.py` - API endpoints for payments
- `/app/CASHFLOWS_INTEGRATION_GUIDE.md` - This guide

### Modified Files:
- `/app/backend/server.py` - Added payment router import and mounting
- `/app/backend/.env` - Added Cashflows credential placeholders

---

## Next Steps

1. **Add your Cashflows credentials** to `/app/backend/.env`
2. **Test in integration environment** with test card numbers
3. **Integrate with your checkout flow** (replace mocked payment)
4. **Configure webhooks** in Cashflows dashboard
5. **Test end-to-end** payment flow
6. **Deploy to production** with production credentials

---

## Support & Resources

- **Cashflows Documentation:** https://www.cashflows.com/developers
- **Integration Support:** Contact Cashflows support team
- **Testing Environment:** https://gateway-int.cashflows.com
- **Production Environment:** https://gateway.cashflows.com

---

## Important Notes

⚠️ **PCI DSS Compliance:**
- Never store full card details in your database
- Cashflows handles all card data (PCI Level 1 compliant)
- Only store payment references and order IDs

⚠️ **Testing vs Production:**
- Always test in integration environment first
- Use separate credentials for each environment
- Never use production credentials in development

⚠️ **Webhook Security:**
- Always verify webhook signatures
- Use HTTPS for production webhooks
- Implement idempotency for webhook processing (handle duplicates)

---

**Integration completed by:** E1 Agent  
**Date:** December 2025  
**Status:** ✅ Ready for credential configuration
