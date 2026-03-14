import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-slate-200 px-6 py-4 flex items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-slate-700" />
            <span className="font-bold text-slate-800">MEDIFLOW</span>
          </div>
          <span className="text-sm text-slate-500">ORCHESTRATOR</span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-light text-slate-800 mb-8">Patient #{patientCode}</h2>

          {/* Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <tbody>
                {patientData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-4 font-medium text-slate-700 bg-blue-100 w-32 text-center text-sm border border-slate-200">
                      {row.label}
                    </td>
                    <td className="px-4 py-4 text-slate-600 border border-slate-200">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCancel}
              className="px-8 py-2 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-2 border-2 border-blue-500 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
