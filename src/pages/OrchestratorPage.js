import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell } from 'lucide-react';
import '../styles/Pages.css';

const OrchestratorPage = () => {
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
            className="nav-item active"
            onClick={() => navigate('/orchestrator')}
          >
            <span>Orchestrator</span>
          </button>
          <button
            className="nav-item"
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
          <h2>Orchestrator</h2>
        </header>

        <div className="page-content">
          <div className="placeholder-box">
            <h3>Workflow Orchestration Management</h3>
            <p>This page will contain workflow orchestration tools and management interface.</p>
            <button
              onClick={() => navigate('/orchestrator/consultation-queue')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Patient Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrchestratorPage;
