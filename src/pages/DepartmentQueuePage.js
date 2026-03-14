import React, { useMemo, useState } from 'react';
import { CheckCircle, Clock, Plus, Pen, Stethoscope, Trash2, User, X } from 'lucide-react';
import Side from '../components/Sidebar';

const styles = `
.department-queue-page {
  font-size: 0.95rem;
  background: #f4f6fb;
  color: #1f2937;
}

.department-queue-page .main-content {
  overflow-x: hidden;
  padding: 1.25rem clamp(1rem, 2vw, 1.75rem);
}

.department-queue-page .sidebar {
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
}

.department-queue-page .logo-icon,
.department-queue-page .logo-text {
  color: #0f172a;
}

.department-queue-page .nav-item {
  color: #475569;
}

.department-queue-page .nav-item:hover {
  background: #f1f5f9;
  color: #1f2937;
}

.department-queue-page .nav-item.active {
  background: #e0f2fe;
  color: #0369a1;
}

.department-queue-page .alert-button {
  background: #ef4444;
  color: #ffffff;
}

.department-queue-page .page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.department-queue-page .page-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.4rem;
  line-height: 1.2;
}

.department-queue-page .subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.department-queue-page .btn {
  border: 1px solid #d1d5db;
  border-radius: 0.45rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  background: #ffffff;
}

.department-queue-page .btn-primary {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}

.department-queue-page .btn-soft {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.department-queue-page .btn-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.department-queue-page .icon-btn {
  border: 1px solid #cbd5e1;
  border-radius: 0.35rem;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  padding: 0.2rem 0.35rem;
}

.department-queue-page .icon-btn.small {
  width: 30px;
  height: 30px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.department-queue-page .summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.department-queue-page .summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.65rem;
  padding: 0.75rem;
  color: #0f172a;
}

.department-queue-page .card-title {
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.department-queue-page .card-value {
  font-size: 1.35rem;
  font-weight: 700;
}

.department-queue-page .dept-grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 0.75rem;
}

.department-queue-page .card {
  background: #ffffff;
  border-radius: 0.7rem;
  border: 1px solid #e5e7eb;
  padding: 0.8rem;
  min-width: 0;
}

.department-queue-page .section-title {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 700;
}

.department-queue-page .room-grid {
  display: grid;
  gap: 0.55rem;
}

.department-queue-page .room {
  border: 1px solid #e5e7eb;
  border-radius: 0.55rem;
  background: #f8fafc;
  padding: 0.55rem;
  display: grid;
  gap: 0.35rem;
}

.department-queue-page .room-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.department-queue-page .room-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.department-queue-page .room-status {
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.department-queue-page .room-patient {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #1f2937;
}

.department-queue-page .empty {
  font-size: 0.82rem;
  color: #64748b;
}

.department-queue-page .table-wrap {
  overflow-x: auto;
  max-width: 100%;
}

.department-queue-page .queue-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.department-queue-page .queue-table th,
.department-queue-page .queue-table td {
  padding: 0.55rem 0.4rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.82rem;
}

.department-queue-page .queue-table th {
  text-align: left;
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.department-queue-page .pill {
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  border: 1px solid #d1d5db;
}

.department-queue-page .pill.urgent {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.department-queue-page .pill.routine {
  background: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
}

.department-queue-page .at-risk {
  background: #fff7ed;
}

.department-queue-page .queue-actions {
  display: flex;
  gap: 0.35rem;
}

.department-queue-page .modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 1rem;
}

.department-queue-page .modal-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.65rem;
  width: min(430px, 100%);
  padding: 0.85rem;
}

.department-queue-page .modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.45rem;
}

.department-queue-page .modal-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.department-queue-page .form-row {
  margin-top: 0.55rem;
}

.department-queue-page .form-row label {
  display: block;
  margin-bottom: 0.25rem;
  color: #64748b;
  font-size: 0.8rem;
}

.department-queue-page .form-row input,
.department-queue-page .form-row select {
  width: 100%;
  border-radius: 0.4rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #1f2937;
  padding: 0.45rem 0.5rem;
}

.department-queue-page .modal-actions {
  margin-top: 0.7rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

@media (max-width: 1100px) {
  .department-queue-page .dept-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .department-queue-page .main-content {
    padding: 1rem;
  }

  .department-queue-page .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .department-queue-page .page-header .btn-primary {
    width: 100%;
  }

  .department-queue-page .summary-row {
    grid-template-columns: 1fr;
  }

  .department-queue-page .queue-table {
    min-width: 560px;
  }
}
`;

const INITIAL_ROOMS = [
  { id: 1, name: 'Lab Room 01', status: 'occupied', patient: { ticket: 'T-801', name: 'Alex Johnson', test: 'CBC' } },
  { id: 2, name: 'Lab Room 02', status: 'available', patient: null },
  { id: 3, name: 'Lab Room 03', status: 'available', patient: null },
];

