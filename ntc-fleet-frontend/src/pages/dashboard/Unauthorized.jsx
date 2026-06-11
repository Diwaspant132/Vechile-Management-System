import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="bg-light p-4 rounded-circle mb-4 text-danger shadow-sm">
        <ShieldAlert size={64} />
      </div>
      <h2 className="fw-bold mb-2">Access Denied</h2>
      <p className="text-muted mb-4 text-center" style={{ maxWidth: '400px' }}>
        You do not have the required permissions to view this page. 
        Your current role is <strong className="text-dark">{user?.role}</strong>.
      </p>
      <button className="btn btn-ntc px-4" onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
