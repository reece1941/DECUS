import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';
import axios from 'axios';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchDashboardData();
    }
  }, [isOpen, user]);

  const fetchDashboardData = async () => {
    // In a real implementation, this would fetch from backend
    setDashboardData({
      tickets: 0,
      points: 0,
      referrals: 0,
      spins: 1,
      totalOrders: 0,
      totalSpent: 0,
      wins: 0,
    });
  };

  const openDashboard = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDashboard = () => {
    setIsOpen(false);
    setActiveSection(null);
    document.body.style.overflow = '';
  };

  const handleLogout = () => {
    logout();
    closeDashboard();
    navigate('/');
  };

  if (!user) return null;

  return (
    <>
      {/* FAB Button */}
      <div 
        className={`decus-fab-premium bottom-right ${itemCount > 0 ? 'pulse' : ''}`}
        onClick={openDashboard}
      >
        <span className="decus-icon">👤</span>
        {itemCount > 0 && (
          <span className="decus-fab-badge">{itemCount > 99 ? '99+' : itemCount}</span>
        )}
      </div>

      {/* Dashboard Overlay */}
      <div className={`decus-premium-dashboard ${isOpen ? 'active' : ''}`}>
        {/* Header */}
        <div className="dash-header">
          <div className="dash-header-left">
            <h1 className="dash-title">My Dashboard</h1>
            <p className="dash-subtitle">Welcome, {user.name}! 👋</p>
          </div>
          <div className="dash-header-right">
            <button className="dash-close-btn" onClick={closeDashboard}>
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">
          {/* Stats Grid */}
          <div className="dash-grid dash-grid-4">
            {/* Cart */}
            <div className="dash-card dash-card-gradient">
              <div className="dash-card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                🛒
              </div>
              <div className="dash-card-body">
                <h3 className="dash-card-title">Cart</h3>
                <div className="dash-card-value">{itemCount} <span>items</span></div>
              </div>
            </div>

            {/* Wallet */}
            <div className="dash-card dash-card-gradient dash-card-wallet">
              <div className="dash-card-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                💰
              </div>
              <div className="dash-card-body">
                <h3 className="dash-card-title">Wallet</h3>
                <div className="dash-wallet-dual">
                  <div className="dash-wallet-item">
                    <div className="dash-wallet-label">💵 Cash</div>
                    <div className="dash-wallet-value">£{(user.cash_balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="dash-wallet-divider" />
                  <div className="dash-wallet-item">
                    <div className="dash-wallet-label">🎫 Credit</div>
                    <div className="dash-wallet-value">£{(user.site_credit_balance || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="dash-card dash-card-gradient">
              <div className="dash-card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                🎟️
              </div>
              <div className="dash-card-body">
                <h3 className="dash-card-title">Active Tickets</h3>
                <div className="dash-card-value">{dashboardData?.tickets || 0} <span>tickets</span></div>
              </div>
            </div>

            {/* Points */}
            <div className="dash-card dash-card-gradient">
              <div className="dash-card-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                ⭐
              </div>
              <div className="dash-card-body">
                <h3 className="dash-card-title">Reward Points</h3>
                <div className="dash-card-value">{(dashboardData?.points || 0).toLocaleString()} <span>pts</span></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="dash-quick-actions">
              <button className="dash-action-btn" onClick={() => navigate('/')}>
                <div className="dash-action-icon">🏪</div>
                <div className="dash-action-content">
                  <div className="dash-action-title">Browse Competitions</div>
                  <div className="dash-action-desc">Find your next win</div>
                </div>
              </button>

              <button className="dash-action-btn" onClick={() => navigate('/cart')}>
                <div className="dash-action-icon">🛒</div>
                <div className="dash-action-content">
                  <div className="dash-action-title">View Cart</div>
                  <div className="dash-action-desc">{itemCount} items in cart</div>
                </div>
                {itemCount > 0 && <div className="dash-action-badge">NEW</div>}
              </button>

              <button className="dash-action-btn" onClick={handleLogout}>
                <div className="dash-action-icon">🚪</div>
                <div className="dash-action-content">
                  <div className="dash-action-title">Logout</div>
                  <div className="dash-action-desc">Sign out of your account</div>
                </div>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Account Information</h3>
            </div>
            <div className="dash-info-grid">
              <div className="dash-info-item">
                <span className="dash-info-label">Email</span>
                <span className="dash-info-value">{user.email}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Name</span>
                <span className="dash-info-value">{user.name}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Cash Balance</span>
                <span className="dash-info-value">£{(user.cash_balance || 0).toFixed(2)}</span>
              </div>
              <div className="dash-info-item">
                <span className="dash-info-label">Site Credit</span>
                <span className="dash-info-value">£{(user.site_credit_balance || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
