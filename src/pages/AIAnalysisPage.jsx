import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/AIAnalysisPage.css';

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dragItems, setDragItems] = useState([]);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get patient data from route state
  const patient = location.state?.patient || {};
  const transcript = location.state?.transcript || '';

  // Mock AI analysis based on transcript
  const extractedIntents = [
    { intent: '[Medication]', department: 'Pharmacy', color: 'green' },
    { intent: '[ECG Request]', department: 'Cardiology', color: 'red' },
    { intent: '[Troponin Lab]', department: 'Lab', color: 'yellow' }
  ];

  const predictedDiseases = [
    { disease: 'Myocardial Infarction', confidence: 92, warning: true },
    { disease: 'Heart Attack', confidence: 8, warning: false }
  ];

  const aiRecommendation = 'Urgent referral to Cardiology for further evaluation. Order ECG and troponin labs immediately. Patient requires continuous cardiac monitoring.';

  const handleConfirmRoute = () => {
    // Show success modal
    setShowSuccessModal(true);
  };

  const handleConfirmModal = () => {
    // Close modal and navigate to home
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleReRoute = () => {
    // Reset the route decision by clearing drag items
    setDragItems([]);
  };

  const handleDragStart = (e, index) => {
    setDraggedFrom(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedFrom !== null) {
      const newItem = extractedIntents[draggedFrom];
      setDragItems([...dragItems, newItem]);
      setDraggedFrom(null);
    }
  };

  const getColorDot = (color) => {
    const colors = {
      green: '#10b981',
      red: '#ef4444',
      yellow: '#eab308'
    };
    return colors[color] || '#94a3b8';
  };

  const handleProgressClick = (page) => {
    if (page === 'consultation') {
      navigate('/orchestrator/consultation-queue');
    } else if (page === 'transcript') {
      navigate('/orchestrator/transcript', { state: { patient } });
    }
  };

  const progressSteps = [
    { id: 'consultation', label: 'Consultation Queue', status: 'completed' },
    { id: 'transcript', label: 'Patient Intake', status: 'completed' },
    { id: 'analysis', label: 'AI Analysis', status: 'current' }
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="ai-analysis-container">
        <div className="ai-analysis-wrapper">
        {/* Header */}
        <div className="ai-analysis-header">
          <div className="header-content">
            <h1 className="ai-analysis-title">AI-Analysis & Intent Extraction</h1>
            <p className="ai-model-note">QWEN2.5-VL output 🧠</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-analysis-content">
          {/* Progress Tracker */}
          <div className="progress-tracker">
            {progressSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  className={`progress-step progress-${step.status}`}
                  onClick={() => handleProgressClick(step.id)}
                  disabled={step.status === 'current'}
                >
                  <span className="progress-number">
                    {step.status === 'completed' ? '✓' : idx + 1}
                  </span>
                  <span className="progress-label">{step.label}</span>
                </button>
                {idx < progressSteps.length - 1 && (
                  <div className={`progress-connector progress-${step.status}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* AI Insight Panel */}
          <div className="ai-insight-panel">
            <div className="insight-column">
              <h3 className="insight-header">Extracted Intent</h3>
              <div className="intent-list">
                {extractedIntents.map((item, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    className="intent-item"
                  >
                    <span
                      className="intent-dot"
                      style={{ backgroundColor: getColorDot(item.color) }}
                    ></span>
                    <div className="intent-text">
                      <span className="intent-name">{item.intent}</span>
                      <span className="intent-arrow">→</span>
                      <span className="intent-dept">{item.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="insight-divider"></div>

            <div className="insight-column">
              <h3 className="insight-header">Predicted Disease</h3>
              <div className="disease-list">
                {predictedDiseases.map((item, idx) => (
                  <div key={idx} className="disease-item">
                    <div className="disease-content">
                      {item.warning && (
                        <AlertCircle size={18} className="warning-icon" />
                      )}
                      <span className="disease-name">{item.disease}</span>
                      <span className="disease-confidence">({item.confidence}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="insight-divider"></div>

            <div className="insight-column">
              <h3 className="insight-header">AI Recommendation</h3>
              <div className="recommendation-content">
                <p className="recommendation-text">
                  {aiRecommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Drag List Section */}
          <div className="drag-list-section">
            <h3 className="drag-list-title">Routing Queue</h3>
            <div
              className="drag-list-container"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {dragItems.length === 0 ? (
                <div className="drag-list-empty">
                  <p>Drag intents here to confirm routing</p>
                </div>
              ) : (
                dragItems.map((item, idx) => (
                  <div key={idx} className="drag-list-item">
                    <CheckCircle size={16} className="check-icon" />
                    <span>{item.intent} → {item.department}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="button button-secondary"
              onClick={handleReRoute}
            >
              ↻ Re-Route
            </button>
            <button
              className="button button-primary"
              onClick={handleConfirmRoute}
              disabled={dragItems.length === 0}
            >
              ✓ Confirm route and print ticket
            </button>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-icon">✓</div>
              <h2 className="modal-title">Route Completed</h2>
              <p className="modal-message">
                The patient has been successfully routed to the appropriate departments. A ticket has been printed.
              </p>
              <button
                className="modal-button"
                onClick={handleConfirmModal}
              >
                Confirm
              </button>
            </div>
          </div>
        )}  
      </div>
      </div>
    </div>
  );
}
