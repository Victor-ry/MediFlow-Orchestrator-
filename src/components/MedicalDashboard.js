import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Layers, BarChart2, Bell, X, HeartPulse, Bot, ShieldCheck, CircleDollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './MedicalDashboard.css';
import { getPatients } from '../utils/supabase';

const departmentData = [
    { name: 'Radiology', status: 'High', waitTime: '45min' },
    { name: 'Cardiology', status: 'Medium', waitTime: '25min' },
    { name: 'Pharmacy', status: 'Low', waitTime: '10min' },
    { name: 'Laboratory', status: 'Medium', waitTime: '30min' },
    { name: 'Surgery', status: 'High', waitTime: '1h 15min' },
];

const diseaseData = [
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
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();

    const getStatusClass = (status) => {
        if (status === 'High') return 'status-high';
        if (status === 'Medium') return 'status-medium';
        return 'status-low';
    };

    const fetchPatients = async () => {
        const result = await getPatients({
            patientId: "P10234"
        });

        console.log(result.data)
        console.log(result.pagination)
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <HeartPulse className="logo-icon" size={36} />
                    <h1 className="logo-text">Mediflow</h1>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className="nav-item active"
                        onClick={() => navigate('/')}
                    >
                        <Home size={20} />
                        <span>Home</span>
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/orchestrator/consultation-queue')}
                    >
                        <Layers size={20} />
                        <span>Orchestrator</span>
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/services')}
                    >
                        <BarChart2 size={20} />
                        <span>Services</span>
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <button className="alert-button" onClick={() => fetchPatients()}>
                        <Bell size={20} />
                        <span>Trigger Alert</span>
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header">
                    <h2>Mediflow Pulse: Operational Analytic Hub</h2>
                </header>

                {showAlert && (
                    <div className="notification-banner">
                        <span>Critical Alert: Unusually high patient influx in the ER. Additional staff required.</span>
                        <button onClick={() => setShowAlert(false)} className="close-notification">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="dashboard-grid">
                    <div className="grid-item department-load">
                        <h3>Department Load & Bottleneck</h3>
                        <table className="load-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Avg. Wait Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentData.map((dept, index) => (
                                    <tr key={index}>
                                        <td>{dept.name}</td>
                                        <td>
                                            <div className="status-bar-container">
                                                <div className={`status-bar ${getStatusClass(dept.status)}`}></div>
                                            </div>
                                        </td>
                                        <td>{dept.waitTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid-item sankey-placeholder">
                        <h3>Mediflow Routing Flow</h3>
                        <div className="sankey-diagram-box">
                            <span>Sankey Diagram Placeholder</span>
                        </div>
                    </div>

                    <div className="grid-item line-chart-container">
                        <h3>Disease Outbreak Monitor</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={diseaseData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                <Legend />
                                <Line type="monotone" dataKey="influenza" stroke="#38bdf8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="covid19" stroke="#f87171" strokeWidth={2} />
                                <Line type="monotone" dataKey="rsv" stroke="#4ade80" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid-item metrics-grid">
                        <MetricCard icon={<Bot size={28} />} title="AI Accuracy" value="98.7" unit="%" />
                        <MetricCard icon={<ShieldCheck size={28} />} title="Total Alert Count" value="142" />
                        <MetricCard icon={<CircleDollarSign size={28} />} title="Token Usage" value="1.2M" />
                        <MetricCard icon={<HeartPulse size={28} />} title="Daily Patient Count" value="1,284" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalDashboard;
