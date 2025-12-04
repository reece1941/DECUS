import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionsAPI } from '../../services/api';
import './CompetitionsList.css';

const CompetitionsList = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const { data } = await competitionsAPI.getAll();
      setCompetitions(data);
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      alert('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await competitionsAPI.delete(id);
      setDeleteModal(null);
      fetchCompetitions();
      alert('Competition deleted successfully');
    } catch (error) {
      console.error('Failed to delete competition:', error);
      alert('Failed to delete competition');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading competitions...</p>
      </div>
    );
  }

  return (
    <div className="competitions-list">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Competitions</h1>
        <p className="admin-page-subtitle">
          Manage all competitions, create new ones, and edit existing entries
        </p>
      </div>

      <div className="admin-actions">
        <button
          onClick={() => navigate('/admin/competitions/create')}
          className="admin-btn-primary"
        >
          <span>+</span> Create Competition
        </button>
      </div>

      {competitions.length === 0 ? (
        <div className="empty-state">
          <p>No competitions yet. Create your first one!</p>
        </div>
      ) : (
        <div className="competitions-table-container">
          <table className="competitions-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Price</th>
                <th>Tickets</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => (
                <tr key={comp.id}>
                  <td>
                    <div className="comp-image">
                      {comp.image ? (
                        <img src={comp.image} alt={comp.title} />
                      ) : comp.video ? (
                        <video src={comp.video} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="comp-title-cell">
                      <strong>{comp.title}</strong>
                      <span className="comp-subtitle">{comp.subtitle}</span>
                    </div>
                  </td>
                  <td>£{comp.price.toFixed(2)}</td>
                  <td>
                    <div className="ticket-info">
                      <span>{comp.sold}%</span>
                      <small>{comp.max_tickets} max</small>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        comp.end_datetime &&
                        new Date(comp.end_datetime) < new Date()
                          ? 'ended'
                          : 'active'
                      }`}
                    >
                      {comp.end_datetime &&
                      new Date(comp.end_datetime) < new Date()
                        ? 'Ended'
                        : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="comp-tags">
                      {comp.hot && <span className="tag hot">Hot</span>}
                      {comp.instant && <span className="tag instant">Instant</span>}
                      {comp.tags?.map((tag, i) => (
                        <span key={i} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() =>
                          navigate(`/admin/competitions/${comp.id}/entries`)
                        }
                        className="btn-entries"
                        title="View Entries"
                      >
                        📋
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/competitions/edit/${comp.id}`)
                        }
                        className="btn-edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteModal(comp)}
                        className="btn-delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Competition?</h2>
            <p>
              Are you sure you want to delete <strong>{deleteModal.title}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn-cancel"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="btn-confirm-delete"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionsList;