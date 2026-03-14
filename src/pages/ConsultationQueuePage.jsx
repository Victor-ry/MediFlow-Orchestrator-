import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/ConsultationQueuePage.css';

const samplePatients = [
  {"idx":0,"patient_id":"P10234","name":"John Tan","age":54,"sex":"Male","allergies":"Penicillin","medical_history":"Hypertension;Type 2 Diabetes","family_history":"Heart Disease"},
  {"idx":1,"patient_id":"P10235","name":"Sarah Lee","age":37,"sex":"Female","allergies":"None","medical_history":"Asthma","family_history":"None"},
  {"idx":2,"patient_id":"P10236","name":"Ahmad Rahman","age":61,"sex":"Male","allergies":"Sulfa Drugs","medical_history":"Hypertension","family_history":"Stroke"},
  {"idx":3,"patient_id":"P10237","name":"Mei Ling","age":29,"sex":"Female","allergies":"None","medical_history":"None","family_history":"Diabetes"},
  {"idx":4,"patient_id":"P10238","name":"David Wong","age":45,"sex":"Male","allergies":"Aspirin","medical_history":"GERD","family_history":"None"},
  {"idx":5,"patient_id":"P10239","name":"Fiona Kumar","age":52,"sex":"Female","allergies":"Latex","medical_history":"Emphysema","family_history":"Lung Cancer"},
];

const ROWS_PER_PAGE = 4;

export default function ConsultationQueuePage() {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const totalPages = Math.ceil(samplePatients.length / ROWS_PER_PAGE);
  const startIdx = currentPage * ROWS_PER_PAGE;
  const endIdx = startIdx + ROWS_PER_PAGE;
  const displayedPatients = samplePatients.slice(startIdx, endIdx);

  const handlePrevious = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const handlePatientClick = (patient) => {
    navigate('/orchestrator/transcript', { state: { patient } });
  };

  return (
    <div className="consultation-queue-container">
      <div className="consultation-queue-wrapper">
        {/* Header */}
        <div className="consultation-queue-header">
          <div className="consultation-queue-header-logo">
            <Activity size={24} color="#475569" />
            <span>MEDIFLOW</span>
          </div>
          <span className="consultation-queue-header-label">ORCHESTRATOR</span>
          <button className="search-button">
            🔍 Search Queue
          </button>
        </div>

        {/* Content */}
        <div className="consultation-queue-content">
          <h2 className="consultation-queue-title">Patient Consultation Queue</h2>

          {/* Table */}
          <div className="table-wrapper">
            <table className="consultation-table">
              <thead>
                <tr>
                  <th>Patient_ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Sex</th>
                  <th>Allergies</th>
                  <th>Medical_history</th>
                  <th>Family_history</th>
                </tr>
              </thead>
              <tbody>
                {displayedPatients.map((patient) => (
                  <tr 
                    key={patient.idx}
                    onClick={() => handlePatientClick(patient)}
                    className="consultation-table-row"
                  >
                    <td>{patient.patient_id}</td>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.sex}</td>
                    <td>{patient.allergies}</td>
                    <td>{patient.medical_history}</td>
                    <td>{patient.family_history}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="pagination-button"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="pagination-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="pagination-button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
