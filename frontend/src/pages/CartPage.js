import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, itemCount, subtotal, total } = useCart();

  if (itemCount === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Your Cart is Empty</h1>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 30px', cursor: 'pointer' }}>
          Browse Competitions
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Your Cart</h1>
      <div style={{ marginTop: '40px' }}>
        {cart.items.map((item) => (
          <div key={item.competition_id} style={{ marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3>{item.title}</h3>
            <p>Price: £{item.price.toFixed(2)} x {item.quantity}</p>
            <p>Total: £{(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={() => updateQuantity(item.competition_id, item.quantity - 1)}>-</button>
            <span style={{ margin: '0 10px' }}>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.competition_id, item.quantity + 1)}>+</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
        <p>Subtotal: £{subtotal.toFixed(2)}</p>
        {cart.discount > 0 && <p>Discount: -£{cart.discount.toFixed(2)}</p>}
        <h2>Total: £{total.toFixed(2)}</h2>
        <button onClick={() => navigate('/checkout')} style={{ marginTop: '20px', padding: '15px 40px', cursor: 'pointer' }}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;