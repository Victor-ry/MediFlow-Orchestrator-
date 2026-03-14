import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAllPatients, searchPatients } from '../utils/patients';
import '../styles/ConsultationQueuePage.css';

const ROWS_PER_PAGE = 4;

export default function ConsultationQueuePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedPatients, setDisplayedPatients] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = (page) => {
    // Build filter object
    const filters = {};
    if (searchTerm.trim()) filters.searchTerm = searchTerm;
    if (selectedSex) filters.sex = selectedSex;
    if (minAge) filters.minAge = parseInt(minAge);
    if (maxAge) filters.maxAge = parseInt(maxAge);

    // Use combined search function if any filters applied, otherwise get all
    const result = Object.keys(filters).length > 0
      ? searchPatients(filters, { page, pageSize: ROWS_PER_PAGE })
      : getAllPatients({ page, pageSize: ROWS_PER_PAGE });

    if (result.success) {
      setDisplayedPatients(result.data);
      setTotalPages(result.pagination.totalPages);
    } else {
      console.error('Error fetching patients:', result.error);
      setDisplayedPatients([]);
      setTotalPages(0);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchPatients(1);
  }, [searchTerm, selectedSex, minAge, maxAge]);

  useEffect(() => {
    fetchPatients(currentPage);
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePatientClick = (patient) => {
    navigate('/orchestrator/transcript', { state: { patient } });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSex('');
    setMinAge('');
    setMaxAge('');
    setShowFilters(false);
  };

  const hasActiveFilters = searchTerm.trim() || selectedSex || minAge || maxAge;

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
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className={`filter-toggle-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              ⚙️ Filters
            </button>
            {hasActiveFilters && (
              <button 
                className="clear-filters-button"
                onClick={clearFilters}
                title="Clear all filters"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-group">
                <label>Sex:</label>
                <select 
                  value={selectedSex} 
                  onChange={(e) => setSelectedSex(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Age Range:</label>
                <div className="age-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="age-input"
                    min="0"
                    max="120"
                  />
                  <span className="age-separator">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="age-input"
                    min="0"
                    max="120"
                  />
                </div>
              </div>
            </div>
          )}
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
                {displayedPatients.length > 0 ? (
                  displayedPatients.map((patient) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
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
