import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell } from 'lucide-react';
import '../styles/Pages.css';

const ServicesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo-text">Mediflow</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => navigate('/')}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button
            className="nav-item"
            onClick={() => navigate('/orchestrator')}
          >
            <span>Orchestrator</span>
          </button>
          <button
            className="nav-item active"
            onClick={() => navigate('/services')}
          >
            <span>Services</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="alert-button">
            <Bell size={20} />
            <span>Trigger Alert</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <h2>Services</h2>
        </header>

        <div className="page-content">
          <div className="placeholder-box">
            <h3>Medical Services Management</h3>
            <p>This page will contain medical services management and monitoring tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
