import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import CompetitionPage from './pages/CompetitionPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ThankYouPage from './pages/ThankYouPage';
import ReceiptPage from './pages/ReceiptPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/Admin/AdminLayout';
import CompetitionsList from './components/Admin/CompetitionsList';
import CompetitionForm from './components/Admin/CompetitionForm';
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute';
import Footer from './components/Footer/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/competition/:id" element={<CompetitionPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/thank-you" element={<ThankYouPage />} />
              <Route path="/receipt" element={<ReceiptPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="competitions" element={<CompetitionsList />} />
                <Route path="competitions/create" element={<CompetitionForm />} />
                <Route path="competitions/edit/:id" element={<CompetitionForm />} />
                <Route path="orders" element={<div style={{padding: '40px'}}>Orders page coming soon...</div>} />
                <Route path="users" element={<div style={{padding: '40px'}}>Users page coming soon...</div>} />
                <Route path="settings" element={<div style={{padding: '40px'}}>Settings page coming soon...</div>} />
              </Route>
            </Routes>
            
            {/* Footer only on public pages */}
            <Routes>
              <Route path="/admin/*" element={null} />
              <Route path="*" element={<Footer />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
