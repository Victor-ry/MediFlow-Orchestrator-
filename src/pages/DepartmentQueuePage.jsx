import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialRooms = [
  { id: 'R1', room: 'Room 1', patient: 'Sarah Lee', test: 'CBC', status: 'Complete' },
  { id: 'R2', room: 'Room 2', patient: 'Ahmad Rahman', test: 'Troponin', status: 'Complete' },
  { id: 'R3', room: 'Room 3', patient: 'Available', test: '', status: 'Call Next' },
];

const initialQueue = [
  { id: 'Q102', queue: 'L102', patient: 'John Tan', test: 'CBC', priority: 'Routine' },
  { id: 'Q103', queue: 'L103', patient: 'Mei Ling', test: 'Glucose', priority: 'Routine' },
  { id: 'Q104', queue: 'L104', patient: 'Aisyah', test: 'Lipid Panel', priority: 'Urgent' },
];

const DepartmentQueuePage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(initialRooms);
  const [queue, setQueue] = useState(initialQueue);
  const [message, setMessage] = useState('');

  const autoAssign = () => {
    setMessage('Auto assigned next patient in queue to first available room.');
  };

  const markAbsent = () => {
    setMessage('Marked selected queue patient as absent.');
  };

  const requeue = () => {
    setMessage('Patient moved to end of waiting queue.');
  };

  const assignRoom = (queueId, room) => {
    setMessage(`Assigned ${queueId} to ${room}.`);
  };

  return (
    <div className="page-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="logo-text">Mediflow</h1></div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/')}>Home</button>
          <button className="nav-item" onClick={() => navigate('/orchestrator')}>Orchestrator</button>
          <button className="nav-item active" onClick={() => navigate('/orchestrator/department-queue')}>Department Queue</button>
          <button className="nav-item" onClick={() => navigate('/services')}>Services</button>
        </nav>
      </aside>

      <div className="main-content" style={{ padding: '20px 24px' }}>
        <header className="header" style={{ marginBottom: 16 }}>
          <h2>LABORATORY QUEUE DASHBOARD</h2>
          <p style={{ color: '#cbd5e1', marginTop: 4 }}>Real-time room and waiting queue monitoring for Laboratory.</p>
        </header>

        <div className="page-content" style={{ display: 'grid', gap: 16 }}>
          <section style={{ background: '#111827', borderRadius: 10, border: '1px solid #334155', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>Rooms</h3>
                <p style={{ color: '#94a3b8', marginTop: 4 }}>Active room assignments</p>
              </div>
              <button type="button" onClick={autoAssign} style={{ border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', padding: '8px 12px', fontWeight: 600 }}>Auto Assign Next</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
              {rooms.map((r) => (
                <div key={r.id} style={{ background: '#1f2937', borderRadius: 8, border: '1px solid #334155', padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{r.room}</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>{r.patient}</div>
                  <div style={{ color: '#cbd5e1', marginBottom: 8 }}>{r.test || 'Available'}</div>
                  <button type="button" style={{ border: 0, borderRadius: 6, padding: '5px 10px', background: r.status === 'Complete' ? '#16a34a' : '#2563eb', color: '#fff', fontWeight: 600 }}>{r.status}</button>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: '#111827', borderRadius: 10, border: '1px solid #334155', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>Waiting Queue</h3>
                <p style={{ color: '#94a3b8', marginTop: 4 }}>Queue list by priority</p>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Queue count: {queue.length}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ color: '#cbd5e1', borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Queue</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Patient</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Test</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Priority</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q) => (
                    <tr key={q.id} style={{ color: '#e2e8f0', borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '8px 6px' }}>{q.queue}</td>
                      <td style={{ padding: '8px 6px' }}>{q.patient}</td>
                      <td style={{ padding: '8px 6px' }}>{q.test}</td>
                      <td style={{ padding: '8px 6px' }}>{q.priority}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <select style={{ borderRadius: 6, border: '1px solid #334155', background: '#0b122a', color: '#e2e8f0', padding: '5px 8px', width: '100%' }} onChange={(e) => assignRoom(q.queue, e.target.value)}>
                          <option value="">Room ▼</option>
                          <option value="Room 1">Room 1</option>
                          <option value="Room 2">Room 2</option>
                          <option value="Room 3">Room 3</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ background: '#111827', borderRadius: 10, border: '1px solid #334155', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={autoAssign} style={{ border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', padding: '10px 16px', fontWeight: 600 }}>Auto Assign Next</button>
              <button type="button" onClick={markAbsent} style={{ border: 0, borderRadius: 8, background: '#f97316', color: '#fff', padding: '10px 16px', fontWeight: 600 }}>Mark Absent</button>
              <button type="button" onClick={requeue} style={{ border: 0, borderRadius: 8, background: '#10b981', color: '#fff', padding: '10px 16px', fontWeight: 600 }}>Requeue Patient</button>
            </div>
            {message && <div style={{ marginTop: 12, color: '#86efac', fontWeight: 500 }}>{message}</div>}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DepartmentQueuePage;