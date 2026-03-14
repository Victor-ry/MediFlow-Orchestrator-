import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import '../styles/PatientDetailsPage.css';

export default function PatientDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const patientCode = location.state?.patientCode || 'PT-0000';

  // Mock patient data
  const patientData = [
    { label: 'NAME', value: 'John Tan' },
    { label: 'IC', value: '880101-XX-XXXX' },
    { label: 'Age', value: '42' },
    { label: 'Gender', value: 'Male' },
    { label: 'Contact', value: '+60-12-3456-7890' },
  ];

  const handleConfirm = () => {
    navigate('/orchestrator/transcript', { state: { patientCode } });
  };

  const handleCancel = () => {
    navigate('/orchestrator');
  };

  return (
    <div className="patient-details-container">
      <div className="patient-details-wrapper">
        {/* Header */}
        <div className="patient-details-header">
          <div className="patient-details-header-logo">
            <Activity size={24} color="#475569" />
            <span>MEDIFLOW</span>
          </div>
          <span className="patient-details-header-label">ORCHESTRATOR</span>
        </div>

        {/* Content */}
        <div className="patient-details-content">
          <h2 className="patient-details-title">Patient #{patientCode}</h2>

          {/* Table */}
          <table className="patient-details-table">
            <tbody>
              {patientData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Buttons */}
          <div className="patient-details-buttons">
            <button
              onClick={handleCancel}
              className="patient-details-btn patient-details-btn-cancel"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="patient-details-btn patient-details-btn-confirm"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
