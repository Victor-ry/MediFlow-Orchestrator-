import React, { useMemo, useState } from 'react';
import { CheckCircle, Clock, Plus, Pen, Stethoscope, Trash2, User, X } from 'lucide-react';
import Side from './Sidebar';
import './DepartmentQueuePage.css';

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
    <div className="page-container">
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
