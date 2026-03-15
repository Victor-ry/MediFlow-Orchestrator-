import { useEffect, useState } from 'react';
import { X, HeartPulse, Bot, ShieldCheck, CircleDollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './MedicalDashboard.css';
import Side from './Sidebar';
import { getDepartmentLoad, getDiseaseTrends, getDashboardMetrics } from '../utils/db';
import { getHospitalInsight, getRecentConsultationsByHours } from '../utils/qwenTools';

const defaultDepartmentData = [
    { name: 'Radiology', count: '20', completed: '50', waitTime: '45 min' },
    { name: 'Cardiology', count: '5', completed: '20', waitTime: '25 min' },
    { name: 'Pharmacy', count: '4', completed: '40', waitTime: '10 min' },
    { name: 'Laboratory', count: '2', completed: '10', waitTime: '30 min' },
    { name: 'Surgery', count: '1', completed: '30', waitTime: '75 min' },
];

const defaultDiseaseData = [
    { name: 'Jan', influenza: 40, covid19: 24, rsv: 12 },
    { name: 'Feb', influenza: 30, covid19: 13, rsv: 22 },
    { name: 'Mar', influenza: 20, covid19: 58, rsv: 15 },
    { name: 'Apr', influenza: 27, covid19: 39, rsv: 30 },
    { name: 'May', influenza: 18, covid19: 48, rsv: 25 },
    { name: 'Jun', influenza: 23, covid19: 38, rsv: 35 },
    { name: 'Jul', influenza: 34, covid19: 43, rsv: 28 },
];

const MetricCard = ({ icon, title, value, unit }) => (
    <div className="metric-card">
        <div className="metric-card-icon">{icon}</div>
        <div className="metric-card-content">
            <p className="metric-card-title">{title}</p>
            <p className="metric-card-value">{value} <span className="metric-card-unit">{unit}</span></p>
        </div>
    </div>
);

const MedicalDashboard = () => {
    const [departmentData, setDepartmentData] = useState(defaultDepartmentData);
    const [diseaseData, setDiseaseData] = useState(defaultDiseaseData);
    const [metrics, setMetrics] = useState({ aiAccuracy: 98.7, totalAlertCount: 142, tokenUsage: '1.2M', dailyPatientCount: 1284 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

    const formatWaitTime = (value) => {
        if (typeof value === 'number') return `${value} min`;
        return value || 'N/A';
    };

    const loadDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [dept, trends, metricResp] = await Promise.all([
                getDepartmentLoad(),
                getDiseaseTrends(),
                getDashboardMetrics(),
            ]);

            if (dept.success && Array.isArray(dept.data) && dept.data.length) {
                setDepartmentData(
                    dept.data.map((d) => ({
                        name: d.name || d.department_name || 'Unknown',
                        status: d.status || 'Low',
                        waitTime: formatWaitTime(d.avg_wait_time || d.avgWaitTime || d.wait_time),
                    }))
                );
            }

            if (trends.success && Array.isArray(trends.data) && trends.data.length) {
                setDiseaseData(
                    trends.data.map((d) => ({
                        name: d.month || 'N/A',
                        influenza: (d.influenza_count ?? d.influenza) || 0,
                        covid19: (d.covid_count ?? d.covid19) || 0,
                        rsv: (d.rsv_count ?? d.rsv) || 0,
                    }))
                );
            }

            if (metricResp.success && metricResp.data) {
                setMetrics({
                    aiAccuracy: metricResp.data.aiAccuracy ?? 98.7,
                    totalAlertCount: metricResp.data.totalAlertCount ?? 142,
                    tokenUsage: metricResp.data.tokenUsage ?? '1.2M',
                    dailyPatientCount: metricResp.data.dailyPatientCount ?? 1284,
                });
            }

            if (metricResp.success && metricResp.data.totalAlertCount > 120) {
                setShowAlert(true);
            }
        } catch (err) {
            console.error('dashboard data fetch failed', err);
            setError('Unable to load live dashboard metrics. Showing fallback data.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateAI = async () => {
        try {
            setIsFeedbackLoading(true); // start loading
            setFeedback(null);   // clear previous feedback

            const transcripts = await getRecentConsultationsByHours(5);
            console.log(transcripts);

            const aiResponse = await getHospitalInsight(transcripts);
            console.log(aiResponse);
            setFeedback(aiResponse);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFeedbackLoading(false); // done loading
        }
    };

    // useEffect(() => {
    //     loadDashboardData();
    // }, []);

    const fetchPatients = async () => {
        setShowAlert(true);
    };

    return (
        <div className="dashboard-container dashboard-page">
            <Side onTriggerAlert={fetchPatients} />
            <div className="main-content">
                <header className="header">
                    <h2>Mediflow Pulse: Operational Analytic Hub</h2>
                    <button className="refresh-button" onClick={loadDashboardData} disabled={isLoading}>
                        {isLoading ? 'Refreshing...' : 'Refresh Live Data'}
                    </button>
                </header>

                {showAlert && (
                    <div className="notification-banner">
                        <span>Critical Alert: Unusually high patient influx in the ER. Additional staff required.</span>
                        <button onClick={() => setShowAlert(false)} className="close-notification">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {error && <div className="error-banner">{error}</div>}

                <div className="dashboard-grid">
                    <div className="grid-item department-load">
                        <div className="dashboard-section-header">
                            <h3>Department Queue Load</h3>
                        </div>
                        <table className="load-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Pending Count</th>
                                    <th>Completed Count</th>
                                    <th>Avg. Wait Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentData.map((dept, index) => (
                                    <tr key={`${dept.name}-${index}`}>
                                        <td>{dept.name}</td>
                                        <td>
                                            {/* <div className="status-bar-container">
                                                <div className={`status-bar`}></div>
                                            </div> */}
                                            <span className="status-label">{dept.count}</span>
                                        </td>
                                        <td>
                                            <span className="status-label">{dept.completed}</span>
                                        </td>
                                        <td>{dept.waitTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid-item ai-insights">
                        <h3>AI Clinical Summary - Qwen AI</h3>
                        <div className="ai-insight-box">
                            {isFeedbackLoading ? (
                                <div className="ai-feedback-skeleton">
                                    <div className="skeleton-box" style={{ width: '80%', height: '16px', marginBottom: '8px' }}></div>
                                    <div className="skeleton-box" style={{ width: '90%', height: '16px', marginBottom: '8px' }}></div>
                                    <div className="skeleton-box" style={{ width: '70%', height: '16px', marginBottom: '8px' }}></div>
                                </div>
                            ) : feedback ? (
                                <div
                                    className="ai-feedback"
                                    dangerouslySetInnerHTML={{ __html: feedback }}
                                />
                            ) : (
                                <div className='ai-feedback'>
                                    <ul>
                                        <li>Traffic: Moderate load across departments with a mix of routine and urgent cases.</li>
                                        <li>Critical: Urgent priority for patients with chest discomfort and palpitations requiring ECG and Troponin tests.</li>
                                        <li>Busiest: General Practitioner and Internal Medicine.</li>
                                    </ul>
                                </div>

                            )}
                        </div>
                        <button className="primary-action-button" onClick={() => generateAI()}>
                            Generate Summary
                        </button>
                    </div>

                    <div className="grid-item line-chart-container">
                        <h3>Disease Outbreak Monitor</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={diseaseData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827' }} />
                                <Legend />
                                <Line type="monotone" dataKey="influenza" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="covid19" stroke="#ef4444" strokeWidth={2} />
                                <Line type="monotone" dataKey="rsv" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalDashboard;
