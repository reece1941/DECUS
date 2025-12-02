import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { competitionsAPI } from '../services/api';
import Header from '../components/Header/Header';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, itemCount, subtotal, total, addToCart } = useCart();
  const [recommendations, setRecommendations] = React.useState([]);
  const [addingItem, setAddingItem] = useState(null);

  React.useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data } = await competitionsAPI.getAll();
      const currentIds = cart.items.map(item => item.competition_id);
      const suggestions = data
        .filter(comp => !currentIds.includes(comp.id))
        .slice(0, 4);
      setRecommendations(suggestions);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const handleQuickAdd = async (comp) => {
    setAddingItem(comp.id);
    await addToCart({
      competition_id: comp.id,
      title: comp.title,
      price: comp.price,
      quantity: 1,
      image: comp.image || comp.video,
    });
    setAddingItem(null);
    await fetchRecommendations();
  };

  const getBulkDiscount = (quantity) => {
    if (quantity >= 100) return 20;
    if (quantity >= 50) return 15;
    if (quantity >= 25) return 10;
    if (quantity >= 10) return 5;
    return 0;
  };

  if (itemCount === 0) {
    return (
      <div className="cart-page">
        <Header />
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </div>
          <h1>Your Cart is Empty</h1>
          <p>Start adding competitions to your cart!</p>
          <button onClick={() => navigate('/')} className="browse-btn">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Browse Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />
      
      <div className="cart-container">
        <div className="cart-content">
          {/* Left - Cart Items */}
          <div className="cart-left">
            <div className="cart-header">
              <h1 className="cart-title">
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                Your Cart
              </h1>
              <div className="cart-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</div>
            </div>

            <div className="cart-items">
              {cart.items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const discount = getBulkDiscount(item.quantity);
                const discountedTotal = itemTotal * (1 - discount / 100);
                
                return (
                  <div key={index} className="cart-item-card">
                    <div className="cart-item-image">
                      <img src={item.image || 'https://via.placeholder.com/120'} alt={item.title} />
                      {discount > 0 && (
                        <div className="discount-badge">{discount}% OFF</div>
                      )}
                    </div>
                    
                    <div className="cart-item-details">
                      <h3 className="cart-item-title">{item.title}</h3>
                      <p className="cart-item-price">£{item.price.toFixed(2)} per ticket</p>
                      
                      <div className="cart-item-quantity">
                        <button 
                          onClick={() => updateQuantity(item.competition_id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          −
                        </button>
                        <div className="qty-display">{item.quantity}</div>
                        <button 
                          onClick={() => updateQuantity(item.competition_id, item.quantity + 1)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>

                      {/* Bulk Select Buttons */}
                      <div className="bulk-quick-select">
                        {[10, 25, 50, 100].map(qty => (
                          <button
                            key={qty}
                            onClick={() => updateQuantity(item.competition_id, qty)}
                            className={`bulk-quick-btn ${item.quantity === qty ? 'active' : ''}`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => updateQuantity(item.competition_id, 0)}
                        className="remove-btn"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Remove
                      </button>
                    </div>

                    <div className="cart-item-total">
                      {discount > 0 && (
                        <div className="original-price">£{itemTotal.toFixed(2)}</div>
                      )}
                      <div className="final-price">£{discountedTotal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendations in Cart */}
            {recommendations.length > 0 && (
              <div className="cart-recommendations">
                <h2 className="recommendations-title">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Complete Your Collection
                </h2>
                <div className="recommendations-grid">
                  {recommendations.map((comp) => (
                    <div key={comp.id} className="recommendation-card">
                      <div 
                        className="recommendation-image"
                        onClick={() => navigate(`/competition/${comp.id}`)}
                      >
                        <img src={comp.image} alt={comp.title} />
                      </div>
                      <div className="recommendation-info">
                        <h4 onClick={() => navigate(`/competition/${comp.id}`)}>{comp.title}</h4>
                        <p className="recommendation-price">£{comp.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleQuickAdd(comp)}
                        disabled={addingItem === comp.id}
                        className="quick-add-btn"
                      >
                        {addingItem === comp.id ? 'Adding...' : '+ Quick Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Order Summary */}
          <div className="cart-right">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="summary-row discount">
                    <span>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                      </svg>
                      Coupon Discount
                    </span>
                    <span>-£{cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span className="total-amount">£{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="checkout-btn"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Proceed to Checkout
              </button>

              <div className="secure-info">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Secure checkout
              </div>
            </div>

            {/* Bulk Discount Info */}
            <div className="bulk-discount-info">
              <h3>💰 Bulk Discounts Available</h3>
              <div className="discount-tiers">
                <div className="discount-tier">
                  <span>10+ tickets</span>
                  <span className="tier-discount">5% OFF</span>
                </div>
                <div className="discount-tier">
                  <span>25+ tickets</span>
                  <span className="tier-discount">10% OFF</span>
                </div>
                <div className="discount-tier">
                  <span>50+ tickets</span>
                  <span className="tier-discount">15% OFF</span>
                </div>
                <div className="discount-tier highlighted">
                  <span>100+ tickets</span>
                  <span className="tier-discount">20% OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;