import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import OrchestratorPage from './pages/OrchestratorPage';
import ServicesPage from './pages/ServicesPage';
import PatientCodePage from './pages/PatientCodePage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import PatientIntakeTranscriptPage from './pages/PatientIntakeTranscriptPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orchestrator" element={<OrchestratorPage />} />
        <Route path="/orchestrator/patient-code" element={<PatientCodePage />} />
        <Route path="/orchestrator/patient-details" element={<PatientDetailsPage />} />
        <Route path="/orchestrator/transcript" element={<PatientIntakeTranscriptPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </Router>
  );
}

export default App;



