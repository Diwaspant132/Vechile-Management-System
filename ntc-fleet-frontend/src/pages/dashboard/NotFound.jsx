import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
      <div className="mb-4 text-secondary" style={{ opacity: 0.5 }}>
        <Search size={80} className="mx-auto" />
      </div>
      <h1 className="display-1 fw-bold text-primary mb-2">404</h1>
      <h3 className="fw-semibold text-dark mb-3">Page Not Found</h3>
      <p className="text-muted mb-5" style={{ maxWidth: '400px', margin: '0 auto' }}>
        The requested resource URL was not found on the Nepal Telecom Fleet Server. 
        It may have been moved, deleted, or you typed an incorrect address.
      </p>
      <button 
        className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow-sm"
        onClick={() => navigate('/dashboard')}
      >
        <Home size={20} className="me-2" /> Return to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
