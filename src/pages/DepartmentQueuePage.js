import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Plus, Pen, Stethoscope, Trash2, User, X } from 'lucide-react';
import Side from '../components/Sidebar';
import { getDepartments } from '../utils/departmentDb';
import { getOrdersByPatientIdAndDepartment, getPatientById } from '../utils/checkPatientRoute';
import {
  createDepartmentQueueEntry,
  formatQueuePriority,
  getActiveQueueEntryForPatient,
  getDepartmentQueueEntries,
  updateDepartmentQueueEntryStatus,
} from '../utils/OrderQueue';

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

.department-queue-page .title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.department-queue-page .department-filter {
  min-width: 170px;
  border-radius: 0.4rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1f2937;
  padding: 0.4rem 0.5rem;
  font-size: 0.8rem;
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

.department-queue-page .btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  grid-template-columns: minmax(240px, 0.82fr) minmax(0, 1.18fr);
  gap: 0.75rem;
  align-items: start;
}

.department-queue-page .card {
  background: #ffffff;
  border-radius: 0.7rem;
  border: 1px solid #e5e7eb;
  padding: 0.72rem;
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
  gap: 0.45rem;
}

.department-queue-page .room {
  border: 1px solid #e5e7eb;
  border-radius: 0.55rem;
  background: #f8fafc;
  padding: 0.45rem 0.5rem;
  display: grid;
  gap: 0.25rem;
}

.department-queue-page .room-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.department-queue-page .room-name {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}