const INITIAL_QUEUE = [
  { id: 1, ticket: 'T-803', patient: 'Sam Rivera', test: 'Glucose', priority: 'Routine', wait: 45 },
  { id: 2, ticket: 'T-804', patient: 'Jordan Lee', test: 'Lipid Panel', priority: 'Urgent', wait: 10 },
  { id: 3, ticket: 'T-805', patient: 'Casey Smith', test: 'Blood Panel', priority: 'Routine', wait: 15 },
];

export default function DepartmentQueuePage() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDraft, setRoomDraft] = useState({ name: '', status: 'available' });

  const sortedQueue = useMemo(() => [...queue].sort((a, b) => {
    if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
    if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
    return b.wait - a.wait;
  }), [queue]);

  const openRoomModal = (room) => {
    setEditingRoom(room);
    setRoomDraft({ name: room.name, status: room.status });
    setShowRoomModal(true);
  };

  const saveRoom = () => {
    if (!editingRoom) return;
    setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? { ...r, ...roomDraft } : r)));
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const completeRoom = (roomId) => {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, status: 'available', patient: null } : room)));
  };

  const callPatient = (patientId, roomId) => {
    const target = queue.find((item) => item.id === patientId);
    if (!target) return;
    setQueue((prev) => prev.filter((item) => item.id !== patientId));
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, status: 'occupied', patient: target } : room)));
  };

  const removeFromQueue = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const checkInPatient = () => {
    const name = window.prompt('Enter patient name to check in:');
    if (!name) return;
    const test = window.prompt('Enter test/service behavior:');
    if (!test) return;
    if (!window.confirm(`Confirm check-in ${name} for ${test}?`)) return;
    const newItem = {
      id: Date.now(),
      ticket: `T-${Math.floor(100 + Math.random() * 900)}`,
      patient: name,
      test,
      priority: 'Routine',
      wait: 0,
    };
    setQueue((prev) => [...prev, newItem]);
  };

  return (
    <div className="page-container department-queue-page">
      <style>{styles}</style>
      <Side />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Department Queue</h2>
            <p className="subtitle">Manage walk-in check-in, queue, and room assignments</p>
          </div>
          <button className="btn btn-primary" onClick={checkInPatient}><Plus size={14} /> Check-in Patient</button>
        </div>

        <div className="summary-row">
          <div className="summary-card"><div className="card-title"><Stethoscope size={14} /> Active Rooms</div><div className="card-value">{rooms.filter((r) => r.patient).length}</div></div>
          <div className="summary-card"><div className="card-title"><Clock size={14} /> Waiting Pool</div><div className="card-value">{queue.length}</div></div>
          <div className="summary-card"><div className="card-title"><CheckCircle size={14} /> SLA Risk</div><div className="card-value">{queue.filter((q) => q.priority === 'Routine' && q.wait > 30).length}</div></div>
        </div>

        <div className="dept-grid">
          <section className="card">
            <div className="section-title">Lab Rooms</div>
            <div className="room-grid">
              {rooms.map((room) => (
                <div key={room.id} className={`room ${room.status}`}>
                  <div className="room-head"><div><div className="room-name">{room.name}</div><div className="room-status">{room.status}</div></div><button className="icon-btn small" onClick={() => openRoomModal(room)}><Pen size={14} /></button></div>
                  {room.patient ? <div className="room-patient"><User size={14} /><span>{room.patient.patient || room.patient.name}</span></div> : <div className="empty">No active patient</div>}
                  <button className={`btn ${room.patient ? 'btn-primary' : 'btn-soft'}`} onClick={() => room.patient && completeRoom(room.id)} disabled={!room.patient}>{room.patient ? 'Complete' : 'Idle'}</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-title">Central Waiting Pool</div>
            <div className="table-wrap">
              <table className="queue-table">
                <thead><tr><th>Ticket</th><th>Patient</th><th>Test</th><th>Priority</th><th>Wait</th><th>Actions</th></tr></thead>
                <tbody>
                  {sortedQueue.map((item) => (
                    <tr key={item.id} className={item.priority === 'Routine' && item.wait > 30 ? 'at-risk' : ''}>
                      <td>{item.ticket}</td><td>{item.patient}</td><td>{item.test}</td><td><span className={`pill ${item.priority.toLowerCase()}`}>{item.priority}</span></td><td>{item.wait}m</td>
                      <td className="queue-actions"><button className="btn btn-soft" onClick={() => callPatient(item.id, rooms.find((r) => r.status === 'available')?.id ?? rooms[0].id)}>Call</button><button className="btn btn-danger" onClick={() => removeFromQueue(item.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {showRoomModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head"><h3>Edit Room</h3><button className="icon-btn small" onClick={() => setShowRoomModal(false)}><X size={16} /></button></div>
            <div className="form-row"><label>Room Name</label><input value={roomDraft.name} onChange={(e) => setRoomDraft((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="form-row"><label>Status</label><select value={roomDraft.status} onChange={(e) => setRoomDraft((prev) => ({ ...prev, status: e.target.value }))}><option value="available">available</option><option value="occupied">occupied</option></select></div>
            <div className="modal-actions"><button className="btn btn-soft" onClick={() => setShowRoomModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveRoom}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
