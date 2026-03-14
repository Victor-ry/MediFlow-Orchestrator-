import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Search, CheckCircle, XCircle } from 'lucide-react';
import Side from '../components/Sidebar';
import {
  getServices,
  createService,
  updateService,
  deleteService
} from '../utils/servicesDb';
import { getDepartments } from '../utils/departmentDb';
import '../styles/ServicesPage.css';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    serviceName: '',
    departmentCode: '',
    serviceDescription: '',
    serviceCode: '',
    defaultConsumeTime: '',
    isActive: true
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [servicesRes, departmentsRes] = await Promise.all([
      getServices(),
      getDepartments()
    ]);

    console.log(servicesRes, departmentsRes)

    if (servicesRes.data) setServices(servicesRes.data);
    if (departmentsRes.data) setDepartments(departmentsRes.data);
    setLoading(false);
  };

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 打开创建模态框
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      serviceName: '',
      departmentCode: departments[0]?.departmentCode || '',
      serviceDescription: '',
      serviceCode: '',
      defaultConsumeTime: '',
      isActive: true
    });
    setShowModal(true);
  };

  // 打开编辑模态框
  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      departmentCode: service.departmentCode,
      serviceDescription: service.serviceDescription || '',
      serviceCode: service.serviceCode,
      defaultConsumeTime: service.defaultConsumeTime || '',
      isActive: service.isActive
    });
    setShowModal(true);
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    const serviceData = {
      ...formData,
      defaultConsumeTime: parseInt(formData.defaultConsumeTime) || 0,
      UID: editingService?.UID || `SVC-${Date.now()}`
    };

    let result;
    if (editingService) {
      result = await updateService(editingService.UID, serviceData);
    } else {
      result = await createService(serviceData);
    }

    if (result.error) {
      showNotification(result.error.message, 'error');
    } else {
      showNotification(editingService ? 'Service updated successfully' : 'Service created successfully');
      setShowModal(false);
      loadData();
    }
  };

  // 处理删除
  const handleDelete = async (uid) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    const result = await deleteService(uid);
    if (result.error) {
      showNotification(result.error.message, 'error');
    } else {
      showNotification('Service deleted successfully');
      loadData();
    }
  };

  // 过滤服务
  const filteredServices = services.filter(service =>
    service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.Department?.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 表单输入处理
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-container services-page">
        <Side />
        <div className="main-content">
          <div className="loading-state">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container services-page">
      <Side />

      <div className="main-content">
        <header className="header">
          <h2>Service Management</h2>
        </header>

        {/* 通知 */}
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="close-notification">
              <X size={18} />
            </button>
          </div>
        )}

        {/* 操作栏 */}
        <div className="action-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={20} />
            <span>Add Service</span>
          </button>
        </div>

        {/* 服务表格 */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Code</th>
                <th>Service Name</th>
                <th>Department</th>
                <th>Consume Time</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No services found
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.serviceCode}>
                    <td>{service.serviceCode}</td>
                    <td>{service.serviceName}</td>
                    <td>{service.Department?.departmentName || 'N/A'}</td>
                    <td>{service.defaultConsumeTime} min</td>
                    <td>
                      <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                        {service.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {new Date(service.lastUpdated).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleOpenEdit(service)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(service.UID)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 创建/编辑模态框 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service' : 'Create New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Service Code *</label>
                <input
                  type="text"
                  name="serviceCode"
                  value={formData.serviceCode}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., SVC-CARD-001"
                />
              </div>

              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Cardiology Consultation"
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  name="departmentCode"
                  value={formData.departmentCode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentCode} value={dept.departmentCode}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Service description..."
                />
              </div>

              <div className="form-group">
                <label>Default Consume Time (minutes)</label>
                <input
                  type="number"
                  name="defaultConsumeTime"
                  value={formData.defaultConsumeTime}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="e.g., 30"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;