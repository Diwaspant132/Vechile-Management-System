import React, { useState, useEffect } from 'react';
import { UserCheck, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../utils/toast';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const branch = user?.branch || '';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch(`${API_URL}/api/drivers${branchParam}`),
        fetch(`${API_URL}/api/vehicles${branchParam}`)
      ]);
      const dData = await driversRes.json();
      const vData = await vehiclesRes.json();
      
      setDrivers(Array.isArray(dData) ? dData : []);
      let allVehicles = Array.isArray(vData) ? vData : [];
      if (user?.role === 'BRANCH_ADMIN') {
        allVehicles = allVehicles.filter(v => v.branch === branch);
      }
      setVehicles(allVehicles);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_status: newStatus })
      });
      if (!response.ok) throw new Error('Update failed');
      fetchData();
      toast.success('Status updated successfully');
    } catch (e) { toast.error('Action failed: ' + e.message); }
  };

  const handleDefaultVehicleAssign = async (driverId, vehicleId) => {
    try {
      const response = await fetch(`${API_URL}/api/drivers/${driverId}/default-vehicle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId })
      });
      if (!response.ok) throw new Error('Assignment failed');
      fetchData();
      toast.success('Vehicle assigned successfully');
    } catch (e) { toast.error('Action failed: ' + e.message); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const filtered = drivers.filter(d => d.first_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container-fluid mt-4">
      <div className="card p-4 shadow-sm border-0">
        <h3 className="fw-bold text-primary">NTC Driver Directory Roster</h3>
        <input className="form-control mb-4" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr><th>Driver ID</th><th>Name</th><th>Status</th><th>Default Vehicle</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((driver) => (
              <tr key={driver.id}>
                <td><strong>#{driver.id}</strong></td>
                <td>{driver.first_name} {driver.last_name}</td>
                <td><span className={`badge ${driver.registration_status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>{driver.registration_status}</span></td>
                <td>
                  <select 
                    className="form-select form-select-sm" 
                    value={driver.default_vehicle_id || ''} 
                    onChange={(e) => handleDefaultVehicleAssign(driver.id, e.target.value)}
                  >
                    <option value="">-- No Default Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} ({v.model})</option>)}
                  </select>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    {driver.license_document_url && (
                      <a href={`${API_URL}${driver.license_document_url}`} target="_blank" rel="noreferrer" className="text-primary fw-bold text-decoration-none small">
                        View License
                      </a>
                    )}
                    {driver.registration_status === 'PENDING' && (
                      <div className="d-flex gap-2">
                        <button onClick={() => handleStatusUpdate(driver.id, 'APPROVED')} className="btn btn-sm btn-success"><CheckCircle size={16}/></button>
                        <button onClick={() => handleStatusUpdate(driver.id, 'REJECTED')} className="btn btn-sm btn-danger"><XCircle size={16}/></button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default DriverManagement;