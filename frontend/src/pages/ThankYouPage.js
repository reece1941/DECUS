import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Order Not Found</h1>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 30px', cursor: 'pointer' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#ffd700' }}>Thank You for Your Purchase!</h1>
      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <p>Order Number: #{order.order_number}</p>
        <p>Total: £{order.total.toFixed(2)}</p>
        <p>Payment Method: {order.payment_method}</p>
      </div>
      {order.tickets && order.tickets.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2>Your Ticket Numbers</h2>
          {order.tickets.map((ticket, idx) => (
            <div key={idx} style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3>{ticket.title}</h3>
              <p>Ticket Numbers: {ticket.numbers.map(t => t.number).join(', ')}</p>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => navigate('/')} style={{ marginTop: '40px', padding: '15px 40px', cursor: 'pointer' }}>
        Back to Home
      </button>
    </div>
  );
};

export default ThankYouPage;