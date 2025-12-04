import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CompetitionEntries.css';

const CompetitionEntries = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      // Fetch competition details
      const compRes = await axios.get(`${backendUrl}/api/competitions/${id}`);
      setCompetition(compRes.data);

      // Fetch entries
      const entriesRes = await axios.get(
        `${backendUrl}/api/admin/competitions/${id}/entries`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntries(entriesRes.data.entries);
      setMetrics(entriesRes.data.metrics);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      alert('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.order_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading entries...</p>
      </div>
    );
  }

  return (
    <div className="entries-page">
      <div className="admin-page-header">
        <div>
          <button
            onClick={() => navigate('/admin/competitions')}
            style={{
              padding: '8px 16px',
              background: '#e9ecef',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            ← Back to Competitions
          </button>
          <h1 className="admin-page-title">
            Entry List: {competition?.title}
          </h1>
          <p className="admin-page-subtitle">
            View all entries and ticket allocations for this competition
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/competitions/${id}/draw-winner`)}
          className="admin-btn-primary"
          style={{ marginTop: '16px' }}
        >
          🎲 Draw Winner
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Entries</div>
          <div className="metric-value">{metrics.total_entries || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Tickets</div>
          <div className="metric-value">{metrics.total_tickets || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Unique Users</div>
          <div className="metric-value">{metrics.unique_users || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">£{(metrics.total_revenue || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, email, or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Entries Table */}
      <div className="entries-table-container">
        <table className="entries-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Tickets</th>
              <th>Ticket Numbers</th>
              <th>Total Paid</th>
              <th>Order ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  No entries found
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.user_name || 'Unknown'}</strong>
                  </td>
                  <td>{entry.user_email}</td>
                  <td>
                    <span className="badge">{entry.quantity}</span>
                  </td>
                  <td>
                    <div className="ticket-numbers">
                      {entry.ticket_numbers.slice(0, 10).join(', ')}
                      {entry.ticket_numbers.length > 10 &&
                        ` ... (+${entry.ticket_numbers.length - 10} more)`}
                    </div>
                  </td>
                  <td>£{entry.total_paid.toFixed(2)}</td>
                  <td>
                    <code>{entry.order_id.substring(0, 8)}</code>
                  </td>
                  <td>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompetitionEntries;