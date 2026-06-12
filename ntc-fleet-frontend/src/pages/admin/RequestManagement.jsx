import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]); 
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const branch = user?.branch || '';
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
      const [reqRes, drivRes, vehRes] = await Promise.all([
        fetch(`${API_URL}/api/requests${branchParam}`),
        fetch(`${API_URL}/api/drivers${branchParam}`),
        fetch(`${API_URL}/api/vehicles${branchParam}`)
      ]);
      const reqData = await reqRes.json();
      const drivData = await drivRes.json();
      const vehData = await vehRes.json();
      
      let filteredRequests = Array.isArray(reqData) ? reqData : [];
      let filteredDrivers = Array.isArray(drivData) ? drivData.filter(d => d.status === 'AVAILABLE') : [];
      let filteredVehicles = Array.isArray(vehData) ? vehData.filter(v => v.status === 'AVAILABLE') : [];

      if (user?.role === 'BRANCH_ADMIN') {
        // Redundant client-side filtering removed; backend handles isolation via branchParam
      }
      
      setRequests(filteredRequests);
      setDrivers(filteredDrivers);
      setVehicles(filteredVehicles);
      setLoading(false);
    } catch (error) {
      console.error('Error reading data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleAssign = async (reqId) => {
    const driverId = document.getElementById(`driver-${reqId}`).value;
    const vehicleId = document.getElementById(`vehicle-${reqId}`).value;
    
    if (!driverId || !vehicleId) {
      alert("Please select both a driver and a vehicle!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/requests/assign/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, vehicle_id: vehicleId })
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Could not assign driver and vehicle.');
      }
    } catch (error) {
      console.error('Assignment failed:', error);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/requests/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData(); 
      } else {
        alert('Could not update booking status.');
      }
    } catch (error) {
      console.error('Admin mutation action failed:', error);
    }
  };

  if (loading) return <div className="p-4 text-center text-muted">Loading live branch dispatch metrics...</div>;

  return (
    <div className="card p-4 shadow-sm mt-4 border-0 rounded-3">
      <div className="mb-4">
        <h3 className="fw-bold text-primary mb-1">NTC Vehicle Deployment Approvals</h3>
        <p className="text-muted small mb-0">
          {user?.role === 'SUPER_ADMIN' ? (
            <>Viewing global operations data across all branches</>
          ) : (
            <>Viewing and managing operations data localized for: <span className="badge bg-dark font-monospace text-uppercase">{branch.replace('_', ' ')}</span></>
          )}
        </p>
      </div>
      
      {requests.length === 0 ? (
        <p className="text-muted text-center py-4">No active vehicle requests found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Req ID</th>
                <th>Employee</th>
                <th>Req. Vehicle Type</th>
                <th>Route</th>
                <th>Assignment</th>
                <th>Status</th>
                <th className="text-center">Operations</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td><strong>#REQ-{req.id}</strong></td>
                  <td>{req.first_name} {req.last_name}</td>
                  <td><span className="badge bg-secondary">{req.vehicle_type}</span></td>
                  <td>From: {req.pickup_location}<br/>To: {req.destination}</td>
                  <td>
                    {req.status === 'PENDING' ? (
                      <div className="d-flex flex-column gap-2">
                        <select 
                          className="form-select form-select-sm" 
                          id={`driver-${req.id}`}
                          onChange={(e) => {
                            const driverId = e.target.value;
                            const driver = drivers.find(d => d.id == driverId);
                            if (driver && driver.default_vehicle_id) {
                              const vehicleSelect = document.getElementById(`vehicle-${req.id}`);
                              if (vehicleSelect) {
                                vehicleSelect.value = driver.default_vehicle_id;
                              }
                            }
                          }}
                        >
                          <option value="">-- Assign Driver --</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                        </select>
                        <select className="form-select form-select-sm" id={`vehicle-${req.id}`}>
                          <option value="">-- Assign Vehicle --</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} ({v.model})</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="text-muted small">
                        {req.status === 'APPROVED' || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED' ? (
                          <>
                            <div>Driver Assigned</div>
                            {req.license_plate && <div>Vehicle: {req.license_plate}</div>}
                          </>
                        ) : 'N/A'}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${req.status === 'APPROVED' ? 'bg-success' : req.status === 'PENDING' ? 'bg-warning' : 'bg-secondary'} bg-opacity-10 text-dark`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="text-center">
                    {req.status === 'PENDING' && (
                      <div className="btn-group btn-group-sm">
                        <button 
                          onClick={() => handleAssign(req.id)} 
                          className="btn btn-success"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(req.id, 'REJECTED')} 
                          className="btn btn-danger"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;