import React, { useMemo, useState } from 'react';
import { CheckCircle, Clock, RefreshCcw, Stethoscope, Bell, UserPlus, User, Settings } from 'lucide-react';
import Side from './Sidebar';
import './DepartmentQueuePage.css';

const INITIAL_ROOMS = [
  { id: 1, name: 'Lab Room 01', patient: { ticket: 'T-801', name: 'Alex Johnson', test: 'CBC' }, status: 'occupied' },
  { id: 2, name: 'Lab Room 02', patient: { ticket: 'T-802', name: 'Maria Garcia', test: 'Troponin' }, status: 'occupied' },
  { id: 3, name: 'Lab Room 03', patient: null, status: 'available' },
];

const INITIAL_QUEUE = [
  { id: 1, ticket: 'T-803', patient: 'Sam Rivera', test: 'Glucose', priority: 'Routine', wait: 45 },
  { id: 2, ticket: 'T-804', patient: 'Jordan Lee', test: 'Lipid Panel', priority: 'Urgent', wait: 10 },
  { id: 3, ticket: 'T-805', patient: 'Casey Smith', test: 'Blood Panel', priority: 'Routine', wait: 15 },
];

const PATIENT_NAMES = ['Alex Johnson', 'Maria Garcia', 'Sam Rivera', 'Jordan Lee', 'Casey Smith'];
const TESTS = ['CBC', 'Troponin', 'Glucose', 'Lipid Panel', 'Blood Panel'];

export default function DepartmentQueuePage() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);

  const sortedQueue = useMemo(() => [...queue].sort((a, b) => {
    if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
    if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
    return b.wait - a.wait;
  }), [queue]);

  const callNext = (roomId) => {
    if (!sortedQueue.length) return;
    const next = sortedQueue[0];
    setQueue((prev) => prev.filter((r) => r.id !== next.id));
    setRooms((prev) => prev.map((room) => room.id === roomId ? { ...room, patient: next, status: 'occupied' } : room));
  };

  const markComplete = (roomId) => {
    setRooms((prev) => prev.map((room) => room.id === roomId ? { ...room, patient: null, status: 'available' } : room));
  };

  const addUrgent = () => {
    const next = {
      id: Date.now(),
      ticket: `T-${Math.floor(Math.random() * 900) + 100}`,
      patient: PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)],
      test: TESTS[Math.floor(Math.random() * TESTS.length)],
      priority: 'Urgent',
      wait: 0,
    };
    setQueue((prev) => [...prev, next]);
  };

  const refreshWait = () => setQueue((prev) => prev.map((p) => ({ ...p, wait: p.wait + 5 })));

  return (
    <div className="page-container">
      <Side />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Department Queue</h2>
            <p className="subtitle">Laboratory queue orchestration for care teams</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-soft" onClick={refreshWait}><RefreshCcw size={16} /> Sync</button>
            <button className="btn btn-primary" onClick={addUrgent}><UserPlus size={16} /> Add Urgent</button>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-card">
            <div className="card-title"><Stethoscope size={16} /> Active Rooms</div>
            <div className="card-value">{rooms.filter((r) => r.status === 'occupied').length}</div>
          </div>
          <div className="summary-card">
            <div className="card-title"><Clock size={16} /> Waiting Patients</div>
            <div className="card-value">{queue.length}</div>
          </div>
          <div className="summary-card">
            <div className="card-title"><Settings size={16} /> SLA Risk</div>
            <div className="card-value">{queue.filter((p) => p.priority === 'Routine' && p.wait > 30).length}</div>
          </div>
        </div>

        <div className="dept-grid">
          <section className="card">
            <div className="section-title">Active Lab Rooms</div>
            <div className="room-grid">
              {rooms.map((room) => (
                <div key={room.id} className={`room ${room.status}`}>
                  <div className="room-head">
                    <span>{room.name}</span>
                    <span className="status-pill">{room.status}</span>
                  </div>
                  {room.patient ? (
                    <div className="room-patient">
                      <User size={16} />
                      <div>
                        <div className="name">{room.patient.name}</div>
                        <div className="meta">{room.patient.ticket} • {room.patient.test}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty">No active patient</div>
                  )}
                  <button
                    className={`btn ${room.patient ? 'btn-primary' : 'btn-soft'}`}
                    onClick={() => (room.patient ? markComplete(room.id) : callNext(room.id))}
                  >
                    {room.patient ? <><CheckCircle size={14} /> Complete</> : <><Bell size={14} /> Call Next</>}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-title">Central Waiting Pool</div>
            <div className="table-wrap">
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Patient</th>
                    <th>Priority</th>
                    <th>Wait</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQueue.map((p) => (
                    <tr key={p.id} className={p.priority === 'Routine' && p.wait > 30 ? 'at-risk' : ''}>
                      <td>{p.ticket}</td>
                      <td>{p.patient}</td>
                      <td><span className={`pill ${p.priority.toLowerCase()}`}>{p.priority}</span></td>
                      <td>{p.wait}min</td>
                      <td>
                        <button className="icon-btn" onClick={() => setQueue((old) => old.map((x) => x.id === p.id ? { ...x, wait: 0 } : x))}>
                          <RefreshCcw size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
