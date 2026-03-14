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
  const patientCode = location.state?.patientCode || 'PT-0000';

  const handleProcessRoute = () => {
    console.log('Processing transcript:', transcript);
    navigate('/');
  };

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
          <div className="transcript-titles">
            <h2 className="transcript-main-title">Patient Intake & Transcript</h2>
            <p className="transcript-subtitle">Input Clinical Transcript (Write/Voice):</p>
          </div>

          {/* User Info */}
          <div className="transcript-user-info">
            <span>UID: 001</span>
            <span>User:Alex</span>
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
