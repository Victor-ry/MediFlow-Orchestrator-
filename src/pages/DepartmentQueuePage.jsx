import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Side from '../components/Sidebar';

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

  const autoAssign = () => setMessage('Auto assigned next patient to first available room.');
  const markAbsent = () => setMessage('Marked selected patient absent.');
  const requeue = () => setMessage('Requeued selected patient to end.');

  const assignRoom = (queueId, room) => {
    if (!room) return;
    setMessage(`Assigned ${queueId} to ${room}.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b122a' }}>
      <Side onTriggerAlert={() => setMessage('Alert triggered from drawer')} />

      <main style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ color: '#e2e8f0', margin: 0 }}>Laboratory Queue Dashboard</h1>
          <p style={{ color: '#94a3b8', marginTop: 4 }}>Monitor room status, waiting queue, and done/next actions.</p>
        </header>

        <div style={{ display: 'grid', gap: 16 }}>
          <section style={{ background: '#111827', borderRadius: 12, border: '1px solid #334155', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: '#e2e8f0', margin: 0 }}>Rooms</h2>
                <p style={{ color: '#94a3b8', marginTop: 4 }}>Current lab assignments</p>
              </div>
              <button type="button" onClick={autoAssign} style={{ border: 0, borderRadius: 8, background: '#2563eb', color: '#fff', padding: '8px 12px', fontWeight: 600 }}>Auto Assign</button>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
              {rooms.map((r) => (
                <div key={r.id} style={{ background: '#1f2937', border: '1px solid #334155', borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.room}</div>
                  <div style={{ color: '#f8fafc', fontWeight: 700, marginTop: 4 }}>{r.patient}</div>
                  <div style={{ color: '#cbd5e1', marginTop: 2 }}>{r.test || 'Available'}</div>
                  <span style={{ marginTop: 8, display: 'inline-block', borderRadius: 6, background: r.status === 'Complete' ? '#16a34a' : '#2563eb', color: '#fff', padding: '3px 8px', fontWeight: 600, fontSize: 12 }}>{r.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: '#111827', borderRadius: 12, border: '1px solid #334155', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h2 style={{ color: '#e2e8f0', margin: 0 }}>Waiting Queue</h2>
                <p style={{ color: '#94a3b8', marginTop: 4 }}>Queue sorted by arrival and priority</p>
              </div>
              <div style={{ color: '#94a3b8' }}>Total: {queue.length}</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr style={{ color: '#cbd5e1', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px' }}>Queue</th>
                    <th style={{ padding: '8px 6px' }}>Patient</th>
                    <th style={{ padding: '8px 6px' }}>Test</th>
                    <th style={{ padding: '8px 6px' }}>Priority</th>
                    <th style={{ padding: '8px 6px' }}>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #1f2937', color: '#e2e8f0' }}>
                      <td style={{ padding: '10px 6px' }}>{q.queue}</td>
                      <td style={{ padding: '10px 6px' }}>{q.patient}</td>
                      <td style={{ padding: '10px 6px' }}>{q.test}</td>
                      <td style={{ padding: '10px 6px' }}>{q.priority}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <select style={{ width: '100%', background: '#0b122a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 6, padding: '4px 6px' }} onChange={(e) => assignRoom(q.queue, e.target.value)}>
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

          <section style={{ background: '#111827', borderRadius: 12, border: '1px solid #334155', padding: 14 }}>
            <h3 style={{ color: '#e2e8f0', margin: 0 }}>Controls</h3>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={autoAssign} style={{ border: 0, borderRadius: 8, padding: '10px 16px', background: '#2563eb', color: '#fff', fontWeight: 600 }}>Auto Assign Next</button>
              <button type="button" onClick={markAbsent} style={{ border: 0, borderRadius: 8, padding: '10px 16px', background: '#f97316', color: '#fff', fontWeight: 600 }}>Mark Absent</button>
              <button type="button" onClick={requeue} style={{ border: 0, borderRadius: 8, padding: '10px 16px', background: '#10b981', color: '#fff', fontWeight: 600 }}>Requeue Patient</button>
            </div>
            {message && <div style={{ marginTop: 10, color: '#a3e635', fontWeight: 500 }}>{message}</div>}
          </section>
        </div>
      </main>
    </div>
  );
};

export default DepartmentQueuePage;