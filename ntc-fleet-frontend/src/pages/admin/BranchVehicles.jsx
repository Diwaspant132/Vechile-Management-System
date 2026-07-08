import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../utils/toast';
import { customConfirm } from '../../components/customConfirm';

const BranchVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ license_plate: '', model: '', mileage_kmpl: '', initial_distance: '' });
  const [bluebookDocument, setBluebookDocument] = useState(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const { user } = useAuth();
  const branch = user?.branch || '';

  useEffect(() => {
    if (user) {
      fetchVehicles();
      const interval = setInterval(fetchVehicles, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
      const res = await fetch(`${API_URL}/api/vehicles${branchParam}`);
      const data = await res.json();
      
      let filteredVehicles = Array.isArray(data) ? data : [];
      if (user?.role === 'BRANCH_ADMIN') {
        filteredVehicles = filteredVehicles.filter(v => v.branch === branch);
      }
      
      setVehicles(filteredVehicles);
    } catch (err) {
      console.error("Failed to fetch fleet data:", err);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.license_plate || !newVehicle.model) return;
    try {
      const payload = { ...newVehicle, branch };
      if (newVehicle.mileage_kmpl) {
         payload.mileage_kmpl = parseFloat(newVehicle.mileage_kmpl);
      }
      if (newVehicle.initial_distance) {
         payload.initial_distance = parseFloat(newVehicle.initial_distance);
      }
      
      const res = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        if (bluebookDocument && data.vehicleId) {
           const formData = new FormData();
           formData.append('bluebook_document', bluebookDocument);
           
           await fetch(`${API_URL}/api/vehicles/${data.vehicleId}/bluebook`, {
              method: 'POST',
              body: formData
           });
        }

        setNewVehicle({ license_plate: '', model: '', mileage_kmpl: '', initial_distance: '' });
        setBluebookDocument(null);
        const fileInput = document.getElementById('bluebookInput');
        if (fileInput) fileInput.value = '';

        fetchVehicles();
        toast.success("Vehicle registered successfully!");
      } else {
        toast.error(data.error || "Failed to add vehicle.");
      }
    } catch (err) {
      console.error("Error adding vehicle:", err);
      toast.error("An error occurred while adding the vehicle.");
    }
  };

  const handleRemoveVehicle = async (vehicleId, licensePlate) => {
    if (await customConfirm(`Are you sure you want to permanently delete vehicle ${licensePlate} from the system?`)) {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success("Vehicle removed successfully.");
          fetchVehicles();
        } else {
          toast.error("Failed to remove vehicle.");
        }
      } catch (e) {
        console.error(e);
        toast.error("An error occurred.");
      }
    }
  };

  const handleTransferRequest = async (vehicleId, licensePlate) => {
    if (await customConfirm(`Send transfer request for vehicle ${licensePlate} to Super Admin?`)) {
      try {
        const payload = { from_branch: branch, requested_by_admin_id: user.id };
        const res = await fetch(`${API_URL}/api/vehicles/${vehicleId}/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          toast.success("Transfer request sent to Super Admin.");
        } else {
          toast.error("Failed to send transfer request.");
        }
      } catch (e) {
        console.error(e);
        toast.error("An error occurred.");
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Vehicle Management</h3>
          <p className="text-muted mb-0">Manage and track active Nepal Telecom deployment fleets for {branch}.</p>
        </div>
      </div>

      {user?.role === 'BRANCH_ADMIN' && (
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h5 className="mb-3">Register New Vehicle</h5>
          <form onSubmit={handleAddVehicle} className="row g-3">
            <div className="col-md-3">
              <label className="form-label mb-1 small text-muted">License Plate <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Ba 1 Ja 1234" 
                value={newVehicle.license_plate}
                onChange={e => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1 small text-muted">Vehicle Model <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. SUV Toyota Hilux" 
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1 small text-muted">Mileage (km/L) <span className="text-danger">*</span></label>
              <input 
                type="number" 
                step="0.1"
                className="form-control" 
                placeholder="e.g. 15.0" 
                value={newVehicle.mileage_kmpl}
                onChange={e => setNewVehicle({...newVehicle, mileage_kmpl: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1 small text-muted">Initial Dist (km)</label>
              <input 
                type="number" 
                step="0.1"
                className="form-control" 
                placeholder="0.0" 
                value={newVehicle.initial_distance}
                onChange={e => setNewVehicle({...newVehicle, initial_distance: e.target.value})}
              />
            </div>
            <div className="col-md-8 mt-3">
              <label className="form-label mb-1 small text-muted">Upload Bluebook (Optional)</label>
              <input 
                type="file" 
                id="bluebookInput"
                className="form-control" 
                accept="image/*,.pdf"
                onChange={e => setBluebookDocument(e.target.files[0])}
              />
            </div>
            <div className="col-md-4 mt-3 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100" style={{ height: "38px" }}>Add Vehicle</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-responsive border rounded bg-white shadow-sm p-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Vehicle No.</th>
              <th>Model</th>
              <th>Mileage (km/L)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.license_plate}</strong></td>
                <td>{v.model}</td>
                <td>{v.mileage_kmpl ? v.mileage_kmpl.toFixed(1) : '15.0'}</td>
                <td>
                  <span className={`badge px-3 py-1.5 rounded-pill ${
                    v.status === 'AVAILABLE' ? 'bg-success text-white' : 'bg-secondary text-white'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate('/dashboard/reports', { state: { selectedVehicleId: v.id, licensePlate: v.license_plate } })}
                    >
                      View Report
                    </button>
                    {user?.role === 'BRANCH_ADMIN' && (
                      <>
                        <button 
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleTransferRequest(v.id, v.license_plate)}
                        >
                          Transfer
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveVehicle(v.id, v.license_plate)}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan="5" className="text-center text-muted py-4">No vehicles registered for this branch.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchVehicles;