import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import toast from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ vehicle_id: '', service_type: 'Routine Maintenance', description: '' });
  
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({ id: null, cost: '', mechanic_notes: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
      const mRes = await fetch(`${API_URL}/api/maintenance${branchParam}`);
      const mData = await mRes.json();
      setSchedules(Array.isArray(mData) ? mData : []);

      if (user?.role !== 'DRIVER') {
        const vRes = await fetch(`${API_URL}/api/vehicles${branchParam}`);
        const vData = await vRes.json();
        setVehicles(Array.isArray(vData) ? vData : []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      if (res.ok) {
        toast.success("Maintenance scheduled successfully!");
        setShowScheduleModal(false);
        setScheduleForm({ vehicle_id: '', service_type: 'Routine Maintenance', description: '' });
        fetchData();
      } else {
        toast.error("Failed to schedule maintenance.");
      }
    } catch (err) { toast.error(err.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/maintenance/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Vehicle marked as ${status.replace('_', ' ')}!`);
        fetchData();
      } else { toast.error("Status update failed."); }
    } catch (err) { toast.error(err.message); }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/maintenance/${completeForm.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', cost: parseFloat(completeForm.cost), mechanic_notes: completeForm.mechanic_notes })
      });
      if (res.ok) {
        toast.success("Maintenance logged and completed!");
        setShowCompleteModal(false);
        setCompleteForm({ id: null, cost: '', mechanic_notes: '' });
        fetchData();
      } else { toast.error("Failed to complete maintenance."); }
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="p-5 text-center text-muted">Loading maintenance systems...</div>;

  return (
    <div className="card p-4 shadow-sm border-0 rounded-3 mt-2">
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-primary mb-1">Fleet Maintenance & Servicing</h3>
          <p className="text-muted mb-0">Track mechanical actions, view driver reports, and manage repair costs.</p>
        </div>
        {user?.role !== 'DRIVER' && (
          <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
            <Plus size={18} className="me-1" /> Schedule Maintenance
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Vehicle Plate</th>
              <th>Reported By</th>
              <th>Service Details</th>
              <th>Status</th>
              <th>Cost (Rs)</th>
              {user?.role !== 'DRIVER' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {schedules.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="badge bg-dark px-2 py-1.5 font-monospace text-uppercase">{item.plateNumber}</span>
                  <div className="small text-muted mt-1">{item.vehicle_model}</div>
                </td>
                <td>
                  {item.first_name ? `${item.first_name} ${item.last_name}` : <span className="text-muted">Admin Scheduled</span>}
                </td>
                <td>
                  <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                    <Wrench size={14} className="text-primary" /> {item.service_type}
                  </div>
                  <small className="text-muted text-truncate d-inline-block" style={{maxWidth: '200px'}} title={item.description}>{item.description}</small>
                </td>
                <td>
                  <span className={`badge d-inline-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill ${
                    item.status === 'COMPLETED' ? 'bg-success bg-opacity-10 text-success' :
                    item.status === 'PENDING' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning'
                  }`}>
                    {item.status === 'COMPLETED' ? <CheckCircle2 size={12} /> :
                     item.status === 'PENDING' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                    {item.status}
                  </span>
                </td>
                <td className={item.cost ? 'text-danger fw-semibold' : 'text-muted'}>
                  {item.cost ? `Rs. ${item.cost.toFixed(2)}` : '-'}
                </td>
                {user?.role !== 'DRIVER' && (
                  <td>
                    {item.status === 'PENDING' && (
                      <button className="btn btn-sm btn-outline-warning" onClick={() => updateStatus(item.id, 'IN_PROGRESS')}>Start Work</button>
                    )}
                    {item.status === 'IN_PROGRESS' && (
                      <button className="btn btn-sm btn-success" onClick={() => {
                        setCompleteForm({ id: item.id, cost: '', mechanic_notes: '' });
                        setShowCompleteModal(true);
                      }}>Complete</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">No maintenance logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showScheduleModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Schedule Vehicle Maintenance</h5>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}></button>
              </div>
              <form onSubmit={handleScheduleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Vehicle</label>
                    <select className="form-select" required value={scheduleForm.vehicle_id} onChange={e => setScheduleForm({...scheduleForm, vehicle_id: e.target.value})}>
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.model}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Service Type</label>
                    <select className="form-select" value={scheduleForm.service_type} onChange={e => setScheduleForm({...scheduleForm, service_type: e.target.value})}>
                      <option>Routine Maintenance</option>
                      <option>Oil Change</option>
                      <option>Tire Replacement</option>
                      <option>Engine Repair</option>
                      <option>Body Work</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description / Instructions</label>
                    <textarea className="form-control" rows="2" required value={scheduleForm.description} onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Schedule Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-success">
              <div className="modal-header bg-success bg-opacity-10 text-success border-success">
                <h5 className="modal-title">Complete Maintenance & Log Costs</h5>
                <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)}></button>
              </div>
              <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">Total Repair Cost (Rs.)</label>
                    <input type="number" step="0.01" className="form-control" placeholder="e.g. 5000" required value={completeForm.cost} onChange={e => setCompleteForm({...completeForm, cost: e.target.value})} />
                    <small className="text-danger">This cost will be permanently tied to the vehicle's financial record for auditing.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">Mechanic Notes / Final Report</label>
                    <textarea className="form-control" rows="3" required placeholder="What was replaced or fixed?" value={completeForm.mechanic_notes} onChange={e => setCompleteForm({...completeForm, mechanic_notes: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save & Return Vehicle to Service</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;