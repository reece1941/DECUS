import React, { useRef, useState, useEffect } from 'react';
import CompetitionCard from '../CompetitionCard/CompetitionCard';
import './CompetitionGrid.css';

const CompetitionGrid = ({ competitions, loading }) => {
  const gridRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    updateScrollButtons();
  }, [competitions]);

  const updateScrollButtons = () => {
    if (!gridRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = gridRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!gridRef.current) return;
    
    const cardWidth = gridRef.current.querySelector('.decus-card')?.offsetWidth || 300;
    const gap = 30;
    const itemsVisible = window.innerWidth <= 768 ? 2 : 4;
    const scrollAmount = (cardWidth + gap) * itemsVisible;
    
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    
    gridRef.current.style.transform = `translateX(-${newPosition}px)`;
    setScrollPosition(newPosition);
    
    setTimeout(updateScrollButtons, 400);
  };

  if (loading) {
    return (
      <div className="decus-grid-wrapper">
        <div className="decus-loading">Loading competitions...</div>
      </div>
    );
  }

  if (!competitions || competitions.length === 0) {
    return (
      <div className="decus-grid-wrapper">
        <div className="decus-empty">No competitions available</div>
      </div>
    );
  }

  return (
    <div className="decus-grid-wrapper">
      {/* Left Arrow */}
      <button
        className={`decus-carousel-arrow left ${!canScrollLeft ? 'disabled' : ''}`}
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
      >
        ‹
      </button>

      {/* Grid */}
      <div className="decus-grid" ref={gridRef}>
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>

      {/* Right Arrow */}
      <button
        className={`decus-carousel-arrow right ${!canScrollRight ? 'disabled' : ''}`}
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
      >
        ›
      </button>
    </div>
  );
};

export default CompetitionGrid;
