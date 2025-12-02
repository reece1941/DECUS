import React, { useState, useEffect } from 'react';
import { competitionsAPI } from '../services/api';
import CompetitionGrid from '../components/CompetitionGrid/CompetitionGrid';
import UserDashboard from '../components/UserDashboard/UserDashboard';
import Header from '../components/Header/Header';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions(activeTab);
  }, [activeTab]);

  const fetchCompetitions = async (tag) => {
    try {
      setLoading(true);
      const { data } = await competitionsAPI.getAll(tag === 'all' ? null : tag);
      setCompetitions(data);
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'jackpot', label: 'Jackpot' },
    { id: 'spin', label: 'Spin' },
    { id: 'instawins', label: 'Instawins' },
    { id: 'rolling', label: 'Rolling' },
    { id: 'vip', label: 'VIP' },
  ];

  return (
    <div className="home-page">
      <Header />
      
      {/* Navigation Tabs */}
      <nav className="decus-nav">
        <div className="decus-nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`decus-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Competition Grid */}
      <section className="decus-section active">
        <h1 className="decus-title">{tabs.find(t => t.id === activeTab)?.label.toUpperCase()} COMPETITIONS</h1>
        <CompetitionGrid competitions={competitions} loading={loading} />
      </section>

      {/* User Dashboard (FAB + Overlay) */}
      {isAuthenticated && <UserDashboard />}
    </div>
  );
};

export default HomePage;
