import React, { useState, useEffect } from 'react';
import { Car, ClipboardCopy, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

const BranchDashboard = () => {
  const [metrics, setMetrics] = useState({ totalVehicles: 0, pendingReqs: 0, approvedReqs: 0 });
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        // 1. Fetch live requests data stream from your local backend server
        const reqsResponse = await fetch(`${API_URL}/api/requests`);
        const reqsData = await reqsResponse.json();

        // 2. Fetch live fleet vehicle data stream
        const vehiclesResponse = await fetch(`${API_URL}/api/vehicles`);
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
          <Building2 size={16} /> Jawalakhel Central Hub
        </div>
      </div>

      {/* 📊 Executive Count Summary Grid Layout */}
      <div className="row g-4 mb-5">
        {/* Card 1: Total Fleet Count */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3 border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Total Assigned Fleet</span>
                <h2 className="fw-bold mb-0 text-dark">{metrics.totalVehicles} Units</h2>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 rounded-3 text-primary">
                <Car size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approval Count */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3 border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Pending Approval Queue</span>
                <h2 className="fw-bold mb-0 text-warning">{metrics.pendingReqs} Bookings</h2>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 rounded-3 text-warning">
                <AlertCircle size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Approved Trip Count */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-3 border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Active Approved Trips</span>
                <h2 className="fw-bold mb-0 text-success">{metrics.approvedReqs} In-Transit</h2>
              </div>
              <div className="p-3 bg-success bg-opacity-10 rounded-3 text-success">
                <CheckCircle2 size={28} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status operational banner */}
      <div className="p-5 bg-light rounded-3 text-center border border-dashed">
        <h4 className="fw-bold text-secondary mb-2">Fleet Management Engine Engaged</h4>
        <p className="text-muted max-w-md mx-auto mb-0">
          Use the left sidebar menu matrix to issue new tracking telemetry modules or evaluate pending deployment operations.
        </p>
      </div>
    </div>
  );
};

export default BranchDashboard;