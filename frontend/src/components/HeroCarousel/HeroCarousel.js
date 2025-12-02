import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroCarousel.css';

const HeroCarousel = ({ competitions = [] }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(null);

  // Filter featured competitions or use first 3
  const slides = competitions.slice(0, 3);

  useEffect(() => {
    if (isAutoPlaying && slides.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % slides.length;
    goToSlide(newIndex);
  };

  if (!slides.length) return null;

  return (
    <div className="hero-carousel">
      <div className="carousel-container">
        {/* Slides */}
        <div 
          className="carousel-slides" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((competition, index) => (
            <div key={competition.id} className="carousel-slide">
              {/* Background Media */}
              <div className="slide-media">
                {competition.video ? (
                  <video
                    src={competition.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="slide-video"
                  />
                ) : (
                  <img
                    src={competition.image}
                    alt={competition.title}
                    className="slide-image"
                  />
                )}
                <div className="slide-overlay"></div>
              </div>

              {/* Slide Content */}
              <div className="slide-content">
                <div className="slide-badges">
                  {competition.hot && (
                    <span className="slide-badge hot">🔥 HOT ODDS</span>
                  )}
                  {competition.instant && (
                    <span className="slide-badge instant">⚡ INSTANT WINS</span>
                  )}
                </div>

                <h2 className="slide-title">{competition.title}</h2>
                <p className="slide-subtitle">{competition.subtitle || competition.description}</p>

                <div className="slide-stats">
                  <div className="slide-stat">
                    <span className="stat-label">Prize Value</span>
                    <span className="stat-value">£{competition.prize_value || competition.price}</span>
                  </div>
                  <div className="slide-stat">
                    <span className="stat-label">Tickets Sold</span>
                    <span className="stat-value">{competition.sold || 0}/{competition.max_tickets}</span>
                  </div>
                  <div className="slide-stat">
                    <span className="stat-label">Entry Price</span>
                    <span className="stat-value">£{competition.price.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className="slide-cta"
                  onClick={() => navigate(`/competition/${competition.id}`)}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Enter Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button 
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <button 
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {slides.length > 1 && (
          <div className="carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;