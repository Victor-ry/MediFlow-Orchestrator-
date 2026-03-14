import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Layers, BarChart2, Bell, HeartPulse } from 'lucide-react';
import './Sidebar.css';

const Side = ({ onTriggerAlert }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // 定义导航项配置
    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/orchestrator/consultation-queue', icon: Layers, label: 'Orchestrator' },
        { path: '/services', icon: BarChart2, label: 'Services' },
    ];

    // 判断是否 active（支持精确匹配和父路径匹配）
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <HeartPulse className="logo-icon" size={36} />
                <h1 className="logo-text">Mediflow</h1>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            className={`nav-item ${active ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <button className="alert-button" onClick={onTriggerAlert}>
                    <Bell size={20} />
                    <span>Trigger Alert</span>
                </button>
            </div>
        </aside>
    );
};

export default Side;