.department-queue-page .room-status {
  font-size: 0.68rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.department-queue-page .room-patient {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  color: #1f2937;
}

.department-queue-page .empty {
  font-size: 0.76rem;
  color: #64748b;
}

.department-queue-page .table-wrap {
  overflow-x: hidden;
  max-width: 100%;
}

.department-queue-page .queue-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.department-queue-page .queue-table th,
.department-queue-page .queue-table td {
  padding: 0.5rem 0.35rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 0.78rem;
  vertical-align: middle;
}

.department-queue-page .queue-table th {
  text-align: left;
  color: #64748b;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.department-queue-page .queue-table th:nth-child(1),
.department-queue-page .queue-table td:nth-child(1) {
  width: 14%;
}

.department-queue-page .queue-table th:nth-child(2),
.department-queue-page .queue-table td:nth-child(2) {
  width: 21%;
}

.department-queue-page .queue-table th:nth-child(3),
.department-queue-page .queue-table td:nth-child(3) {
  width: 20%;
}

.department-queue-page .queue-table th:nth-child(4),
.department-queue-page .queue-table td:nth-child(4) {
  width: 14%;
}

.department-queue-page .queue-table th:nth-child(5),
.department-queue-page .queue-table td:nth-child(5) {
  width: 14%;
}

.department-queue-page .queue-table th:nth-child(6),
.department-queue-page .queue-table td:nth-child(6) {
  width: 11%;
}

.department-queue-page .queue-table th:nth-child(7),
.department-queue-page .queue-table td:nth-child(7) {
  width: 20%;
}

.department-queue-page .queue-table td:nth-child(2),
.department-queue-page .queue-table td:nth-child(3) {
  overflow-wrap: anywhere;
}

.department-queue-page .empty-queue-row td {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 0.9rem 0.45rem;
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
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.department-queue-page .queue-actions .btn {
  padding: 0.38rem 0.55rem;
  font-size: 0.76rem;
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
  max-height: min(88vh, 860px);
  overflow-y: auto;
  padding: 0.85rem;
}

.department-queue-page .modal-card.check-in-modal {
  width: min(760px, 100%);
  padding: 1rem;
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
  flex-wrap: wrap;
}

.department-queue-page .modal-description {
  margin: 0 0 0.7rem;
  color: #64748b;
  font-size: 0.82rem;
}

.department-queue-page .feedback-banner {
  margin: 0.75rem 0;
  border-radius: 0.55rem;
  padding: 0.65rem 0.75rem;
  font-size: 0.8rem;
  border: 1px solid transparent;
}

.department-queue-page .feedback-banner.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.department-queue-page .feedback-banner.success {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.department-queue-page .info-stack {
  display: grid;
  gap: 0.55rem;
}

.department-queue-page .preview-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.55rem;
  background: #f8fafc;
  padding: 0.7rem;
  display: grid;
  gap: 0.45rem;
}

.department-queue-page .preview-card.hero {
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border-color: #bfdbfe;
}

.department-queue-page .preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.department-queue-page .preview-grid.compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.department-queue-page .preview-label {
  display: block;
  color: #64748b;
  font-size: 0.74rem;
  margin-bottom: 0.14rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.department-queue-page .preview-value {
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 600;
}

.department-queue-page .service-list {
  margin: 0;
  padding-left: 1rem;
  color: #1f2937;
  font-size: 0.8rem;
}

.department-queue-page .service-list.tight {
  margin-top: 0.25rem;
}

.department-queue-page .modal-shell {
  display: grid;
  gap: 0.85rem;
}

.department-queue-page .modal-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.department-queue-page .modal-kicker {
  margin: 0;
  color: #0369a1;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.department-queue-page .modal-title-block h3 {
  margin: 0.15rem 0 0;
}

.department-queue-page .check-in-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 0.9rem;
}

.department-queue-page .check-in-column {
  display: grid;
  gap: 0.8rem;
  align-content: start;
}

.department-queue-page .subsection-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.65rem;
  background: #ffffff;
  padding: 0.8rem;
  display: grid;
  gap: 0.65rem;
  box-sizing: border-box;
}

.department-queue-page .subsection-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.department-queue-page .subsection-title {
  margin: 0;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 700;
}

.department-queue-page .subsection-meta {
  color: #64748b;
  font-size: 0.74rem;
}

.department-queue-page .field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.department-queue-page .subsection-card .form-row {
  margin-top: 0;
}

.department-queue-page .subsection-card .form-row + .form-row {
  margin-top: 0.2rem;
}

.department-queue-page .subsection-card input,
.department-queue-page .subsection-card select {
  box-sizing: border-box;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.department-queue-page .subsection-card input:focus,
.department-queue-page .subsection-card select:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
}

.department-queue-page .order-switcher {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.department-queue-page .order-chip {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  padding: 0.38rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.department-queue-page .order-chip.active {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}

.department-queue-page .order-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.department-queue-page .detail-block {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f8fafc;
  padding: 0.65rem;
}

.department-queue-page .detail-block.full {
  grid-column: 1 / -1;
}

.department-queue-page .status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.department-queue-page .status-badge.pending,
.department-queue-page .status-badge.waiting {
  background: #fef3c7;
  color: #92400e;
}

.department-queue-page .status-badge.called {
  background: #dbeafe;
  color: #1d4ed8;
}

.department-queue-page .status-badge.complete,
.department-queue-page .status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.department-queue-page .muted-copy {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.department-queue-page .queue-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.department-queue-page .queue-meta {
  color: #64748b;
  font-size: 0.75rem;
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

  .department-queue-page .title-row {
    justify-content: space-between;
  }

  .department-queue-page .department-filter {
    min-width: 150px;
  }

  .department-queue-page .page-header .btn-primary {
    width: 100%;
  }

  .department-queue-page .summary-row {
    grid-template-columns: 1fr;
  }

  .department-queue-page .table-wrap {
    overflow-x: auto;
  }

  .department-queue-page .queue-table {
    min-width: 560px;
  }

  .department-queue-page .check-in-layout,
  .department-queue-page .preview-grid.compact,
  .department-queue-page .field-grid,
  .department-queue-page .order-detail-grid {
    grid-template-columns: 1fr;
  }
}
`;

const INITIAL_ROOMS = [
  { id: 1, name: 'Room/Counter 01', department: 'Lab', status: 'occupied', patient: { ticket: 'T-801', name: 'Alex Johnson', test: 'CBC' } },
  { id: 2, name: 'Room/Counter 02', department: 'Lab', status: 'available', patient: null },
  { id: 3, name: 'Room/Counter 03', department: 'Lab', status: 'available', patient: null },
];

const INITIAL_QUEUE = [];

const normalizeDepartment = (value) => (value || '').trim().toLowerCase();

const uniqueByNormalizedDepartment = (values) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;

    const key = normalizeDepartment(trimmed);
    if (seen.has(key)) return;

    seen.add(key);
    result.push(trimmed);
  });

  return result;
};

const buildServiceSummary = (orders) => {
  const services = orders.flatMap((order) => {
    if (Array.isArray(order.serviceNameList) && order.serviceNameList.length > 0) {
      return order.serviceNameList.map((service) => service.serviceName).filter(Boolean);
    }

    if (order.serviceCodeList) {
      return order.serviceCodeList.split(',').map((code) => code.trim()).filter(Boolean);
    }

    return [];
  });

  const uniqueServices = [...new Set(services)];
  return uniqueServices.join(', ');
};

const formatOrderTimestamp = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString();
};

const getOrderStatusClassName = (status) => (status || 'pending').toLowerCase();

export default function DepartmentQueuePage() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueFeedback, setQueueFeedback] = useState({ type: '', message: '' });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDraft, setRoomDraft] = useState({ name: '', status: 'available' });
  const [checkInDraft, setCheckInDraft] = useState({ patientId: '' });
  const [checkInCandidate, setCheckInCandidate] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [checkInBusy, setCheckInBusy] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  useEffect(() => {
    const loadDepartments = async () => {
      const result = await getDepartments();
      if (!result?.error && Array.isArray(result?.data)) {
        setDepartments(result.data);
      }
    };

    loadDepartments();
  }, []);

  const dbDepartmentNames = useMemo(() => {
    const names = departments
      .map((item) => item.departmentName)
      .filter(Boolean);

    return uniqueByNormalizedDepartment(names);
  }, [departments]);

  const selectedDepartmentRecord = useMemo(() => (
    departments.find((department) => normalizeDepartment(department.departmentName) === normalizeDepartment(selectedDepartment)) || null
  ), [departments, selectedDepartment]);

  useEffect(() => {
    const baseDepartments = uniqueByNormalizedDepartment(['Lab', ...dbDepartmentNames]);
    const baseDepartmentKeys = new Set(baseDepartments.map((dept) => normalizeDepartment(dept)));

    setRooms((prev) => {
      const existingDepartments = new Set(
        prev
          .map((room) => normalizeDepartment(room.department))
          .filter(Boolean)
      );
      const missingDepartments = baseDepartments.filter((dept) => !existingDepartments.has(normalizeDepartment(dept)));
      if (missingDepartments.length === 0) return prev;

      let nextId = prev.reduce((maxId, room) => Math.max(maxId, room.id), 0) + 1;
      const generatedRooms = missingDepartments.flatMap((dept) => {
        const templates = [
          { name: 'Room/Counter 01', status: 'available' },
          { name: 'Room/Counter 02', status: 'available' },
          { name: 'Room/Counter 03', status: 'available' },
        ];
        return templates.map((template) => {
          const room = {
            id: nextId,
            name: template.name,
            department: dept,
            status: template.status,
            patient: null,
          };
          nextId += 1;
          return room;
        });
      });

      return [...prev, ...generatedRooms];
    });

    setQueue((prev) => prev.map((item) => {
      const itemKey = normalizeDepartment(item.department);
      if (!itemKey || !baseDepartmentKeys.has(itemKey)) return item;

      const canonicalName = baseDepartments.find((dept) => normalizeDepartment(dept) === itemKey);
      if (!canonicalName || canonicalName === item.department) return item;

      return { ...item, department: canonicalName };
    }));
  }, [dbDepartmentNames]);

  const filteredQueue = useMemo(() => {
    if (!selectedDepartment) return [];
    return queue.filter((item) => normalizeDepartment(item.department) === normalizeDepartment(selectedDepartment));
  }, [queue, selectedDepartment]);

  const filteredRooms = useMemo(() => {
    if (!selectedDepartment) return [];
    return rooms.filter((room) => normalizeDepartment(room.department) === normalizeDepartment(selectedDepartment));
  }, [rooms, selectedDepartment]);

  const sortedQueue = useMemo(() => [...filteredQueue].sort((a, b) => {
    if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
    if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
    return b.wait - a.wait;
  }), [filteredQueue]);

  const departmentOptions = useMemo(() => {
    const dbOptions = dbDepartmentNames;
    const queueOptions = queue.map((item) => item.department).filter(Boolean);
    const roomOptions = rooms.map((room) => room.department).filter(Boolean);
    return uniqueByNormalizedDepartment(['Lab', ...dbOptions, ...queueOptions, ...roomOptions]);
  }, [dbDepartmentNames, queue, rooms]);

  useEffect(() => {
    if (departmentOptions.length === 0) {
      setSelectedDepartment('');
      return;
    }

    const hasCurrentSelection = departmentOptions.some(
      (dept) => normalizeDepartment(dept) === normalizeDepartment(selectedDepartment)
    );

    if (!hasCurrentSelection) {
      setSelectedDepartment(departmentOptions[0]);
    }
  }, [departmentOptions, selectedDepartment]);

  const loadQueue = async () => {
    if (!selectedDepartment) {
      setQueue([]);
      return;
    }

    setQueueLoading(true);

    const result = await getDepartmentQueueEntries({
      departmentCode: selectedDepartmentRecord?.departmentCode,
      departmentName: selectedDepartmentRecord?.departmentName || selectedDepartment,
      statuses: ['waiting'],
    });

    if (result.error) {
      setQueue([]);
      setQueueFeedback({ type: 'error', message: result.error.message });
      setQueueLoading(false);
      return;
    }

    setQueue(result.data);
    setQueueFeedback((current) => (current.type === 'error' ? { type: '', message: '' } : current));
    setQueueLoading(false);
  };

  useEffect(() => {
    const syncQueue = async () => {
      if (!selectedDepartment) {
        setQueue([]);
        return;
      }

      setQueueLoading(true);

      const result = await getDepartmentQueueEntries({
        departmentCode: selectedDepartmentRecord?.departmentCode,
        departmentName: selectedDepartmentRecord?.departmentName || selectedDepartment,
        statuses: ['waiting'],
      });

      if (result.error) {
        setQueue([]);
        setQueueFeedback({ type: 'error', message: result.error.message });
        setQueueLoading(false);
        return;
      }

      setQueue(result.data);
      setQueueFeedback((current) => (current.type === 'error' ? { type: '', message: '' } : current));
      setQueueLoading(false);
    };

    syncQueue();
  }, [selectedDepartment, selectedDepartmentRecord?.departmentCode, selectedDepartmentRecord?.departmentName]);

  const resetCheckInState = () => {
    setCheckInDraft({ patientId: '' });
    setCheckInCandidate(null);
    setSelectedOrderId('');
    setCheckInError('');
    setCheckInBusy(false);
  };

  const selectedOrder = useMemo(() => {
    if (!checkInCandidate?.eligibleOrders?.length) return null;

    return checkInCandidate.eligibleOrders.find((order) => String(order.order_id) === String(selectedOrderId))
      || checkInCandidate.primaryOrder
      || checkInCandidate.eligibleOrders[0]
      || null;
  }, [checkInCandidate, selectedOrderId]);

  const openCheckInModal = () => {
    resetCheckInState();
    setShowCheckInModal(true);
  };

  const closeCheckInModal = () => {
    resetCheckInState();
    setShowCheckInModal(false);
  };

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

  const completeRoom = async (roomId) => {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;

    if (room.patient?.sourceOrderIds?.length) {
      const result = await updateDepartmentQueueEntryStatus(room.patient.sourceOrderIds, 'complete');

      if (result.error) {
        window.alert(result.error.message);
        return;
      }
    }

    setRooms((prev) => prev.map((item) => (item.id === roomId ? { ...item, status: 'available', patient: null } : item)));
  };

  const callPatient = async (patientId) => {
    const target = queue.find((item) => item.id === patientId);
    if (!target) return;

    const availableRoom = rooms.find((room) => normalizeDepartment(room.department) === normalizeDepartment(target.department) && room.status === 'available');
    if (!availableRoom) {
      window.alert(`No available Room/Counter for ${target.department}.`);
      return;
    }

    if (target.sourceOrderIds?.length) {
      const result = await updateDepartmentQueueEntryStatus(target.sourceOrderIds, 'called');

      if (result.error) {
        window.alert(result.error.message);
        return;
      }
    }

    setQueue((prev) => prev.filter((item) => item.id !== patientId));
    setRooms((prev) => prev.map((room) => (room.id === availableRoom.id ? { ...room, status: 'occupied', patient: target } : room)));
  };

  const removeFromQueue = async (id) => {
    const target = queue.find((item) => item.id === id);
    if (!target) return;

    if (target.sourceOrderIds?.length) {
      const result = await updateDepartmentQueueEntryStatus(target.sourceOrderIds, 'cancelled');
      if (result.error) {
        window.alert(result.error.message);
        return;
      }
    }

    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const verifyPatientForCheckIn = async (event) => {
    event.preventDefault();

    const patientId = checkInDraft.patientId.trim().toUpperCase();
    if (!patientId) {
      setCheckInError('Enter a patient ID first.');
      setCheckInCandidate(null);
      return;
    }

    setCheckInBusy(true);
    setCheckInError('');
    setCheckInCandidate(null);

    const patientResult = await getPatientById(patientId);
    if (patientResult.error || !patientResult.data) {
      setCheckInError(patientResult.error?.message || `Patient ${patientId} was not found.`);
      setCheckInBusy(false);
      return;
    }

    const activeQueueResult = await getActiveQueueEntryForPatient({
      patientId,
      departmentCode: selectedDepartmentRecord?.departmentCode,
      departmentName: selectedDepartmentRecord?.departmentName || selectedDepartment,
    });

    if (activeQueueResult.error) {
      setCheckInError(activeQueueResult.error.message);
      setCheckInBusy(false);
      return;
    }

    if (activeQueueResult.data) {
      setCheckInError(`Patient ${patientId} is already in the waiting pool for ${selectedDepartment}.`);
      setCheckInBusy(false);
      return;
    }

    const ordersResult = await getOrdersByPatientIdAndDepartment(patientId, {
      departmentCode: selectedDepartmentRecord?.departmentCode,
      departmentName: selectedDepartmentRecord?.departmentName || selectedDepartment,
    });

    if (ordersResult.error) {
      setCheckInError(ordersResult.error.message || 'Unable to verify patient orders.');
      setCheckInBusy(false);
      return;
    }

    const eligibleOrders = (ordersResult.data || []).filter((order) => order.status?.toLowerCase() !== 'complete');

    if (eligibleOrders.length === 0) {
      setCheckInError(`Patient ${patientId} has no active doctor order for ${selectedDepartment}. Consultation must be completed before queuing.`);
      setCheckInBusy(false);
      return;
    }

    const primaryOrder = eligibleOrders[0];
    const serviceSummary = buildServiceSummary(eligibleOrders);

    setCheckInCandidate({
      patient: patientResult.data,
      patientId,
      primaryOrder,
      eligibleOrders,
      serviceSummary,
      priority: formatQueuePriority(primaryOrder.priority),
      departmentCode: selectedDepartmentRecord?.departmentCode || primaryOrder.departmentCode || '',
      departmentName: selectedDepartmentRecord?.departmentName || primaryOrder.Department?.departmentName || selectedDepartment,
    });
    setSelectedOrderId(String(primaryOrder.order_id));
    setCheckInBusy(false);
  };

  const confirmPatientCheckIn = async () => {
    if (!checkInCandidate) return;

    setCheckInBusy(true);
    setCheckInError('');

    const activeQueueResult = await getActiveQueueEntryForPatient({
      patientId: checkInCandidate.patientId,
      departmentCode: checkInCandidate.departmentCode,
      departmentName: checkInCandidate.departmentName,
    });

    if (activeQueueResult.error) {
      setCheckInError(activeQueueResult.error.message);
      setCheckInBusy(false);
      return;
    }

    if (activeQueueResult.data) {
      setCheckInError(`Patient ${checkInCandidate.patientId} is already queued for ${checkInCandidate.departmentName}.`);
      setCheckInBusy(false);
      return;
    }

    const createResult = await createDepartmentQueueEntry({
      orderIds: checkInCandidate.eligibleOrders.map((order) => order.order_id),
    });

    if (createResult.error) {
      setCheckInError(createResult.error.message);
      setCheckInBusy(false);
      return;
    }

    await loadQueue();
    setQueueFeedback({
      type: 'success',
      message: `Patient ${checkInCandidate.patientId} added to the Central Waiting Pool for ${checkInCandidate.departmentName}${createResult.data?.ticket ? ` as ${createResult.data.ticket}` : ''}.`,
    });
    closeCheckInModal();
  };

  return (
    <div className="page-container department-queue-page">
      <style>{styles}</style>
      <Side />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="title-row">
              <h2>Department Queue</h2>
              <select
                className="department-filter"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <p className="subtitle">Check in for Department Queue</p>
          </div>
          <button className="btn btn-primary" onClick={openCheckInModal} disabled={!selectedDepartment}><Plus size={14} /> Check-in Patient</button>
        </div>

        {queueFeedback.message ? (
          <div className={`feedback-banner ${queueFeedback.type || 'success'}`}>{queueFeedback.message}</div>
        ) : null}

        <div className="summary-row">
          <div className="summary-card"><div className="card-title"><Stethoscope size={14} /> Active Rooms</div><div className="card-value">{filteredRooms.filter((r) => r.patient).length}</div></div>
          <div className="summary-card"><div className="card-title"><Clock size={14} /> Waiting Pool</div><div className="card-value">{filteredQueue.length}</div></div>
          <div className="summary-card"><div className="card-title"><CheckCircle size={14} /> SLA Risk</div><div className="card-value">{filteredQueue.filter((q) => q.priority === 'Routine' && q.wait > 30).length}</div></div>
        </div>

        <div className="dept-grid">
          <section className="card">
            <div className="section-title">Room/Counter</div>
            <div className="room-grid">
              {filteredRooms.length === 0 ? (
                <div className="empty">No Room/Counter configured for this department.</div>
              ) : filteredRooms.map((room) => (
                <div key={room.id} className={`room ${room.status}`}>
                  <div className="room-head"><div><div className="room-name">{room.name}</div><div className="room-status">{room.status}</div></div><button className="icon-btn small" onClick={() => openRoomModal(room)}><Pen size={14} /></button></div>
                  <div className="room-status">{room.department}</div>
                  {room.patient ? <div className="room-patient"><User size={14} /><span>{room.patient.patient || room.patient.name}</span></div> : <div className="empty">No active patient</div>}
                  <button className={`btn ${room.patient ? 'btn-primary' : 'btn-soft'}`} onClick={() => room.patient && completeRoom(room.id)} disabled={!room.patient}>{room.patient ? 'Complete' : 'Idle'}</button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="queue-panel-head">
              <div className="section-title">Central Waiting Pool</div>
              <div className="queue-meta">{queueLoading ? 'Refreshing queue...' : `${sortedQueue.length} patient(s)`}</div>
            </div>
            {queueFeedback.type === 'error' ? (
              <div className="feedback-banner error">{queueFeedback.message}</div>
            ) : null}
            <div className="table-wrap">
              <table className="queue-table">
                <thead><tr><th>Ticket</th><th>Patient</th><th>Test</th><th>Priority</th><th>Department</th><th>Wait</th><th>Actions</th></tr></thead>
                <tbody>
                  {queueLoading ? (
                    <tr className="empty-queue-row">
                      <td colSpan={7}>Loading queue...</td>
                    </tr>
                  ) : sortedQueue.length === 0 ? (
                    <tr className="empty-queue-row">
                      <td colSpan={7}>No queue for now.</td>
                    </tr>
                  ) : (
                    sortedQueue.map((item) => (
                      <tr key={item.id} className={item.priority === 'Routine' && item.wait > 30 ? 'at-risk' : ''}>
                        <td>{item.ticket}</td><td>{item.patient}</td><td>{item.test}</td><td><span className={`pill ${item.priority.toLowerCase()}`}>{item.priority}</span></td><td>{item.department || '-'}</td><td>{item.wait}m</td>
                        <td className="queue-actions"><button className="btn btn-soft" onClick={() => callPatient(item.id)}>Call</button><button className="btn btn-danger" onClick={() => removeFromQueue(item.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))
                  )}
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

      {showCheckInModal && (
        <div className="modal-overlay">
          <div className="modal-card check-in-modal">
            <div className="modal-shell">
              <div className="modal-topbar">
                <div className="modal-title-block">
                  <p className="modal-kicker">Department Queue</p>
                  <h3>Check-in Patient</h3>
                  <p className="modal-description">Enter the patient ID, verify the matched order, then add the patient into the waiting pool for {selectedDepartment}.</p>
                </div>
                <button className="icon-btn small" onClick={closeCheckInModal}><X size={16} /></button>
              </div>

              <form onSubmit={verifyPatientForCheckIn}>
                <div className="check-in-layout">
                  <div className="check-in-column">
                    <div className="subsection-card">
                      <div className="subsection-head">
                        <h4 className="subsection-title">Patient Lookup</h4>
                        <span className="subsection-meta">Step 1</span>
                      </div>
                      <div className="form-row">
                        <label>Department</label>
                        <input value={selectedDepartment} readOnly />
                      </div>
                      <div className="form-row">
                        <label>Patient ID</label>
                        <input
                          value={checkInDraft.patientId}
                          onChange={(e) => setCheckInDraft({ patientId: e.target.value.toUpperCase() })}
                          placeholder="Example: P10234"
                        />
                      </div>
                      <div className="muted-copy">The system will check Patient, Order, Department, and Queue records before allowing the check-in.</div>
                    </div>

                    {checkInCandidate ? (
                      <div className="subsection-card">
                        <div className="subsection-head">
                          <h4 className="subsection-title">Patient Summary</h4>
                          <span className="subsection-meta">Ready to queue</span>
                        </div>
                        <div className="preview-card hero">
                          <div className="preview-grid compact">
                            <div>
                              <span className="preview-label">Patient ID</span>
                              <div className="preview-value">{checkInCandidate.patient.patient_id}</div>
                            </div>
                            <div>
                              <span className="preview-label">Patient Name</span>
                              <div className="preview-value">{checkInCandidate.patient.name}</div>
                            </div>
                            <div>
                              <span className="preview-label">Department</span>
                              <div className="preview-value">{checkInCandidate.departmentName}</div>
                            </div>
                            <div>
                              <span className="preview-label">Priority</span>
                              <div className="preview-value">{checkInCandidate.priority}</div>
                            </div>
                          </div>
                          <div>
                            <span className="preview-label">Services Ready For Queue</span>
                            <div className="preview-value">{checkInCandidate.serviceSummary || 'No service summary available'}</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="check-in-column">
                    {checkInError ? <div className="feedback-banner error">{checkInError}</div> : null}

                    {checkInCandidate ? (
                      <div className="subsection-card">
                        <div className="subsection-head">
                          <h4 className="subsection-title">View Order</h4>
                          <span className="subsection-meta">Step 2</span>
                        </div>

                        <div className="order-switcher">
                          {checkInCandidate.eligibleOrders.map((order) => (
                            <button
                              key={order.order_id}
                              type="button"
                              className={`order-chip ${String(selectedOrderId) === String(order.order_id) ? 'active' : ''}`}
                              onClick={() => setSelectedOrderId(String(order.order_id))}
                            >
                              View Order #{order.order_id}
                            </button>
                          ))}
                        </div>

                        {selectedOrder ? (
                          <div className="order-detail-grid">
                            <div className="detail-block">
                              <span className="preview-label">Order ID</span>
                              <div className="preview-value">#{selectedOrder.order_id}</div>
                            </div>
                            <div className="detail-block">
                              <span className="preview-label">Status</span>
                              <div className={`status-badge ${getOrderStatusClassName(selectedOrder.status)}`}>{selectedOrder.status || 'pending'}</div>
                            </div>
                            <div className="detail-block">
                              <span className="preview-label">Consultation ID</span>
                              <div className="preview-value">{selectedOrder.consultation_id || 'Not linked'}</div>
                            </div>
                            <div className="detail-block">
                              <span className="preview-label">Department Code</span>
                              <div className="preview-value">{selectedOrder.departmentCode || '-'}</div>
                            </div>
                            <div className="detail-block full">
                              <span className="preview-label">Service Codes</span>
                              <div className="preview-value">{selectedOrder.serviceCodeList || 'No service codes'}</div>
                            </div>
                            <div className="detail-block full">
                              <span className="preview-label">Mapped Service Names</span>
                              {selectedOrder.serviceNameList?.length ? (
                                <ul className="service-list tight">
                                  {selectedOrder.serviceNameList.map((service, index) => (
                                    <li key={`${selectedOrder.order_id}-${service.serviceName || index}`}>{service.serviceName || 'Unnamed service'}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="preview-value">No mapped services found</div>
                              )}
                            </div>
                            <div className="detail-block full">
                              <span className="preview-label">Remarks</span>
                              <div className="preview-value">{selectedOrder.remarks || 'No remarks provided'}</div>
                            </div>
                            <div className="detail-block">
                              <span className="preview-label">Created At</span>
                              <div className="preview-value">{formatOrderTimestamp(selectedOrder.created_at)}</div>
                            </div>
                            <div className="detail-block">
                              <span className="preview-label">Department Location</span>
                              <div className="preview-value">{selectedOrder.Department?.location || 'Not available'}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="subsection-card">
                        <div className="subsection-head">
                          <h4 className="subsection-title">View Order</h4>
                          <span className="subsection-meta">Waiting for verification</span>
                        </div>
                        <div className="muted-copy">After verification, matched orders will appear here so you can review status, service codes, mapped services, remarks, and consultation linkage before queueing.</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-soft" onClick={closeCheckInModal}>Cancel</button>
                  <button type="submit" className="btn btn-soft" disabled={checkInBusy}>{checkInBusy ? 'Verifying...' : 'Verify Patient'}</button>
                  <button type="button" className="btn btn-primary" onClick={confirmPatientCheckIn} disabled={!checkInCandidate || checkInBusy}>{checkInBusy ? 'Saving...' : 'Add To Waiting Pool'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
