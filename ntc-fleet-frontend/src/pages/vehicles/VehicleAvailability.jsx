import React, { useState, useEffect } from 'react';
import { Search, Filter, Car, Fuel } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VehicleAvailability = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      let processedData = Array.isArray(data) ? data : [];
      
      if (user?.role === 'BRANCH_ADMIN' && user.branch) {
        processedData = processedData.filter(v => !v.branch || v.branch === user.branch);
      }
      
      setVehicles(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error querying fleet inventory:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVehicles();
      const interval = setInterval(fetchVehicles, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || (v.model && v.model.toLowerCase().includes(selectedType.toLowerCase()));
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="p-5 text-center text-muted">Scanning active database vehicle configurations...</div>;

  return (
    <div className="card p-4 shadow-sm border-0 rounded-3 mt-2">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Vehicle Availability</h3>
        <p className="text-muted mb-0">Real-time status tracking of {user?.role === 'BRANCH_ADMIN' ? user.branch : 'Nepal Telecom deployment'} fleets.</p>
      </div>

      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0 text-muted"><Search size={18} /></span>
          <input 
            type="text" 
            className="form-control border-start-0" 
            placeholder="Search vehicle number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2">
          <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="All">All Models</option>
            <option value="Toyota">Toyota</option>
            <option value="Mahindra">Mahindra</option>
            <option value="Tata">Tata</option>
          </select>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2"><Filter size={16}/> Filter</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Vehicle No.</th>
              <th>Model</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((v, index) => {
                const status = (v.status || 'AVAILABLE').toUpperCase();
                return (
                  <tr key={v.id || index}>
                    <td className="fw-bold text-dark">{v.license_plate || 'N/A'}</td>
                    <td>{v.model || 'N/A'}</td>
                    <td>{v.branch || 'N/A'}</td>
                    <td>
                      <span className={`badge px-3 py-1.5 rounded-pill ${
                        status === 'AVAILABLE' ? 'bg-success text-white' : 'bg-secondary text-white'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted">No vehicles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleAvailability;