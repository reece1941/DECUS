import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 30px',
            cursor: 'pointer',
            background: '#ffd700',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <div className=\"admin-page-header\">
        <h1 className=\"admin-page-title\">Dashboard Overview</h1>
        <p className=\"admin-page-subtitle\">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className=\"spinner\" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ffd700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '20px', color: '#666' }}>Loading stats...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Competitions
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#1a0f26' }}>
              {stats?.total_competitions || 0}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#1a0f26' }}>
              {stats?.total_orders || 0}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Users
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#1a0f26' }}>
              {stats?.total_users || 0}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Revenue
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffd700' }}>
              £{stats?.total_revenue?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin/competitions/create')}
            className=\"admin-btn-primary\"
          >
            + Create Competition
          </button>
          <button
            onClick={() => navigate('/admin/competitions')}
            style={{
              padding: '12px 24px',
              background: '#e9ecef',
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            View All Competitions
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;