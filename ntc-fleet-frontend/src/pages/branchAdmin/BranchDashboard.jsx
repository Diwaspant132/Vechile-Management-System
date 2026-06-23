import React, { useState, useEffect } from 'react';
import { Car, ClipboardCopy, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import { useAuth } from '../../contexts/AuthContext';

const BranchDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ totalVehicles: 0, pendingReqs: 0, approvedReqs: 0 });
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const branchParam = `?branch=${encodeURIComponent(user?.branch || '')}`;
        // 1. Fetch live requests data stream from your local backend server
        const reqsResponse = await fetch(`${API_URL}/api/requests${branchParam}`);
        const reqsData = await reqsResponse.json();

        // 2. Fetch live fleet vehicle data stream
        const vehiclesResponse = await fetch(`${API_URL}/api/vehicles${branchParam}`);
        const vehiclesData = await vehiclesResponse.json();

        // 3. Compute metric groupings dynamically based on the active statuses
        const pending = reqsData.filter(r => r.status === 'PENDING' || r.status === 'Pending' || r.status === 'Pending approval.').length;
        const approved = reqsData.filter(r => r.status === 'APPROVED' || r.status === 'Approved' || r.status === 'On Trip').length;

        setMetrics({
          totalVehicles: vehiclesData.length,
          pendingReqs: pending,
          approvedReqs: approved
        });
        setLoading(false);
      } catch (error) {
        console.error('Error compiling analytics dashboard metrics:', error);
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
    
    // Set up polling interval to keep counters up-to-date automatically every 8 seconds
    const interval = setInterval(fetchDashboardMetrics, 8000);
    return () => clearInterval(interval);
  }, [API_URL]);

  if (loading) return <div className="p-4 text-center text-muted">Calculating real-time fleet analytics...</div>;

  return (
    <div className="container-fluid py-3">
      {/* Upper header section branding */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Nepal Telecom Dashboard</h2>
          <p className="text-muted mb-0">Live operations summary for active transport divisions.</p>
        </div>
        <div className="badge bg-primary px-3 py-2 fs-6 d-flex align-items-center gap-2 shadow-sm">
          <Building2 size={16} /> {user?.branch || 'Central'} Hub
        </div>
      </div>

      {/* 📊 Executive Count Summary Grid Layout */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-md-4">
          <DashboardCard title="Total Assigned Fleet" value={`${metrics.totalVehicles} Units`} icon={<Car size={24} />} color="blue" />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <DashboardCard title="Pending Approval Queue" value={`${metrics.pendingReqs} Bookings`} icon={<AlertCircle size={24} />} color="warning" />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <DashboardCard title="Active Approved Trips" value={`${metrics.approvedReqs} In-Transit`} icon={<CheckCircle2 size={24} />} color="green" />
        </div>
      </div>

      {/* Quick Status operational banner */}
      <div className="dashboard-card p-5 text-center border-0">
        <h4 className="fw-bold text-dark mb-2">Fleet Management Engine Engaged</h4>
        <p className="text-muted max-w-md mx-auto mb-0" style={{ maxWidth: '600px' }}>
          Use the left sidebar menu matrix to issue new tracking telemetry modules or evaluate pending deployment operations.
        </p>
      </div>
    </div>
  );
};

export default BranchDashboard;