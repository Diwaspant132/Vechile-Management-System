import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const BranchVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ license_plate: '', model: '', mileage_kmpl: '' });
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const { user } = useAuth();
  const branch = user?.branch || 'JAWALAKHEL';

  useEffect(() => {
    if (user) {
      fetchVehicles();
      const interval = setInterval(fetchVehicles, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vehicles`);
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
      
      const res = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewVehicle({ license_plate: '', model: '', mileage_kmpl: '' });
        fetchVehicles();
        toast.success("Vehicle registered successfully!");
      } else {
        toast.error("Failed to add vehicle.");
      }
    } catch (err) {
      console.error("Error adding vehicle:", err);
      toast.error("An error occurred while adding the vehicle.");
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
              <input 
                type="text" 
                className="form-control" 
                placeholder="License Plate (e.g. Ba 1 Ja 1234)" 
                value={newVehicle.license_plate}
                onChange={e => setNewVehicle({...newVehicle, license_plate: e.target.value})}
                required
              />
            </div>
            <div className="col-md-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Vehicle Model (e.g. SUV Toyota Hilux)" 
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                required
              />
            </div>
            <div className="col-md-3">
              <input 
                type="number" 
                step="0.1"
                className="form-control" 
                placeholder="Mileage (km/L)" 
                value={newVehicle.mileage_kmpl}
                onChange={e => setNewVehicle({...newVehicle, mileage_kmpl: e.target.value})}
                required
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">Add Vehicle</button>
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
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate('/dashboard/reports', { state: { selectedVehicleId: v.id, licensePlate: v.license_plate } })}
                  >
                    View Report
                  </button>
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