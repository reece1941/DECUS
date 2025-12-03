import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ProtectedAdminRoute.css';

const ProtectedAdminRoute = ({ children }) => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If not logged in, show login screen
  if (!user) {
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        await login(email, password);
        // The component will re-render after login
      } catch (err) {
        setError('Invalid email or password');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>🎰 Admin Access</h1>
            <p>Please login to access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-field">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to Admin'}
            </button>
          </form>

          <div className="admin-login-footer">
            <a href="/">← Back to Main Site</a>
          </div>
        </div>
      </div>
    );
  }

  // If logged in but not admin, redirect to home
  if (!user.is_admin) {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <h1>🚫 Access Denied</h1>
          <p>You do not have permission to access the admin dashboard.</p>
          <p>Only administrators can access this area.</p>
          <div className="access-denied-actions">
            <a href="/" className="btn-home">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in and is admin - show admin content
  return children;
};

export default ProtectedAdminRoute;
