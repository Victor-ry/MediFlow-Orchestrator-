import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getDepartments } from '../utils/departmentDb';
import { getServices } from '../utils/servicesDb';
import { createConsultationRecord, createOrdersFromConfirmedRoutes } from '../utils/routeOrdersDb';
import '../styles/AIAnalysisPage.css';

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmedRoutes, setConfirmedRoutes] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isCustomRouteModalOpen, setIsCustomRouteModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Get patient data from route state
  const patient = location.state?.patient || {};
  const transcript = location.state?.transcript || '';

  // Mock AI analysis 
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

  const handleConfirmRoute = async () => {
    if (!patient?.patient_id || confirmedRoutes.length === 0) {
      return;
    }

    setIsSavingRoute(true);
    setSaveError('');

    const [departmentsResult, servicesResult] = await Promise.all([
      getDepartments(),
      getServices(),
    ]);

    if (departmentsResult.error) {
      setSaveError(departmentsResult.error.message || 'Unable to load departments for order creation.');
      setIsSavingRoute(false);
      return;
    }

    if (servicesResult.error) {
      setSaveError(servicesResult.error.message || 'Unable to load services for order creation.');
      setIsSavingRoute(false);
      return;
    }

    const consultationResult = await createConsultationRecord({
      patientId: patient.patient_id,
      transcript,
    });

    if (consultationResult.error) {
      setSaveError(consultationResult.error.message || 'Unable to create consultation record.');
      setIsSavingRoute(false);
      return;
    }

    const ordersResult = await createOrdersFromConfirmedRoutes({
      patientId: patient.patient_id,
      consultationId: consultationResult.data?.consultation_id,
      routes: confirmedRoutes,
      departments: departmentsResult.data || [],
      services: servicesResult.data || [],
      aiRecommendation,
    });

    if (ordersResult.error) {
      setSaveError(ordersResult.error.message || 'Unable to create orders from confirmed routes.');
      setIsSavingRoute(false);
      return;
    }

    const unmatchedCount = Array.isArray(ordersResult.unmatchedRoutes)
      ? ordersResult.unmatchedRoutes.length
      : 0;

    const successMessage = unmatchedCount > 0
      ? `Created ${ordersResult.data.length} order(s) for patient ${patient.patient_id}. ${unmatchedCount} route(s) were saved without matched service codes.`
      : `Created ${ordersResult.data.length} order(s) for patient ${patient.patient_id}.`;

    navigate('/orchestrator/department-queue', {
      state: {
        orderCreationSuccess: successMessage,
        orderCreationUnmatchedRoutes: ordersResult.unmatchedRoutes || [],
      },
    });
  };

  const handleReRoute = () => {
    setConfirmedRoutes([]);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem) {
      setConfirmedRoutes([...confirmedRoutes, draggedItem]);
      setDraggedItem(null);
    }
  };

  const handleRemoveRoute = (indexToRemove) => {
    setConfirmedRoutes(confirmedRoutes.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenCustomRoute = async () => {
    setIsCustomRouteModalOpen(true);
    const { data } = await getDepartments();
    if (data) {
      setDepartments(data);
    }
  };

  const handleSelectCustomDepartment = (dept) => {
    const newItem = {
      intent: '[Custom Referral]',
      department: dept.departmentName,
      color: 'blue'
    };
    setConfirmedRoutes([...confirmedRoutes, newItem]);
    setIsCustomRouteModalOpen(false);
    setDeptSearch('');
  };

  const getColorDot = (color) => {
    const colors = { green: '#10b981', red: '#ef4444', yellow: '#eab308', blue: '#3b82f6' };
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

  const filteredDepartments = departments.filter(d => 
    d.departmentName.toLowerCase().includes(deptSearch.toLowerCase())
  );

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

            {/* AI Insights Table */}
            <table className="ai-table">
              <thead>
                <tr>
                  <th>Extracted Intent</th>
                  <th>Predicted Disease</th>
                  <th>AI Recommendation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {extractedIntents.map((item, idx) => (
                      <div
                        key={idx}
                        className="draggable-intent"
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                      >
                        <span
                          className="intent-dot"
                          style={{ backgroundColor: getColorDot(item.color) }}
                        ></span>
                        <span className="intent-name">{item.intent}</span>
                        <span className="intent-arrow">→</span>
                        <span className="intent-dept">{item.department}</span>
                      </div>
                    ))}
                  </td>
                  <td>
                    <div className="disease-list">
                      {predictedDiseases.map((item, idx) => (
                        <div key={idx} className="disease-item">
                          <div className="disease-content">
                            {item.warning && <AlertCircle size={18} className="warning-icon" />}
                            <span className="disease-name">{item.disease}</span>
                            <span className="disease-confidence">({item.confidence}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="recommendation-content">
                      <p className="recommendation-text">{aiRecommendation}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Routing Queue Section */}
            <div className="routing-queue-wrapper">
              <div className="routing-queue-header">
                <h3>Routing Queue</h3>
                <button className="custom-route-btn" onClick={handleOpenCustomRoute}>
                  Custom Route +
                </button>
              </div>
              <div
                className="routing-queue"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {confirmedRoutes.length === 0 ? (
                  <div className="routing-queue-empty">
                    <p>Drag intents here or add custom routes</p>
                  </div>
                ) : (
                  confirmedRoutes.map((item, idx) => (
                    <div key={idx} className="routing-queue-item">
                      <div className="route-info">
                        <CheckCircle size={16} className="check-icon" />
                        <span>{item.intent} → {item.department}</span>
                      </div>
                      <button className="remove-route-btn" onClick={() => handleRemoveRoute(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {saveError ? <div className="route-save-error">{saveError}</div> : null}
              <button className="button re-route-btn" onClick={handleReRoute}>
                ↻ Re-Route
              </button>
              <button
                className="button confirm-btn"
                onClick={handleConfirmRoute}
                disabled={confirmedRoutes.length === 0 || isSavingRoute}
              >
                {isSavingRoute ? 'Saving orders...' : '✓ Confirm route and print ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Route Modal */}
      {isCustomRouteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-route-modal">
            <div className="modal-header">
              <h2 className="modal-title">Select Department</h2>
              <button className="close-modal-btn" onClick={() => setIsCustomRouteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              className="dept-search-input"
              placeholder="Search departments..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
            />
            <div className="dept-list">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.departmentCode}
                  className="dept-item"
                  onClick={() => handleSelectCustomDepartment(dept)}
                >
                  <div className="dept-name">{dept.departmentName}</div>
                  <div className="dept-desc">{dept.description}</div>
                </div>
              ))}
              {filteredDepartments.length === 0 && (
                <div className="no-depts">No departments found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
