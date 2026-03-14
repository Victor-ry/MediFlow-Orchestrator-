import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import '../styles/PatientIntakeTranscriptPage.css';

export default function PatientIntakeTranscriptPage() {
  const [transcript, setTranscript] = useState(
    'Patient complains of persistent cough for three days.\nOrder chest X-ray.\nStart Amoxicillin 500mg three times daily for five days.\nRequest CBC blood test.'
  );
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient || {
    patient_id: 'P00000',
    name: 'Unknown Patient',
    age: '-',
    sex: '-',
    allergies: '-',
    medical_history: '-',
    family_history: '-'
  };

  const handleProcessRoute = () => {
    console.log('Processing transcript for patient:', patient.patient_id);
    console.log('Transcript:', transcript);
    navigate('/orchestrator/ai-analysis', { state: { patient, transcript } });
  };

  const handleProgressClick = (page) => {
    if (page === 'consultation') {
      navigate('/orchestrator/consultation-queue');
    } else if (page === 'analysis') {
      // Cannot navigate forward to analysis from transcript
      return;
    }
  };

  const progressSteps = [
    { id: 'consultation', label: 'Consultation Queue', status: 'completed' },
    { id: 'transcript', label: 'Patient Intake', status: 'current' },
    { id: 'analysis', label: 'AI Analysis', status: 'upcoming' }
  ];

  return (
    <div className="transcript-container">
      <div className="transcript-wrapper">
        {/* Header */}
        <div className="transcript-header">
          <div className="transcript-header-left">
            <div className="transcript-header-logo">
              <Activity size={24} color="#475569" />
              <span>MEDIFLOW</span>
            </div>
            <span className="transcript-header-label">ORCHESTRATOR</span>
          </div>
          <button className="transcript-header-profile">
            Profile
          </button>
        </div>

        {/* Content */}
        <div className="transcript-content">
          {/* Progress Tracker */}
          <div className="progress-tracker">
            {progressSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  className={`progress-step progress-${step.status}`}
                  onClick={() => handleProgressClick(step.id)}
                  disabled={step.status !== 'completed'}
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

          <div className="transcript-titles">
            <h2 className="transcript-main-title">Patient Intake & Transcript</h2>
            <p className="transcript-subtitle">Input Clinical Transcript (Write/Voice):</p>
          </div>

          {/* Patient Info */}
          <div className="patient-info-section">
            <div className="patient-info-item">
              <span className="patient-info-label">Patient ID:</span>
              <span className="patient-info-value">{patient.patient_id}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Name:</span>
              <span className="patient-info-value">{patient.name}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Age:</span>
              <span className="patient-info-value">{patient.age}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Sex:</span>
              <span className="patient-info-value">{patient.sex}</span>
            </div>
            <div className="patient-info-item">
              <span className="patient-info-label">Allergies:</span>
              <span className="patient-info-value">{patient.allergies}</span>
            </div>
          </div>

          {/* Transcript Textarea */}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="transcript-textarea"
            spellCheck="false"
          />

          {/* Process & Route Button */}
          <div className="transcript-buttons">
            <button
              onClick={handleProcessRoute}
              className="transcript-btn"
            >
              Process & Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
