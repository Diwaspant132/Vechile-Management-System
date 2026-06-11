import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import { Car, CheckCircle, Clock, AlertTriangle, Activity, MapPin, FileText, Settings } from 'lucide-react';

const SuperDashboard = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Real Database States
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load real records directly out of SQLite via backend endpoints
  useEffect(() => {
    const fetchSuperDashboardData = async () => {
      try {
        const reqResponse = await fetch(`${API_URL}/api/requests`).catch(() => null);
        const reqData = reqResponse && reqResponse.ok ? await reqResponse.json().catch(() => []) : [];
        
        const vecResponse = await fetch(`${API_URL}/api/vehicles`).catch(() => null);
        const vecData = vecResponse && vecResponse.ok ? await vecResponse.json().catch(() => []) : [];

        // Catch maintenance failures gracefully
        const maintResponse = await fetch(`${API_URL}/api/maintenance`).catch(() => null);
        const maintData = maintResponse && maintResponse.ok ? await maintResponse.json().catch(() => []) : [];

        setRequests(Array.isArray(reqData) ? reqData : []);
        setVehicles(Array.isArray(vecData) ? vecData : []);
        setMaintenance(Array.isArray(maintData) ? maintData : []);
        setLoading(false);
      } catch (error) {
        console.error('Error hydrating Super Admin dashboard context indices:', error);
        setLoading(false);
      }
    };

    fetchSuperDashboardData();
  }, [API_URL]);

  if (loading) {
    return <div className="p-5 text-center text-muted">Syncing Global Monitoring systems from SQLite...</div>;
  }

  // --- 🟢 DYNAMIC DATABASE METRIC COUNTS (ZERO FAKE DATA) ---
  const totalVehicles = vehicles.length;
  const activeTrips = vehicles.filter(v => v.status === 'On Trip').length;
  const idleVehicles = vehicles.filter(v => v.status === 'IDLE' || v.status === 'AVAILABLE').length;
  const inMaintenance = maintenance.filter(m => m.status !== 'COMPLETED').length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-0 fw-bold text-dark">Global Monitoring Dashboard</h2>
          <p className="text-muted small mb-0">Centralized telecom fleet operations control unit logs.</p>
        </div>
        <span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm">SUPER ADMIN PRIVILEGES</span>
      </div>
      
      {/* 🟢 Real Stat Cards linked to active database record array sizes */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardCard title="Total Vehicles" value={totalVehicles.toString()} icon={<Car size={24} />} color="blue" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardCard title="Active Trips" value={activeTrips.toString()} icon={<Activity size={24} />} color="green" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardCard title="Idle Vehicles" value={idleVehicles.toString()} icon={<CheckCircle size={24} />} color="warning" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardCard title="In Maintenance" value={inMaintenance.toString()} icon={<AlertTriangle size={24} />} color="danger" />
        </div>
      </div>

      <div className="row g-4">
        {/* Main Left: Real Cross-Branch Database Requests Table */}
        <div className="col-12 col-lg-8">
          <div className="table-card p-4 bg-white rounded-3 shadow-sm border-0">
            <h5 className="mb-4 d-flex align-items-center gap-2 fw-bold text-dark">
              <Activity size={20} className="text-primary" /> 
              Recent Cross-Branch Requests
            </h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small">
                  <tr>
                    <th>Req ID</th>
                    <th>Requester</th>
                    <th>Branch</th>
                    <th>Destination</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map((req, index) => (
                    <tr key={index}>
                      <td className="fw-bold text-dark">#REQ-{req.id}</td>
                      <td className="text-secondary fw-medium">
                        {req.first_name ? `${req.first_name} ${req.last_name}` : req.username || 'Staff User'}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border border-light px-2 py-1">
                          {req.branch ? req.branch.replace('_', ' ') : 'General'}
                        </span>
                      </td>
                      <td className="text-dark fw-semibold">{req.destination}</td>
                      <td><StatusBadge status={req.status} /></td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No active employee vehicle allocations recorded in the system database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar Actions panel */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '10px' }}>
            <div className="card-body">
              <h5 className="fw-bold text-dark mb-4">Global Actions</h5>
              <div className="d-grid gap-3">
                <button 
                  className="btn btn-outline-primary text-start p-3 d-flex align-items-center gap-3"
                  onClick={() => navigate('/dashboard/tracking')}
                >
                  <MapPin className="text-primary" />
                  <span className="fw-medium">View Global Live Map</span>
                </button>
                
                <button 
                  className="btn btn-outline-secondary text-start p-3 d-flex align-items-center gap-3"
                  onClick={() => navigate('/dashboard/admin-requests')}
                >
                  <CheckCircle className="text-secondary" />
                  <span className="fw-medium">Manage All Requests</span>
                </button>

                <button 
                  className="btn btn-outline-info text-start p-3 d-flex align-items-center gap-3"
                  onClick={() => navigate('/dashboard/reports')}
                >
                  <FileText className="text-info" />
                  <span className="fw-medium">Generate Organization Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;