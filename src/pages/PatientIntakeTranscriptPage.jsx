import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity size={24} className="text-slate-700" />
              <span className="font-bold text-slate-800">MEDIFLOW</span>
            </div>
            <span className="text-sm text-slate-500">ORCHESTRATOR</span>
          </div>
          <button className="px-4 py-2 border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
            Profile
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-slate-800 mb-1">Patient Intake & Transcript</h2>
            <p className="text-sm text-slate-500">Input Clinical Transcript (Write/Voice):</p>
          </div>

          {/* User Info */}
          <div className="mb-6 text-sm text-slate-600">
            <span className="font-medium">UID: 001</span>
            <span className="mx-2">User:Alex</span>
          </div>

          {/* Transcript Textarea */}
          <div className="mb-8">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-64 p-4 border-2 border-slate-300 rounded-lg focus:border-blue-500 outline-none resize-none font-light text-slate-700 leading-relaxed"
              spellCheck="false"
            />
          </div>

          {/* Process & Route Button */}
          <div className="flex justify-end">
            <button
              onClick={handleProcessRoute}
              className="px-12 py-3 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition-colors border border-slate-300"
            >
              Process & Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
