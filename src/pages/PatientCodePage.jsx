import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function PatientCodePage() {
  const [patientCode, setPatientCode] = useState('');
  const navigate = useNavigate();

  const handleEnter = () => {
    if (patientCode.trim()) {
      navigate('/orchestrator/patient-details', { state: { patientCode } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-slate-700" />
            <span className="font-bold text-slate-800">MEDIFLOW</span>
          </div>
          <span className="text-sm text-slate-500">ORCHESTRATOR</span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-8 shadow-sm">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-light text-slate-800">Patient Code</h2>
            
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              placeholder="xxxx-xxxx"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 outline-none text-center text-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            />
            
            <button
              onClick={handleEnter}
              className="w-48 mx-auto block px-8 py-2 border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
