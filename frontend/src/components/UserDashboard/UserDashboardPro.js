import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './UserDashboardPro.css';

const UserDashboardPro = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redemption state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState({ type: '', text: '' });

  // Support state
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportTickets, setSupportTickets] = useState([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchDashboardData();
    }
  }, [isOpen, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user stats, tickets, orders etc
      setDashboardData({
        activeTickets: 0,
        totalOrders: 0,
        totalSpent: 0,
        totalWins: 0,
        referralCode: user.referral_code || 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        referralCount: 0,
        referralEarnings: 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDashboard = () => {
    setIsOpen(false);
    setActiveTab('overview');
    document.body.style.overflow = '';
  };

  const handleLogout = () => {
    logout();
    closeDashboard();
    navigate('/');
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    
    setRedeemLoading(true);
    setRedeemMessage({ type: '', text: '' });
    
    try {
      const response = await api.post('/redeem', { code: redeemCode });
      setRedeemMessage({
        type: 'success',
        text: response.data.message || 'Code redeemed successfully!'
      });
      setRedeemCode('');
      fetchDashboardData();
    } catch (error) {
      setRedeemMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Invalid or expired code'
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    
    try {
      await api.post('/support/tickets', {
        subject: supportSubject,
        message: supportMessage
      });
      setSupportSubject('');
      setSupportMessage('');
      alert('Support ticket submitted successfully!');
    } catch (error) {
      alert('Failed to submit ticket. Please try again.');
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(dashboardData?.referralCode || '');
    alert('Referral code copied to clipboard!');
  };

  if (!user) return null;

  return (
    <>
      {/* FAB Button */}
      <button 
        className={`user-dashboard-fab ${isOpen ? 'active' : ''}`}
        onClick={openDashboard}
        aria-label="Open Dashboard"
      >
        <svg className="fab-icon" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        {itemCount > 0 && (
          <span className="fab-badge">{itemCount > 99 ? '99+' : itemCount}</span>
        )}
      </button>

      {/* Dashboard Overlay */}
      {isOpen && (
        <div className="dashboard-overlay" onClick={closeDashboard}>
          <div className="dashboard-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="dashboard-header">
              <div className="dashboard-header-left">
                <h1 className="dashboard-title">My Dashboard</h1>
                <p className="dashboard-subtitle">Welcome back, {user.name || user.email}!</p>
              </div>
              <button className="dashboard-close" onClick={closeDashboard}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
              <button
                className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                Overview
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'wallet' ? 'active' : ''}`}
                onClick={() => setActiveTab('wallet')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
                Wallet
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'referrals' ? 'active' : ''}`}
                onClick={() => setActiveTab('referrals')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                Referrals
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'redeem' ? 'active' : ''}`}
                onClick={() => setActiveTab('redeem')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                </svg>
                Redeem
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => setActiveTab('support')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                </svg>
                Support
              </button>
              <button
                className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                Profile
              </button>
            </div>

            {/* Content */}
            <div className="dashboard-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="dashboard-section">
                  {/* Stats Grid */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        🛒
                      </div>
                      <div className="stat-content">
                        <div className="stat-label">Cart Items</div>
                        <div className="stat-value">{itemCount}</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                        🎟️
                      </div>
                      <div className="stat-content">
                        <div className="stat-label">Active Tickets</div>
                        <div className="stat-value">{dashboardData?.activeTickets || 0}</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                        📦
                      </div>
                      <div className="stat-content">
                        <div className="stat-label">Total Orders</div>
                        <div className="stat-value">{dashboardData?.totalOrders || 0}</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                        🏆
                      </div>
                      <div className="stat-content">
                        <div className="stat-label">Total Wins</div>
                        <div className="stat-value">{dashboardData?.totalWins || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="dashboard-card">
                    <h3 className="card-title">Quick Actions</h3>
                    <div className="quick-actions">
                      <button className="action-button" onClick={() => { closeDashboard(); navigate('/'); }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Browse Competitions
                      </button>
                      <button className="action-button" onClick={() => { closeDashboard(); navigate('/cart'); }}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                        View Cart ({itemCount})
                      </button>
                      <button className="action-button logout-button" onClick={handleLogout}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <div className="dashboard-section">
                  <div className="wallet-grid">
                    <div className="wallet-card cash">
                      <div className="wallet-header">
                        <div className="wallet-icon">💵</div>
                        <div className="wallet-info">
                          <div className="wallet-label">Cash Balance</div>
                          <div className="wallet-amount">£{(user.cash_balance || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="wallet-desc">Withdrawable cash earnings from wins</div>
                    </div>

                    <div className="wallet-card credit">
                      <div className="wallet-header">
                        <div className="wallet-icon">🎫</div>
                        <div className="wallet-info">
                          <div className="wallet-label">Site Credit</div>
                          <div className="wallet-amount">£{(user.site_credit_balance || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="wallet-desc">Use for competition entries only</div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3 className="card-title">Transaction History</h3>
                    <div className="empty-state">
                      <svg width="64" height="64" fill="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                        <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
                      </svg>
                      <p>No transactions yet</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referrals Tab */}
              {activeTab === 'referrals' && (
                <div className="dashboard-section">
                  <div className="dashboard-card referral-card">
                    <h3 className="card-title">Your Referral Code</h3>
                    <div className="referral-code-display">
                      <input 
                        type="text" 
                        value={dashboardData?.referralCode || 'Loading...'} 
                        readOnly 
                        className="referral-input"
                      />
                      <button className="referral-copy-btn" onClick={copyReferralCode}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <p className="referral-desc">Share your referral code with friends and earn rewards when they make their first purchase!</p>
                  </div>

                  <div className="referral-stats">
                    <div className="referral-stat">
                      <div className="referral-stat-icon">👥</div>
                      <div className="referral-stat-content">
                        <div className="referral-stat-value">{dashboardData?.referralCount || 0}</div>
                        <div className="referral-stat-label">Total Referrals</div>
                      </div>
                    </div>
                    <div className="referral-stat">
                      <div className="referral-stat-icon">💰</div>
                      <div className="referral-stat-content">
                        <div className="referral-stat-value">£{(dashboardData?.referralEarnings || 0).toFixed(2)}</div>
                        <div className="referral-stat-label">Total Earned</div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3 className="card-title">Referral Tiers</h3>
                    <div className="referral-tiers">
                      <div className="referral-tier">
                        <div className="tier-badge bronze">🥉 Bronze</div>
                        <div className="tier-info">
                          <div className="tier-name">1-5 Referrals</div>
                          <div className="tier-reward">£5 per referral</div>
                        </div>
                      </div>
                      <div className="referral-tier">
                        <div className="tier-badge silver">🥈 Silver</div>
                        <div className="tier-info">
                          <div className="tier-name">6-15 Referrals</div>
                          <div className="tier-reward">£10 per referral</div>
                        </div>
                      </div>
                      <div className="referral-tier">
                        <div className="tier-badge gold">🥇 Gold</div>
                        <div className="tier-info">
                          <div className="tier-name">16+ Referrals</div>
                          <div className="tier-reward">£15 per referral</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Redeem Tab */}
              {activeTab === 'redeem' && (
                <div className="dashboard-section">
                  <div className="dashboard-card">
                    <h3 className="card-title">Redeem Promo Code</h3>
                    <p className="card-desc">Have a promo code? Enter it below to claim your reward!</p>
                    <div className="redeem-input-group">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        className="redeem-input"
                        disabled={redeemLoading}
                      />
                      <button 
                        className="redeem-button"
                        onClick={handleRedeemCode}
                        disabled={redeemLoading || !redeemCode.trim()}
                      >
                        {redeemLoading ? 'Redeeming...' : 'Redeem'}
                      </button>
                    </div>
                    {redeemMessage.text && (
                      <div className={`redeem-message ${redeemMessage.type}`}>
                        {redeemMessage.text}
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card">
                    <h3 className="card-title">Available Codes</h3>
                    <div className="promo-codes">
                      <div className="promo-code-item">
                        <div className="promo-code-label">WELCOME10</div>
                        <div className="promo-code-desc">£10 off your first order</div>
                      </div>
                      <div className="promo-code-item">
                        <div className="promo-code-label">SAVE5</div>
                        <div className="promo-code-desc">£5 off any order</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && (
                <div className="dashboard-section">
                  <div className="dashboard-card">
                    <h3 className="card-title">Submit Support Ticket</h3>
                    <div className="support-form">
                      <input
                        type="text"
                        placeholder="Subject"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        className="support-input"
                      />
                      <textarea
                        placeholder="Describe your issue..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="support-textarea"
                        rows="6"
                      />
                      <button 
                        className="support-submit-btn"
                        onClick={handleSupportSubmit}
                        disabled={!supportSubject.trim() || !supportMessage.trim()}
                      >
                        Submit Ticket
                      </button>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3 className="card-title">Contact Information</h3>
                    <div className="contact-info">
                      <div className="contact-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                        <span>support@rafflestack.com</span>
                      </div>
                      <div className="contact-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                        <span>+44 (0) 20 1234 5678</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="dashboard-section">
                  <div className="dashboard-card">
                    <h3 className="card-title">Account Information</h3>
                    <div className="profile-info">
                      <div className="profile-field">
                        <label>Email</label>
                        <input type="email" value={user.email} readOnly className="profile-input" />
                      </div>
                      <div className="profile-field">
                        <label>Name</label>
                        <input type="text" value={user.name || 'Not set'} readOnly className="profile-input" />
                      </div>
                      <div className="profile-field">
                        <label>Member Since</label>
                        <input type="text" value="November 2024" readOnly className="profile-input" />
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card">
                    <h3 className="card-title">Account Statistics</h3>
                    <div className="profile-stats">
                      <div className="profile-stat">
                        <div className="profile-stat-label">Total Orders</div>
                        <div className="profile-stat-value">{dashboardData?.totalOrders || 0}</div>
                      </div>
                      <div className="profile-stat">
                        <div className="profile-stat-label">Total Spent</div>
                        <div className="profile-stat-value">£{(dashboardData?.totalSpent || 0).toFixed(2)}</div>
                      </div>
                      <div className="profile-stat">
                        <div className="profile-stat-label">Active Tickets</div>
                        <div className="profile-stat-value">{dashboardData?.activeTickets || 0}</div>
                      </div>
                      <div className="profile-stat">
                        <div className="profile-stat-label">Total Wins</div>
                        <div className="profile-stat-value">{dashboardData?.totalWins || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboardPro;