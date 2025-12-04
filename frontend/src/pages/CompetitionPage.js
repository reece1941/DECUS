import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header/Header';
import './CompetitionPage.css';

const CompetitionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [countdown, setCountdown] = useState({ d: '--', h: '--', m: '--', s: '--' });

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  useEffect(() => {
    if (competition?.end_datetime) {
      const timer = setInterval(() => {
        updateCountdown();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [competition]);

  const fetchCompetition = async () => {
    try {
      const { data } = await competitionsAPI.getById(id);
      setCompetition(data);
    } catch (error) {
      console.error('Failed to fetch competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!competition.end_datetime) return;
    
    const now = new Date();
    const end = new Date(competition.end_datetime);
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    
    if (diff === 0) {
      setCountdown({ d: '00', h: '00', m: '00', s: '00' });
      return;
    }
    
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = Math.floor(diff % 60);
    
    setCountdown({
      d: String(d).padStart(2, '0'),
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0'),
    });
  };

  const handleQuantityChange = (newQty) => {
    setQuantity(Math.max(1, Math.min(100, newQty)));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to enter competitions');
      return;
    }
    
    const result = await addToCart({
      competition_id: competition.id,
      title: competition.title,
      price: competition.price,
      quantity: quantity,
      image: competition.image || competition.video,
    });
    
    if (result.success) {
      navigate('/cart');
    } else {
      alert(result.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="loading-page">Loading competition...</div>;
  }

  if (!competition) {
    return <div className="error-page">Competition not found</div>;
  }

  // Calculate total with bulk discount if applicable
  const getBulkPrice = (qty) => {
    if (!competition.bulk_bundles || competition.bulk_bundles.length === 0) {
      return qty * competition.price;
    }
    
    // Find matching bundle
    const bundle = competition.bulk_bundles.find(b => b.quantity === qty);
    if (bundle) {
      const discountMultiplier = 1 - (bundle.discount_percent / 100);
      return qty * competition.price * discountMultiplier;
    }
    
    return qty * competition.price;
  };

  const total = getBulkPrice(quantity);
  const bulkBundles = competition.bulk_bundles && competition.bulk_bundles.length > 0
    ? competition.bulk_bundles
    : [
      { quantity: 10, discount_percent: 0 },
      { quantity: 25, discount_percent: 5 },
      { quantity: 50, discount_percent: 10 },
      { quantity: 100, discount_percent: 15 }
    ];
  
  const benefits = competition.benefits && competition.benefits.length > 0 
    ? competition.benefits 
    : [
      '£400 monthly rent contribution',
      'Direct payment to landlord available',
      'Coverage for 6 consecutive months',
      'No restrictions on property type'
    ];

  const howItWorksSteps = competition.how_it_works && competition.how_it_works.length > 0
    ? competition.how_it_works
    : [
      { step_number: 1, step_text: 'Purchase your competition tickets' },
      { step_number: 2, step_text: 'Live draw conducted at competition end' },
      { step_number: 3, step_text: 'Winner verification within 48 hours' },
      { step_number: 4, step_text: 'Prize delivered or transferred to winner' }
    ];

  return (
    <div className="competition-page">
      <Header />
      
      {/* Background Effects */}
      <div className="decus-bg-effects">
        <div className="decus-bg-gradient" />
        <div className="decus-bg-glow1" />
        <div className="decus-bg-glow2" />
      </div>

      <div className="decus-single-wrapper">
        {/* Back Button */}
        <button onClick={() => navigate('/')} className="decus-back-btn">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          Back to Competitions
        </button>

        <div className="decus-single-grid">
          {/* Left Column */}
          <div className="decus-left-col">
            {/* Media Section */}
            <div className="decus-single-media">
              {competition.video ? (
                <video src={competition.video} autoPlay loop muted playsInline />
              ) : competition.image ? (
                <img src={competition.image} alt={competition.title} />
              ) : null}
              
              <div className="decus-media-overlay" />
              
              {/* Badges */}
              <div className="decus-badges">
                {competition.hot && (
                  <div className="decus-badge decus-hot">🔥 HOT</div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="decus-content-section">
              <div className="decus-single-header">
                <h1 className="decus-single-title">{competition.title}</h1>
                <p className="decus-single-subtitle">{competition.subtitle || competition.description}</p>
              </div>

              {/* Prize Value Box */}
              <div className="decus-prize-value-box">
                <div>
                  <div className="decus-prize-label">Prize Value</div>
                  <div className="decus-prize-amount">£{competition.prize_value || '0'}</div>
                </div>
                <div className="decus-prize-period">6 months<br />£400/month</div>
              </div>

              {/* Prize Benefits */}
              <div className="decus-benefits-section">
                <h3 className="decus-benefits-title">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Prize Benefits
                </h3>
                <div className="decus-benefits-grid">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="decus-benefit-item">
                      <div className="decus-benefit-check">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                      <div className="decus-benefit-text">{benefit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="decus-works-section">
                <h3 className="decus-works-title">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  How It Works
                </h3>
                <div className="decus-steps-list">
                  {howItWorksSteps.map((step) => (
                    <div key={step.step_number} className="decus-step-item">
                      <div className="decus-step-number">{step.step_number}</div>
                      <div className="decus-step-text">{step.step_text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instant Wins */}
              {competition.instant && competition.instant_wins && competition.instant_wins.length > 0 && (
                <div className="decus-instant-section">
                  <h3 className="decus-instant-title">
                    <span>🎁</span>
                    <span>Instant Win Prizes</span>
                  </h3>
                  <div className="decus-instant-grid">
                    {competition.instant_wins.map((win, index) => (
                      <div key={index} className="decus-instant-item">
                        <span className="name">{win.name}</span>
                        <span className="qty">{win.qty}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Panel */}
          <div className="decus-right-col">
            <div className="decus-purchase-panel">
              {/* Countdown Timer */}
              {competition.end_datetime && (
                <>
                  <div className="decus-countdown-header">COMPETITION ENDS IN</div>
                  <div className="decus-countdown-grid">
                    <div className="decus-countdown-item">
                      <span className="decus-countdown-value">{countdown.d}</span>
                      <span className="decus-countdown-label">DAYS</span>
                    </div>
                    <div className="decus-countdown-item">
                      <span className="decus-countdown-value">{countdown.h}</span>
                      <span className="decus-countdown-label">HRS</span>
                    </div>
                    <div className="decus-countdown-item">
                      <span className="decus-countdown-value">{countdown.m}</span>
                      <span className="decus-countdown-label">MIN</span>
                    </div>
                    <div className="decus-countdown-item">
                      <span className="decus-countdown-value">{countdown.s}</span>
                      <span className="decus-countdown-label">SEC</span>
                    </div>
                  </div>
                </>
              )}

              {/* Progress Stats */}
              <div className="decus-progress-stats">
                <div className="decus-stat-item">
                  <span className="decus-stat-value">{competition.tickets_sold?.toLocaleString()}</span>
                  <span className="decus-stat-label">PLAYERS</span>
                </div>
                <div className="decus-stat-item">
                  <span className="decus-stat-value">{competition.sold}%</span>
                  <span className="decus-stat-label">SOLD</span>
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="decus-tickets-section">
                <div className="decus-tickets-label">Select Tickets</div>
                
                {/* Quantity Selector */}
                <div className="decus-qty-selector">
                  <button 
                    className="decus-qty-btn minus" 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="decus-qty-input"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      handleQuantityChange(Math.max(1, Math.min(competition.max_tickets_per_user || 1000, val)));
                    }}
                    min="1"
                    max={competition.max_tickets_per_user || 1000}
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#000',
                      background: '#fff'
                    }}
                  />
                  <button 
                    className="decus-qty-btn plus" 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= (competition.max_tickets_per_user || 1000)}
                  >
                    +
                  </button>
                </div>
                
                {/* Quick Select */}
                <div className="decus-quick-select">
                  {[5, 10, 25, 50].map(qty => (
                    <button 
                      key={qty}
                      className="decus-quick-btn" 
                      onClick={() => setQuantity(qty)}
                    >
                      {qty}
                    </button>
                  ))}
                </div>

                {/* Bulk Bundles */}
                <div className="decus-bulk-section">
                  <div className="decus-bulk-title">Or choose a bulk bundle</div>
                  <div className="decus-bulk-grid">
                    {bulkBundles.map((bundle, index) => {
                      const bundleQty = bundle.quantity;
                      const discount = bundle.discount_percent;
                      const originalPrice = bundleQty * competition.price;
                      const bundleTotal = originalPrice * (1 - discount / 100);
                      const savings = originalPrice - bundleTotal;
                      const isBest = index === bulkBundles.length - 1;
                      return (
                        <button
                          key={bundleQty}
                          className="decus-bulk-card"
                          onClick={() => setQuantity(bundleQty)}
                        >
                          {isBest && <span className="decus-bulk-tag">Best Value</span>}
                          {discount > 0 && !isBest && <span className="decus-bulk-tag" style={{background: '#28a745'}}>{discount}% OFF</span>}
                          <span className="decus-bulk-size">{bundleQty} Tickets</span>
                          <span className="decus-bulk-price">£{bundleTotal.toFixed(2)}</span>
                          {savings > 0 && <span className="decus-bulk-note" style={{color: '#28a745', fontWeight: '600'}}>Save £{savings.toFixed(2)}</span>}
                          {savings === 0 && <span className="decus-bulk-note">Tap to auto-fill quantity</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="decus-price-display">
                <div className="decus-price-info">
                  <div className="decus-ticket-price">Ticket Price</div>
                  <div className="decus-ticket-price" style={{ color: '#fff', fontWeight: 600 }}>
                    £{competition.price.toFixed(2)}
                  </div>
                  <div className="decus-qty-count">Quantity × {quantity}</div>
                </div>
                <div>
                  <div className="decus-total-label">Total</div>
                  <div className="decus-total-price">£{total.toFixed(2)}</div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button className="decus-enter-btn" onClick={handleAddToCart}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
                </svg>
                ENTER COMPETITION
              </button>

              {/* Secure Payment */}
              <div className="decus-secure-payment">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Secure Payment • Instant Entry
              </div>

              {/* Free Entry Toggle */}
              <div className="decus-free-entry-toggle">
                <a href="#" className="decus-free-entry-link" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('freeEntryContent').classList.toggle('show');
                }}>
                  Free Entry Route
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </a>
                <div className="decus-free-entry-content" id="freeEntryContent">
                  <div className="decus-free-entry-text">
                    Enter for free by sending your details on a postcard or in a sealed envelope.
                  </div>
                  <div className="decus-free-entry-address">
                    <strong>SEND TO:</strong>
                    <p>Prize Nation Competitions</p>
                    <p>123 Competition House</p>
                    <p>London, W1A 1AA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionPage;
