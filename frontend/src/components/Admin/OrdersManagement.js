import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;

      const res = await axios.get(`${backendUrl}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(res.data.orders || []);
      setMetrics(res.data.metrics || {});
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      order.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-management">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Orders Management</h1>
        <p className="admin-page-subtitle">
          View and manage all orders placed on your platform
        </p>
      </div>

      {/* Metrics Dashboard */}
      <div className="metrics-grid">
        <div className="metric-card gradient-blue">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">£{(metrics.total_revenue || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="metric-card gradient-green">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{metrics.total_orders || 0}</div>
          </div>
        </div>

        <div className="metric-card gradient-purple">
          <div className="metric-icon">📅</div>
          <div className="metric-info">
            <div className="metric-label">Orders Today</div>
            <div className="metric-value">{metrics.orders_today || 0}</div>
          </div>
        </div>

        <div className="metric-card gradient-orange">
          <div className="metric-icon">💵</div>
          <div className="metric-info">
            <div className="metric-label">Revenue Today</div>
            <div className="metric-value">£{(metrics.revenue_today || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Order ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filterStatus === 'all' ? 'active' : ''}
            onClick={() => setFilterStatus('all')}
          >
            All Orders
          </button>
          <button
            className={filterStatus === 'completed' ? 'active' : ''}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
          <button
            className={filterStatus === 'pending' ? 'active' : ''}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <code className="order-id">{order.id.substring(0, 12)}...</code>
                  </td>
                  <td>
                    <div className="customer-info">
                      <div><strong>{order.user_email}</strong></div>
                    </div>
                  </td>
                  <td>
                    <span className="badge">{order.items?.length || 0} item(s)</span>
                  </td>
                  <td>
                    <strong>£{(order.total || 0).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status?.toLowerCase() || 'pending'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Order ID:</span>
                    <span className="value">
                      <code>{selectedOrder.id}</code>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Customer:</span>
                    <span className="value">{selectedOrder.user_email}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Order Items</h3>
                <div className="items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-name">{item.title || item.competition_id}</div>
                      <div className="item-details">
                        <span>Quantity: {item.quantity}</span>
                        <span>Price: £{(item.price || 0).toFixed(2)}</span>
                        <span>Total: £{((item.price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Payment Summary</h3>
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>£{(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>£{(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;