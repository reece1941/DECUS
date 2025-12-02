import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const [revealedWins, setRevealedWins] = useState({});

  if (!order) {
    return (
      <div className="thankyou-page">
        <Header />
        <div className="thankyou-empty">
          <h1>Order Not Found</h1>
          <button onClick={() => navigate('/')} className="home-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Group instant wins by competition
  const instantWinsByComp = {};
  if (order.tickets) {
    order.tickets.forEach(ticket => {
      if (ticket.instant_wins && ticket.instant_wins.length > 0) {
        if (!instantWinsByComp[ticket.title]) {
          instantWinsByComp[ticket.title] = [];
        }
        ticket.instant_wins.forEach(win => {
          instantWinsByComp[ticket.title].push({
            prize: win.prize,
            ticket_numbers: win.ticket_numbers || [],
          });
        });
      }
    });
  }

  const hasInstantWins = Object.keys(instantWinsByComp).length > 0;

  const handleReveal = (compTitle, index) => {
    const key = `${compTitle}-${index}`;
    setRevealedWins(prev => ({ ...prev, [key]: true }));
  };

  const getPrizeIcon = (prizeValue) => {
    const value = parseFloat(prizeValue?.replace(/[^0-9.]/g, '') || 0);
    if (value >= 100) return '💎';
    if (value >= 50) return '🥇';
    if (value >= 20) return '🥈';
    if (value >= 10) return '🥉';
    return '🎁';
  };

  const getPrizeColor = (prizeValue) => {
    const value = parseFloat(prizeValue?.replace(/[^0-9.]/g, '') || 0);
    if (value >= 100) return 'gold';
    if (value >= 50) return 'gold';
    if (value >= 20) return 'silver';
    if (value >= 10) return 'copper';
    return 'default';
  };

  return (
    <div className="thankyou-page">
      <Header />

      <div className="thankyou-container">
        {/* Success Header */}
        <div className="thankyou-header">
          <div className="success-icon">
            <svg width="80" height="80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <h1 className="thankyou-title">Thank You for Your Purchase!</h1>
          <p className="thankyou-subtitle">Your order has been confirmed and your tickets are secured</p>
        </div>

        {/* Order Details */}
        <div className="order-details-card">
          <h2 className="section-title">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            Order Details
          </h2>
          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="info-label">Order Number</span>
              <span className="info-value">#{order.order_number}</span>
            </div>
            <div className="order-info-item">
              <span className="info-label">Total Paid</span>
              <span className="info-value">£{order.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="order-info-item">
              <span className="info-label">Payment Method</span>
              <span className="info-value payment-badge">{order.payment_method?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Instant Wins Section */}
        {hasInstantWins && (
          <div className="instant-wins-section">
            <div className="instant-wins-header">
              <h2 className="section-title instant-win-title">
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                🎉 Congratulations! You've Won Instant Prizes!
              </h2>
              <p className="instant-wins-subtitle">Click each prize card to reveal your winnings</p>
            </div>

            {Object.entries(instantWinsByComp).map(([compTitle, wins]) => (
              <div key={compTitle} className="competition-wins">
                <h3 className="comp-wins-title">{compTitle}</h3>
                <div className="instant-wins-grid">
                  {wins.map((win, index) => {
                    const key = `${compTitle}-${index}`;
                    const isRevealed = revealedWins[key];
                    const prizeColor = getPrizeColor(win.prize);
                    
                    return (
                      <div
                        key={key}
                        className={`instant-win-card ${prizeColor} ${isRevealed ? 'revealed' : 'unrevealed'}`}
                        onClick={() => !isRevealed && handleReveal(compTitle, index)}
                      >
                        {!isRevealed ? (
                          <div className="scratch-overlay">
                            <div className="scratch-content">
                              <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
                              </svg>
                              <p className="scratch-text">Click to Reveal</p>
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="prize-content">
                          <div className="prize-vault">
                            <div className="vault-door">
                              <div className="vault-inner">
                                <div className="gold-bar">
                                  <span className="prize-value">{win.prize}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="prize-info">
                            <h4 className="prize-title">{win.prize}</h4>
                            <div className="prize-details">
                              <p className="winning-tickets">Winning Tickets:</p>
                              <div className="ticket-numbers">
                                {win.ticket_numbers.map((ticketNum, idx) => (
                                  <span key={idx} className="ticket-chip">
                                    #{ticketNum}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ticket Numbers Section */}
        {order.tickets && order.tickets.length > 0 && (
          <div className="tickets-section">
            <h2 className="section-title">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z" />
              </svg>
              Your Ticket Numbers
            </h2>
            <div className="tickets-grid">
              {order.tickets.map((ticket, idx) => (
                <div key={idx} className="ticket-card">
                  <h3 className="ticket-title">{ticket.title}</h3>
                  <div className="ticket-numbers-container">
                    {ticket.numbers?.map((t, index) => (
                      <span key={index} className="ticket-number">
                        #{t.number}
                      </span>
                    ))}
                  </div>
                  {ticket.numbers?.length > 0 && (
                    <p className="ticket-count">{ticket.numbers.length} ticket{ticket.numbers.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="next-steps-card">
          <h2 className="section-title">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            What Happens Next?
          </h2>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Tickets Secured</h4>
                <p>Your tickets are safely stored in your account</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Winner Announcement</h4>
                <p>We'll notify you via email when winners are drawn</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Claim Your Prize</h4>
                <p>Winners will receive instructions on claiming their prizes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="thankyou-actions">
          <button onClick={() => navigate('/')} className="action-btn primary">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Browse More Competitions
          </button>
          <button onClick={() => window.print()} className="action-btn secondary">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;