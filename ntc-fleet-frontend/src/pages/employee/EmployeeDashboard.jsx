import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CarFront, History, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchEmployeeMetrics = async () => {
      try {
        const response = await fetch(`${API_URL}/api/requests`);
        const data = await response.json();
        
        // Filter requests strictly for this employee
        const myRequests = data.filter(r => Number(r.employee_id) === Number(user?.id));
        
        const pending = myRequests.filter(r => r.status === 'PENDING' || r.status === 'Pending' || r.status === 'Pending approval.').length;
        const approved = myRequests.filter(r => r.status === 'APPROVED' || r.status === 'Approved' || r.status === 'IN_PROGRESS' || r.status === 'On Trip').length;
        
        setMetrics({ pending, approved, total: myRequests.length });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employee metrics:', error);
        setLoading(false);
      }
    };

    if (user?.id) fetchEmployeeMetrics();
  }, [user, API_URL]);

  const customStyles = `
    .premium-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 1.25rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .premium-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
    }
    .gradient-header {
      background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gradient-bg {
      background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
      min-height: 100vh;
    }
    .action-card {
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }
    .action-card:hover {
      border-color: #0d6efd;
      background-color: rgba(13, 110, 253, 0.05);
    }
  `;

  if (loading) return <div className="p-4 text-center text-muted">Loading your portal...</div>;

  return (
    <div className="container-fluid p-4 gradient-bg">
      <style>{customStyles}</style>

      <div className="mb-5 border-bottom border-secondary border-opacity-10 pb-4">
        <h2 className="fw-bolder gradient-header mb-2">Welcome back, {user?.first_name}!</h2>
        <p className="text-muted fs-5">What would you like to do today?</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-4">
          <div 
            className="card p-4 shadow-sm premium-card action-card h-100"
            onClick={() => navigate('/dashboard/request-vehicle')}
          >
            <div className="text-center py-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <CarFront size={48} className="text-primary" />
              </div>
              <h4 className="fw-bold mb-2">Book a Vehicle</h4>
              <p className="text-muted mb-0">Submit a new request for official travel.</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div 
            className="card p-4 shadow-sm premium-card action-card h-100"
            onClick={() => navigate('/dashboard/my-requests')}
          >
            <div className="text-center py-4">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <History size={48} className="text-info" />
              </div>
              <h4 className="fw-bold mb-2">My Requests</h4>
              <p className="text-muted mb-0">View your active trips and request history.</p>
            </div>
          </div>
        </div>
      </div>

      <h4 className="fw-bold text-dark mb-4">Your Travel Overview</h4>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-primary border-4 premium-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Total Requests</span>
                <h2 className="fw-bold mb-0 text-dark">{metrics.total}</h2>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary">
                <ClipboardList size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-warning border-4 premium-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Pending Approval</span>
                <h2 className="fw-bold mb-0 text-warning">{metrics.pending}</h2>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 rounded-circle text-warning">
                <AlertCircle size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-success border-4 premium-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">Approved Trips</span>
                <h2 className="fw-bold mb-0 text-success">{metrics.approved}</h2>
              </div>
              <div className="p-3 bg-success bg-opacity-10 rounded-circle text-success">
                <CheckCircle2 size={28} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmployeeDashboard;
