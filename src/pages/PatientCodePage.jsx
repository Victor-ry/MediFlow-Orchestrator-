import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import '../styles/PatientCodePage.css';

export default function PatientCodePage() {
  const [patientCode, setPatientCode] = useState('');
  const navigate = useNavigate();

  const handleEnter = () => {
    if (patientCode.trim()) {
      navigate('/orchestrator/patient-details', { state: { patientCode } });
    }
  };

  return (
    <div className="patient-code-container">
      <div className="patient-code-card">
        {/* Header */}
        <div className="patient-code-header">
          <div className="patient-code-header-logo">
            <Activity size={24} color="#475569" />
            <span>MEDIFLOW</span>
          </div>
          <span className="patient-code-header-label">ORCHESTRATOR</span>
        </div>

        {/* Content */}
        <div className="patient-code-content">
          <div className="patient-code-content-space">
            <h2 className="patient-code-title">Patient Code</h2>
            
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              placeholder="xxxx-xxxx"
              className="patient-code-input"
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            />
            
            <button
              onClick={handleEnter}
              className="patient-code-button"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
