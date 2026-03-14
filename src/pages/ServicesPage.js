import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell } from 'lucide-react';
import '../styles/Pages.css';
import Side from '../components/Sidebar';
import { getPatients } from '../utils/supabase';

const ServicesPage = () => {
  const fetchPatients = async () => {
    const result = await getPatients({
      patientId: "P10234"
    });

    console.log(result.data)
    console.log(result.pagination)
  }

  return (
    <div className="page-container">
      <Side onTriggerAlert={fetchPatients} />

      <div className="main-content">
        <header className="header">
          <h2>Services</h2>
        </header>

        <div className="page-content">
          <div className="placeholder-box">
            <h3>Medical Services Management</h3>
            <p>This page will contain medical services management and monitoring tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
