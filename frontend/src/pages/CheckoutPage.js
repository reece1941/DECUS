import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { checkoutAPI, competitionsAPI } from '../services/api';
import Header from '../components/Header/Header';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, total, subtotal, clearCart, applyCoupon, updateQuantity, addToCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('site_credit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [upsellCompetitions, setUpsellCompetitions] = useState([]);
  const [addingUpsell, setAddingUpsell] = useState(null);

  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchUpsellCompetitions();
  }, []);

  const fetchUpsellCompetitions = async () => {
    try {
      const { data } = await competitionsAPI.getAll();
      const currentIds = cart.items.map(item => item.competition_id);
      const suggestions = data
        .filter(comp => !currentIds.includes(comp.id))
        .slice(0, 3);
      setUpsellCompetitions(suggestions);
    } catch (error) {
      console.error('Failed to fetch upsell competitions:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponSuccess(false);
    setError('');
    
    const result = await applyCoupon(couponCode);
    
    if (result.success) {
      setCouponSuccess(true);
      setCouponCode('');
    } else {
      setError(result.error || 'Invalid coupon code');
    }
    
    setCouponLoading(false);
  };

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

  const getPaymentMethodBalance = (method) => {
    if (method === 'site_credit') return user?.site_credit_balance || 0;
    if (method === 'cash') return user?.cash_balance || 0;
    return null;
  };

  const isBalanceSufficient = (method) => {
    const balance = getPaymentMethodBalance(method);
    if (balance === null) return true;
    return balance >= total;
  };

  const handleBulkUpdate = async (competitionId, newQuantity) => {
    await updateQuantity(competitionId, newQuantity);
  };

  const handleQuickAddUpsell = async (comp) => {
    setAddingUpsell(comp.id);
    await addToCart({
      competition_id: comp.id,
      title: comp.title,
      price: comp.price,
      quantity: 1,
      image: comp.image || comp.video,
    });
    setAddingUpsell(null);
    await fetchUpsellCompetitions();
  };

  const getBulkDiscount = (quantity) => {
    if (quantity >= 100) return 20;
    if (quantity >= 50) return 15;
    if (quantity >= 25) return 10;
    if (quantity >= 10) return 5;
    return 0;
  };

  return (
    <div className="checkout-page">
      <Header />
      
      <div className="checkout-container">
        <div className="checkout-content">
          {/* Left Side - Order Summary */}
          <div className="checkout-left">
            <div className="checkout-card">
              <h2 className="checkout-section-title">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                Order Summary
              </h2>
              
              <div className="order-items">
                {cart.items.map((item, index) => {
                  const discount = getBulkDiscount(item.quantity);
                  const itemTotal = item.price * item.quantity;
                  const discountedTotal = itemTotal * (1 - discount / 100);
                  
                  return (
                    <div key={index} className="order-item">
                      <div className="item-image">
                        <img src={item.image || 'https://via.placeholder.com/80'} alt={item.title} />
                        {discount > 0 && (
                          <div className="item-discount-badge">{discount}% OFF</div>
                        )}
                      </div>
                      <div className="item-details">
                        <h4 className="item-title">{item.title}</h4>
                        <p className="item-meta">
                          £{item.price.toFixed(2)} × {item.quantity} tickets
                        </p>
                        
                        {/* Bulk Discount Buttons */}
                        <div className="bulk-discount-btns">
                          <span className="bulk-label">Quick Update:</span>
                          {[10, 25, 50, 100].map(qty => (
                            <button
                              key={qty}
                              onClick={() => handleBulkUpdate(item.competition_id, qty)}
                              className={`bulk-qty-btn ${item.quantity === qty ? 'active' : ''}`}
                            >
                              {qty}
                              {getBulkDiscount(qty) > 0 && (
                                <span className="btn-discount">-{getBulkDiscount(qty)}%</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="item-total">
                        {discount > 0 && (
                          <div className="item-original-price">£{itemTotal.toFixed(2)}</div>
                        )}
                        £{discountedTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="breakdown-row discount">
                    <span>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                      </svg>
                      Discount ({cart.coupon_code})
                    </span>
                    <span className="discount-amount">-£{cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="breakdown-row total">
                  <span>Total</span>
                  <span className="total-amount">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="checkout-card coupon-card">
              <h3 className="coupon-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                </svg>
                Have a coupon code?
              </h3>
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="coupon-input"
                  disabled={couponLoading || cart.coupon_code}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim() || cart.coupon_code}
                  className="coupon-apply-btn"
                >
                  {couponLoading ? 'Applying...' : cart.coupon_code ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
              {couponSuccess && (
                <div className="coupon-success">
                  ✓ Coupon applied successfully!
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Payment */}
          <div className="checkout-right">
            <div className="checkout-card payment-card">
              <h2 className="checkout-section-title">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
                Payment Method
              </h2>

              <div className="payment-methods">
                {/* Site Credit */}
                <label className={`payment-option ${
                  paymentMethod === 'site_credit' ? 'selected' : ''
                } ${!isBalanceSufficient('site_credit') ? 'insufficient' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="site_credit"
                    checked={paymentMethod === 'site_credit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
                      </svg>
                      <div>
                        <span className="payment-name">Site Credit</span>
                        <span className="payment-balance">Balance: £{user?.site_credit_balance?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    {!isBalanceSufficient('site_credit') && (
                      <span className="insufficient-badge">Insufficient Balance</span>
                    )}
                  </div>
                </label>

                {/* Cash Balance */}
                <label className={`payment-option ${
                  paymentMethod === 'cash' ? 'selected' : ''
                } ${!isBalanceSufficient('cash') ? 'insufficient' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                      </svg>
                      <div>
                        <span className="payment-name">Cash Balance</span>
                        <span className="payment-balance">Balance: £{user?.cash_balance?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    {!isBalanceSufficient('cash') && (
                      <span className="insufficient-badge">Insufficient Balance</span>
                    )}
                  </div>
                </label>

                {/* Card Payment */}
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-option-header">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                      </svg>
                      <div>
                        <span className="payment-name">Credit / Debit Card</span>
                        <span className="payment-balance mocked-badge">Mocked Payment</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {error && <div className="checkout-error">{error}</div>}

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={loading || !isBalanceSufficient(paymentMethod)}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Complete Purchase - £{total.toFixed(2)}
                  </>
                )}
              </button>

              <div className="secure-badge">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Secure & encrypted payment
              </div>
            </div>

            {/* Upsell Section with Quick Add */}
            {upsellCompetitions.length > 0 && (
              <div className="checkout-card upsell-card">
                <h3 className="upsell-title">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  You might also like...
                </h3>
                <div className="upsell-items">
                  {upsellCompetitions.map((comp) => (
                    <div
                      key={comp.id}
                      className="upsell-item"
                    >
                      <img 
                        src={comp.image} 
                        alt={comp.title}
                        onClick={() => navigate(`/competition/${comp.id}`)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="upsell-info">
                        <h4 onClick={() => navigate(`/competition/${comp.id}`)}>{comp.title}</h4>
                        <p className="upsell-price">£{comp.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleQuickAddUpsell(comp)}
                        disabled={addingUpsell === comp.id}
                        className="upsell-quick-add"
                      >
                        {addingUpsell === comp.id ? (
                          <>
                            <svg className="spinner-small" width="14" height="14" viewBox="0 0 24 24">
                              <circle className="spinner-circle" cx="12" cy="12" r="10" />
                            </svg>
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Quick Add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
