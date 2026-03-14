import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import OrchestratorPage from './pages/OrchestratorPage';
import ServicesPage from './pages/ServicesPage';
import ConsultationQueuePage from './pages/ConsultationQueuePage';
import PatientIntakeTranscriptPage from './pages/PatientIntakeTranscriptPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orchestrator" element={<OrchestratorPage />} />
        <Route path="/orchestrator/consultation-queue" element={<ConsultationQueuePage />} />
        <Route path="/orchestrator/transcript" element={<PatientIntakeTranscriptPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </Router>
  );
}

export default App;



