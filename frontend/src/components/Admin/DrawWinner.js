import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DrawWinner.css';

const DrawWinner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [winner, setWinner] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await axios.get(`${backendUrl}/api/competitions/${id}`);
      setCompetition(res.data);
    } catch (error) {
      console.error('Failed to fetch competition:', error);
    }
  };

  const handleSearch = async () => {
    if (!ticketNumber || ticketNumber.trim() === '') {
      alert('Please enter a ticket number');
      return;
    }

    try {
      setSearching(true);
      setWinner(null);
      setNotFound(false);

      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      const res = await axios.post(
        `${backendUrl}/api/admin/competitions/${id}/find-winner`,
        parseInt(ticketNumber),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.found) {
        setWinner(res.data.winner);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleMarkWinner = async () => {
    if (!window.confirm(`Mark ${winner.name} as the winner?`)) {
      return;
    }

    try {
      setMarking(true);
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      await axios.post(
        `${backendUrl}/api/admin/competitions/${id}/mark-winner`,
        parseInt(ticketNumber),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert('Winner marked successfully!');
      navigate(`/admin/competitions/${id}/entries`);
    } catch (error) {
      console.error('Failed to mark winner:', error);
      alert('Failed to mark winner. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="draw-winner-page">
      <div className="draw-winner-container">
        <button
          onClick={() => navigate(`/admin/competitions/${id}/entries`)}
          className="back-button"
        >
          ← Back to Entries
        </button>

        <h1 className="draw-title">🎲 Draw Winner</h1>
        <p className="draw-subtitle">
          {competition?.title || 'Competition'}
        </p>

        {/* Ticket Finder */}
        <div className="ticket-finder">
          <label htmlFor="ticketNumber">Enter Winning Ticket Number</label>
          <div className="input-group">
            <input
              id="ticketNumber"
              type="number"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="e.g., 12345"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="search-button"
            >
              {searching ? 'Searching...' : 'Find Winner'}
            </button>
          </div>
        </div>

        {/* Results */}
        {notFound && (
          <div className="result-box not-found">
            <div className="result-icon">❌</div>
            <h2>Ticket Not Found</h2>
            <p>
              Ticket number <strong>{ticketNumber}</strong> was not found in
              the entry list.
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Make sure the ticket number has been purchased for this
              competition.
            </p>
          </div>
        )}

        {winner && (
          <div className="result-box winner-found">
            <div className="result-icon">🎉</div>
            <h2>Winner Found!</h2>

            <div className="winner-details">
              <div className="detail-row">
                <span className="detail-label">Ticket Number:</span>
                <span className="detail-value ticket-badge">
                  #{ticketNumber}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Winner Name:</span>
                <span className="detail-value">{winner.name}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{winner.email}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Purchase Date:</span>
                <span className="detail-value">
                  {new Date(winner.purchase_date).toLocaleString()}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">
                  <code>{winner.order_id.substring(0, 12)}...</code>
                </span>
              </div>
            </div>

            <button
              onClick={handleMarkWinner}
              disabled={marking}
              className="mark-winner-button"
            >
              {marking ? 'Marking Winner...' : '✓ Confirm & Mark as Winner'}
            </button>

            <p className="warning-text">
              ⚠️ This will mark the competition as finished and set this user
              as the winner.
            </p>
          </div>
        )}

        {/* Instructions */}
        {!winner && !notFound && (
          <div className="instructions-box">
            <h3>How to Use:</h3>
            <ol>
              <li>Enter the winning ticket number in the field above</li>
              <li>Click "Find Winner" to search the entry list</li>
              <li>
                If found, the winner's details will be displayed automatically
              </li>
              <li>Click "Confirm & Mark as Winner" to finalize</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawWinner;
