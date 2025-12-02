import React from 'react';
import CompetitionCard from '../CompetitionCard/CompetitionCard';
import './CompetitionGrid.css';

const CompetitionGrid = ({ competitions, loading }) => {
  if (loading) {
    return (
      <div className="decus-grid-wrapper">
        <div className="decus-grid">
          <div className="decus-loading">Loading competitions...</div>
        </div>
      </div>
    );
  }

  if (!competitions || competitions.length === 0) {
    return (
      <div className="decus-grid-wrapper">
        <div className="decus-grid">
          <div className="decus-empty">No competitions available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="decus-grid-wrapper">
      <div className="decus-grid">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>
    </div>
  );
};

export default CompetitionGrid;
