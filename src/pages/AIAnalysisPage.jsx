import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, LoaderCircle, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getDepartments } from '../utils/departmentDb';
import { getActiveServices } from '../utils/servicesDb';
import { createConsultationRecord, createOrdersFromConfirmedRoutes } from '../utils/routeOrdersDb';
import { analyzeConsultationTranscript } from '../utils/flextoken';
import '../styles/AIAnalysisPage.css';

const PRIORITY_UI = {
  High: { color: 'red', label: 'High Priority' },
  Medium: { color: 'yellow', label: 'Medium Priority' },
  Low: { color: 'green', label: 'Low Priority' },
};

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmedRoutes, setConfirmedRoutes] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isCustomRouteModalOpen, setIsCustomRouteModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisRawOutput, setAnalysisRawOutput] = useState('');
  const [analysisRepairedOutput, setAnalysisRepairedOutput] = useState('');
  const [analysisFeedback, setAnalysisFeedback] = useState('');
  const [analysisStatusTag, setAnalysisStatusTag] = useState('Model Output');
  const [analysisSchemaIssues, setAnalysisSchemaIssues] = useState([]);
  const [analysisRetryCount, setAnalysisRetryCount] = useState(0);
  const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);

  // Get patient data from route state
  const patient = location.state?.patient || {};
  const transcript = location.state?.transcript || '';
  const patientId = patient?.patient_id || '';
  const patientAge = patient?.age ?? '';
  const patientSex = patient?.sex || '';
  const patientMedicalHistory = patient?.medical_history || '';
  const patientAllergies = patient?.allergies || '';
  const patientFamilyHistory = patient?.family_history || '';

  useEffect(() => {
    let isMounted = true;

    const loadAnalysis = async () => {
      setIsLoadingAnalysis(true);
      setAnalysisError('');

      const patientContext = {
        patient_id: patientId,
        age: patientAge,
        sex: patientSex,
        medical_history: patientMedicalHistory,
        allergies: patientAllergies,
        family_history: patientFamilyHistory,
      };

      if (!transcript.trim()) {
        if (isMounted) {
          setAnalysisResult(null);
          setAnalysisError('No transcript was provided for AI analysis.');
          setIsLoadingAnalysis(false);
        }
        return;
      }

      const [departmentsResult, activeServicesResult] = await Promise.all([
        getDepartments(),
        getActiveServices(),
      ]);

      if (departmentsResult.error) {
        if (isMounted) {
          setDepartments([]);
          setAnalysisResult(null);
          setAnalysisError(departmentsResult.error.message || 'Unable to load departments for AI analysis.');
          setIsLoadingAnalysis(false);
        }
        return;
      }

      if (activeServicesResult.error) {
        if (isMounted) {
          setDepartments([]);
          setActiveServices([]);
          setAnalysisResult(null);
          setAnalysisError(activeServicesResult.error.message || 'Unable to load active services for AI analysis.');
          setIsLoadingAnalysis(false);
        }
        return;
      }

      const departmentRows = departmentsResult.data || [];
      const departmentNames = departmentRows
        .map((department) => String(department.departmentName || '').trim())
        .filter(Boolean);
      const activeServiceRows = activeServicesResult.data || [];

      if (isMounted) {
        setDepartments(departmentRows);
        setActiveServices(activeServiceRows);
      }

      try {
        const result = await analyzeConsultationTranscript({
          transcript,
          patient: patientContext,
          allowedDepartments: departmentNames,
          allowedServices: activeServiceRows,
        });

        if (!isMounted) {
          return;
        }

        setAnalysisResult(result.analysis);
        setAnalysisRawOutput(result.rawResponseContent || '');
        setAnalysisRepairedOutput(result.repairedResponseContent || '');
        setAnalysisFeedback(
          result.fallbackUsed
            ? `AI output did not fully match the required schema. Displaying simplified fallback results.${result.schemaIssues?.length ? ` ${result.schemaIssues.join(' ')}` : ''}`
            : 'AI output matched the expected schema.'
        );
        setAnalysisSchemaIssues(Array.isArray(result.schemaIssues) ? result.schemaIssues : []);
        setAnalysisStatusTag(
          result.fallbackUsed
            ? 'Fallback'
            : result.repairedResponseContent
              ? 'Schema-Repaired'
              : 'Model Output'
        );
        setConfirmedRoutes([]);
      } catch (error) {
        if (isMounted) {
          setAnalysisResult(null);
          setAnalysisRawOutput(error.rawResponseContent || '');
          setAnalysisRepairedOutput(error.repairedResponseContent || '');
          setAnalysisFeedback('No usable AI recommendation was returned. Displaying empty fallback values.');
          setAnalysisStatusTag('Fallback');
          setAnalysisSchemaIssues([]);
          setAnalysisError(error.message || 'Unable to analyze the consultation transcript.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingAnalysis(false);
        }
      }
    };

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [
    analysisRetryCount,
    patientAge,
    patientAllergies,
    patientFamilyHistory,
    patientId,
    patientMedicalHistory,
    patientSex,
    transcript,
  ]);

  const priorityConfig = PRIORITY_UI[analysisResult?.priority] || PRIORITY_UI.Low;
  const extractedIntentRoutes = Array.isArray(analysisResult?.extracted_intent?.recommendations)
    ? analysisResult.extracted_intent.recommendations.map((recommendation, index) => ({
        intent: recommendation.service_name
          ? `[AI Service] ${recommendation.service_name}`
          : analysisResult.extracted_intent.symptoms.length > 0
            ? `[AI Referral] ${analysisResult.extracted_intent.symptoms.join(', ')}`
            : `[AI Referral ${index + 1}]`,
        department: recommendation.department,
        serviceName: recommendation.service_name,
        serviceCode: recommendation.service_code,
        serviceCodes: recommendation.service_code ? [recommendation.service_code] : [],
        color: priorityConfig.color,
        priority: analysisResult.priority,
        confidenceScore: recommendation.confidence_score,
      }))
    : [];
  const predictedDiseases = analysisResult?.predicted_disease || [];
  const aiRecommendation = analysisResult?.ai_recommendation || '';
  const patientDetailRows = [
    { label: 'Patient ID', value: patient?.patient_id || '-' },
    { label: 'Name', value: patient?.name || '-' },
    { label: 'Age', value: patient?.age || '-' },
    { label: 'Sex', value: patient?.sex || '-' },
    { label: 'Allergies', value: patient?.allergies || '-' },
    { label: 'Medical History', value: patient?.medical_history || '-' },
    { label: 'Family History', value: patient?.family_history || '-' },
  ];

  const handleConfirmRoute = async () => {
    if (!patient?.patient_id || confirmedRoutes.length === 0) {
      return;
    }

    setIsTicketPreviewOpen(true);
  };

  const handleConfirmAndPrintTicket = async () => {
    if (!patient?.patient_id || confirmedRoutes.length === 0) {
      return;
    }

    setIsSavingRoute(true);
    setSaveError('');

    const departmentsPromise = getDepartments();
    const servicesPromise = activeServices.length > 0
      ? Promise.resolve({ data: activeServices, error: null })
      : getActiveServices();

    const [departmentsResult, servicesResult] = await Promise.all([
      departmentsPromise,
      servicesPromise,
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

    setIsTicketPreviewOpen(false);
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
      const exists = confirmedRoutes.some(
        (item) =>
          String(item.intent || '').toLowerCase() === String(draggedItem.intent || '').toLowerCase() &&
          String(item.department || '').toLowerCase() === String(draggedItem.department || '').toLowerCase()
      );

      if (!exists) {
        setConfirmedRoutes([...confirmedRoutes, draggedItem]);
      }

      setDraggedItem(null);
    }
  };

  const handleRemoveRoute = (indexToRemove) => {
    setConfirmedRoutes(confirmedRoutes.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenCustomRoute = async () => {
    setIsCustomRouteModalOpen(true);
    if (departments.length === 0) {
      const { data } = await getDepartments();
      if (data) {
        setDepartments(data);
      }
    }
  };

  const handleSelectCustomDepartment = (dept) => {
    const newItem = {
      intent: '[Custom Referral]',
      department: dept.departmentName,
      color: 'blue',
      priority: 'Manual',
    };

    const exists = confirmedRoutes.some(
      (item) =>
        String(item.intent || '').toLowerCase() === newItem.intent.toLowerCase() &&
        String(item.department || '').toLowerCase() === newItem.department.toLowerCase()
    );

    if (!exists) {
      setConfirmedRoutes([...confirmedRoutes, newItem]);
    }

    setIsCustomRouteModalOpen(false);
    setDeptSearch('');
  };

  const getColorDot = (color) => {
    const colors = { green: '#10b981', red: '#ef4444', yellow: '#eab308', blue: '#3b82f6' };
    return colors[color] || '#94a3b8';
  };

  const handleRetryAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisRawOutput('');
    setAnalysisRepairedOutput('');
    setAnalysisFeedback('');
    setAnalysisStatusTag('Model Output');
    setAnalysisSchemaIssues([]);
    setAnalysisError('');
    setIsLoadingAnalysis(true);
    setAnalysisRetryCount((currentValue) => currentValue + 1);
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

  const normalizedAllergyValue = String(patient?.allergies || '').trim().toLowerCase();
  const clinicalAlerts = [
    normalizedAllergyValue && !['-', 'none', 'n/a', 'na', 'no', 'no known allergies'].includes(normalizedAllergyValue)
      ? `Allergy alert: ${patient.allergies}`
      : null,
    analysisResult?.priority === 'High' ? 'High priority case detected. Consider expedited routing.' : null,
    analysisResult?.is_irrelevant ? 'Transcript appears non-clinical or insufficiently relevant.' : null,
  ].filter(Boolean);

  const insightSymbols = [
    analysisFeedback
      ? {
          id: 'ai-feedback',
          label: 'AI Feedback',
          detail: analysisFeedback,
          tone: analysisResult?.is_irrelevant ? 'warning' : 'info',
        }
      : null,
    ...clinicalAlerts.map((alertText, idx) => ({
      id: `clinical-alert-${idx}`,
      label: 'Clinical Alert',
      detail: alertText,
      tone: 'warning',
    })),
  ].filter(Boolean);

  const ticketPreviewItems = confirmedRoutes.map((route, idx) => {
    const matchingDepartment = departments.find(
      (dept) => String(dept.departmentName || '').trim().toLowerCase() === String(route.department || '').trim().toLowerCase()
    );

    return {
      key: `${route.department}-${route.serviceCode || route.serviceName || idx}`,
      department: route.department,
      location: matchingDepartment?.location || 'Location unavailable',
      service: route.serviceName || route.intent || 'General routing',
      serviceCode: route.serviceCode || (Array.isArray(route.serviceCodes) ? route.serviceCodes.join(', ') : ''),
      priority: route.priority || 'Routine',
    };
  });

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="ai-analysis-container">
        <div className="ai-analysis-wrapper">
          {/* Header */}
          <div className="ai-analysis-header">
            <div className="header-content">
              <h1 className="ai-analysis-title">AI-Analysis & Intent Extraction</h1>
              <p className="ai-model-note">Gemini-1.5-Flash output 🧠</p>
              <div className="ai-status-row">
                <span className={`ai-status-badge ai-status-${analysisStatusTag.toLowerCase().replace(/\s+/g, '-')}`}>
                  {analysisStatusTag}
                </span>
                {analysisSchemaIssues.length > 0 ? (
                  <span className="ai-status-detail">Schema issues detected: {analysisSchemaIssues.length}</span>
                ) : null}
              </div>
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

            <div className="analysis-source-card">
              <div>
                <h2 className="analysis-source-title">Consultation transcript</h2>
                <p className="analysis-source-subtitle">The AI response is generated from the transcript and patient profile below.</p>
              </div>
              <div className="analysis-source-meta">
                <span>Patient: {patient?.patient_id || 'Unknown'}</span>
                <span>{patient?.name || 'Unknown Patient'}</span>
              </div>
              <p className="analysis-source-text">{transcript || 'No transcript available.'}</p>
            </div>

            {insightSymbols.length > 0 ? (
              <div className="insight-symbol-row">
                {insightSymbols.map((item) => (
                  <div key={item.id} className={`insight-symbol insight-symbol-${item.tone}`} role="note" tabIndex={0}>
                    <span className="insight-symbol-glyph">i</span>
                    <span className="insight-symbol-label">{item.label}</span>
                    <div className="insight-tooltip">{item.detail}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="patient-details-card">
              <h3 className="patient-details-title">Patient Details</h3>
              <div className="patient-details-grid">
                {patientDetailRows.map((row) => (
                  <div key={row.label} className="patient-detail-item">
                    <span className="patient-detail-label">{row.label}</span>
                    <span className="patient-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {analysisRawOutput ? (
              <details className="llm-output-card">
                <summary className="llm-output-summary">Gemini raw output</summary>
                <pre className="llm-output-text">{analysisRawOutput}</pre>
                {analysisRepairedOutput ? (
                  <>
                    <div className="llm-output-divider">Schema-repaired output</div>
                    <pre className="llm-output-text">{analysisRepairedOutput}</pre>
                  </>
                ) : null}
              </details>
            ) : null}

            {/* AI Insights Table */}
            <table className="ai-table">
              <colgroup>
                <col className="col-intent" />
                <col className="col-disease" />
                <col className="col-recommendation" />
                <col className="col-priority" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div className="table-head-main">Extracted Intent</div>
                    <div className="table-head-sub">Department + service routing candidates</div>
                  </th>
                  <th>
                    <div className="table-head-main">Predicted Disease</div>
                    <div className="table-head-sub">Possible conditions with confidence</div>
                  </th>
                  <th>
                    <div className="table-head-main">AI Recommendation</div>
                    <div className="table-head-sub">Suggested clinical next steps</div>
                  </th>
                  <th>
                    <div className="table-head-main">Priority</div>
                    <div className="table-head-sub">Urgency level for routing</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="cell-section-header">Recommendations ({extractedIntentRoutes.length})</div>
                    {isLoadingAnalysis ? (
                      <div className="analysis-state-card">
                        <LoaderCircle size={18} className="analysis-spinner" />
                        <span>Analyzing transcript with Gemini...</span>
                      </div>
                    ) : null}

                    {!isLoadingAnalysis && analysisError ? (
                      <div className="analysis-state-card analysis-state-error">
                        <AlertCircle size={18} />
                        <span>{analysisError}</span>
                        <button className="retry-analysis-btn" onClick={handleRetryAnalysis}>
                          Retry analysis
                        </button>
                      </div>
                    ) : null}

                    {!isLoadingAnalysis && extractedIntentRoutes.length > 0 ? (
                      <>
                        <div className="analysis-card-list">
                          {extractedIntentRoutes.map((route, idx) => (
                            <div
                              key={`${route.department}-${route.serviceCode || route.serviceName || idx}`}
                              className="draggable-intent"
                              draggable
                              onDragStart={(e) => handleDragStart(e, route)}
                            >
                              <span
                                className="intent-dot"
                                style={{ backgroundColor: getColorDot(route.color) }}
                              ></span>
                              <div className="intent-card-copy">
                                <span className="intent-name">{route.department}</span>
                                <span className="intent-service-meta">
                                  {route.serviceName || 'Department recommendation only'}
                                  {route.serviceCode ? ` (${route.serviceCode})` : ''}
                                </span>
                              </div>
                              <span className="intent-spacer"></span>
                              <span className="intent-confidence">{route.confidenceScore}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="intent-meta-row">
                          <span className="intent-confidence">
                            Confidence: {analysisResult.extracted_intent.confidence_score}%
                          </span>
                        </div>
                        <div className="symptom-chip-list">
                          {analysisResult.extracted_intent.symptoms.map((symptom) => (
                            <span key={symptom} className="symptom-chip">{symptom}</span>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {!isLoadingAnalysis && extractedIntentRoutes.length === 0 ? (
                      <div className="analysis-state-card">
                        <span>No recommendation.</span>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="cell-section-header">Disease Predictions ({predictedDiseases.length})</div>
                    <div className="analysis-card-list disease-list">
                      {!isLoadingAnalysis && predictedDiseases.length === 0 ? (
                        <div className="analysis-state-card">
                          <span>No recommendation.</span>
                        </div>
                      ) : null}

                      {predictedDiseases.map((item, idx) => (
                        <div key={idx} className="disease-item">
                          <div className="disease-content">
                            <AlertCircle size={18} className="warning-icon" />
                            <div className="disease-copy">
                              <span className="disease-name">{item.disease}</span>
                              <span className="disease-confidence">Probability: {item.probability_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="cell-section-header">Recommendation Summary</div>
                    <div className={`recommendation-content ${analysisResult?.is_irrelevant ? 'recommendation-content-warning' : ''}`}>
                      <p className="recommendation-text">
                        {isLoadingAnalysis
                          ? 'Waiting for AI recommendation...'
                          : aiRecommendation || 'No recommendation.'}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="cell-section-header">Routing Priority</div>
                    <div className={`priority-card priority-${priorityConfig.color}`}>
                      <span
                        className="intent-dot"
                        style={{ backgroundColor: getColorDot(priorityConfig.color) }}
                      ></span>
                      <div>
                        <div className="priority-label">{analysisResult?.priority || 'Low'}</div>
                        <div className="priority-help">{priorityConfig.label}</div>
                      </div>
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
                        <span>{item.intent} → {item.department}{item.serviceName ? ` • ${item.serviceName}` : ''}</span>
                        <span className={`route-priority route-priority-${item.color || 'green'}`}>
                          {item.priority || 'Routine'}
                        </span>
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
                disabled={confirmedRoutes.length === 0 || isSavingRoute || isLoadingAnalysis || !!analysisError}
              >
                {isSavingRoute ? 'Saving orders...' : '✓ Confirm route and print ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isTicketPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content ticket-modal">
            <div className="modal-header">
              <h2 className="modal-title">Ticket Confirmation</h2>
              <button className="close-modal-btn" onClick={() => setIsTicketPreviewOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ticket-preview-meta">
              <div><strong>Patient ID:</strong> {patient?.patient_id || '-'}</div>
              <div><strong>Name:</strong> {patient?.name || '-'}</div>
              <div><strong>Priority:</strong> {analysisResult?.priority || 'Low'}</div>
            </div>
            <div className="ticket-preview-list">
              {ticketPreviewItems.map((item) => (
                <div key={item.key} className="ticket-preview-item">
                  <div className="ticket-preview-main">{item.department}</div>
                  <div className="ticket-preview-sub">{item.service}{item.serviceCode ? ` (${item.serviceCode})` : ''}</div>
                  <div className="ticket-preview-sub">Location: {item.location}</div>
                  <div className="ticket-preview-badge">{item.priority}</div>
                </div>
              ))}
            </div>
            <div className="ticket-preview-actions">
              <button className="button re-route-btn" onClick={() => setIsTicketPreviewOpen(false)}>
                Back
              </button>
              <button className="button confirm-btn" onClick={handleConfirmAndPrintTicket} disabled={isSavingRoute}>
                {isSavingRoute ? 'Saving orders...' : 'Confirm & Print Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

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
