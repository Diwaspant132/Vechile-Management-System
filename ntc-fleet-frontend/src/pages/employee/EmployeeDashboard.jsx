import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CarFront, History, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
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

  if (loading) return <div className="p-4 text-center text-muted">{t('loading_portal')}</div>;

  return (
    <div className="container-fluid p-4">

      <div className="mb-5 border-bottom border-secondary border-opacity-10 pb-4">
        <h2 className="fw-bolder gradient-header mb-2">{t('welcome_back')}, {user?.first_name}!</h2>
        <p className="text-muted fs-5">{t('what_to_do_today')}</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-4">
          <div 
            className="card p-4 shadow-sm dashboard-card action-card h-100"
            onClick={() => navigate('/dashboard/request-vehicle')}
          >
            <div className="text-center py-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <CarFront size={48} className="text-primary" />
              </div>
              <h4 className="fw-bold mb-2">{t('book_a_vehicle')}</h4>
              <p className="text-muted mb-0">{t('submit_new_request')}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div 
            className="card p-4 shadow-sm dashboard-card action-card h-100"
            onClick={() => navigate('/dashboard/my-requests')}
          >
            <div className="text-center py-4">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <History size={48} className="text-info" />
              </div>
              <h4 className="fw-bold mb-2">{t('my_requests')}</h4>
              <p className="text-muted mb-0">{t('view_active_trips')}</p>
            </div>
          </div>
        </div>
      </div>

      <h4 className="fw-bold text-dark mb-4">{t('your_travel_overview')}</h4>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-primary border-4 dashboard-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">{t('total_requests')}</span>
                <h2 className="fw-bold mb-0 text-dark">{metrics.total}</h2>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary">
                <ClipboardList size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-warning border-4 dashboard-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">{t('pending_approval')}</span>
                <h2 className="fw-bold mb-0 text-warning">{metrics.pending}</h2>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 rounded-circle text-warning">
                <AlertCircle size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 bg-white rounded-4 border-start border-success border-4 dashboard-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small text-uppercase fw-bold d-block mb-1">{t('approved_trips')}</span>
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
