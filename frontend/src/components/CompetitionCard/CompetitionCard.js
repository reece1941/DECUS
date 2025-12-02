import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import './CompetitionCard.css';

const CompetitionCard = ({ competition }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (competition.end_datetime) {
      const timer = setInterval(() => {
        updateCountdown();
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [competition.end_datetime]);

  const updateCountdown = () => {
    if (!competition.end_datetime) return;
    
    const now = new Date();
    const end = new Date(competition.end_datetime);
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    
    if (diff === 0) {
      setTimeLeft('ENDED');
      return;
    }
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) {
      setTimeLeft(`Ends in ${days} day${days !== 1 ? 's' : ''}`);
    } else if (hours > 0) {
      setTimeLeft(`Ends in ${hours} hour${hours !== 1 ? 's' : ''}`);
    } else if (minutes > 0) {
      setTimeLeft(`Ends in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    } else {
      setTimeLeft(`Ends in ${diff} second${diff !== 1 ? 's' : ''}`);
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(Math.max(0, Math.min(100, quantity + delta)));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      return;
    }
    
    if (quantity === 0) {
      navigate(`/competition/${competition.id}`);
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
      alert('Added to cart!');
      setQuantity(0);
    } else {
      alert(result.error || 'Failed to add to cart');
    }
  };

  const total = quantity * competition.price;

  return (
    <article className="decus-card">
      {/* Countdown Badge - Above the card */}
      {timeLeft && (
        <div className={`decus-countdown-badge ${timeLeft === 'ENDED' ? 'ended' : ''}`}>
          <span className="countdown-text">{timeLeft}</span>
        </div>
      )}
      
      {/* Image Section */}
      <div className="decus-img">
        {competition.hot && (
          <div className="decus-badge decus-hot">Hot Odds</div>
        )}
        {competition.instant && (
          <div className="decus-badge decus-instant">INSTANTS</div>
        )}
        
        <div className="decus-img-link" onClick={() => navigate(`/competition/${competition.id}`)}>
          {competition.video ? (
            <video src={competition.video} autoPlay loop muted playsInline />
          ) : (
            <img src={competition.image} alt={competition.title} />
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="decus-content">
        <h3 
          className="decus-title-card"
          onClick={() => navigate(`/competition/${competition.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {competition.title}
        </h3>
        <p className="decus-subtitle">{competition.subtitle}</p>

        {/* Price */}
        <div className="decus-price">
          <div className="label">Entry</div>
          <div className="value">£{competition.price.toFixed(2)}</div>
        </div>

        {/* Quantity Selector */}
        <div className="decus-qty">
          <button 
            className="decus-qty-btn minus"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity === 0}
          >
            −
          </button>
          <div className="decus-qty-display">
            <span className="qty-val">{quantity}</span>
          </div>
          <button 
            className="decus-qty-btn plus"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 100}
          >
            +
          </button>
        </div>

        {/* Total */}
        <div className="decus-total">
          <span>Total</span>
          <span className="value">£{total.toFixed(2)}</span>
        </div>

        {/* Progress Bar */}
        <div className="decus-progress">
          <div className="decus-progress-label">
            <span>Tickets Sold</span>
            <span className="value">{competition.sold}%</span>
          </div>
          <div className="decus-progress-bar">
            <div 
              className="decus-progress-fill" 
              style={{ width: `${competition.sold}%` }}
            />
          </div>
        </div>

        {/* Enter Button */}
        <button 
          className={`decus-enter ${quantity > 0 ? 'has-items' : ''}`}
          onClick={handleAddToCart}
        >
          <span className="txt">
            {quantity > 0 ? 'Add to Cart' : 'View Competition'}
          </span>
          {quantity > 0 && (
            <span className="badge">{quantity}</span>
          )}
        </button>
      </div>
    </article>
  );
};

export default CompetitionCard;
