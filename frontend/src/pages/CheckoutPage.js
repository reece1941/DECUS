import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { checkoutAPI } from '../services/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('site_credit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await checkoutAPI.complete({ payment_method: paymentMethod });
      if (data.success) {
        await clearCart();
        navigate('/thank-you', { state: { order: data } });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Checkout</h1>
      <div style={{ marginTop: '40px' }}>
        <h2>Order Summary</h2>
        <p>Total: £{total.toFixed(2)}</p>
      </div>
      <div style={{ marginTop: '40px' }}>
        <h2>Payment Method</h2>
        <div>
          <label>
            <input type="radio" value="site_credit" checked={paymentMethod === 'site_credit'} onChange={(e) => setPaymentMethod(e.target.value)} />
            Site Credit (Balance: £{user?.site_credit_balance?.toFixed(2) || '0.00'})
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
            Cash Balance (Balance: £{user?.cash_balance?.toFixed(2) || '0.00'})
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
            Credit/Debit Card (Mocked)
          </label>
        </div>
      </div>
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
      <button onClick={handleCheckout} disabled={loading} style={{ marginTop: '40px', padding: '15px 40px', cursor: 'pointer' }}>
        {loading ? 'Processing...' : 'Complete Purchase'}
      </button>
    </div>
  );
};

export default CheckoutPage;