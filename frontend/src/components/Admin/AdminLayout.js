import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-logo">🎰 RaffleStack Admin</h1>
        </div>
        <div className="admin-header-right">
          <span className="admin-user-info">{user?.email}</span>
          <button onClick={() => navigate('/')} className="admin-btn-secondary">
            View Site
          </button>
          <button onClick={handleLogout} className="admin-btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <NavLink to="/admin" end className="admin-nav-item">
              <span className="admin-nav-icon">📊</span>
              Dashboard
            </NavLink>
            <NavLink to="/admin/competitions" className="admin-nav-item">
              <span className="admin-nav-icon">🎯</span>
              Competitions
            </NavLink>
            <NavLink to="/admin/orders" className="admin-nav-item">
              <span className="admin-nav-icon">📦</span>
              Orders
            </NavLink>
            <NavLink to="/admin/users" className="admin-nav-item">
              <span className="admin-nav-icon">👥</span>
              Users
            </NavLink>
            <NavLink to="/admin/settings" className="admin-nav-item">
              <span className="admin-nav-icon">⚙️</span>
              Settings
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;