import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceiptPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Receipt</h1>
      <p>Receipt page coming soon...</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 30px', cursor: 'pointer' }}>
        Back to Home
      </button>
    </div>
  );
};

export default ReceiptPage;