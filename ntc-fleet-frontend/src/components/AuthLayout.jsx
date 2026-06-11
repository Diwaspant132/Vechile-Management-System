import React from 'react';
import { ShieldCheck } from 'lucide-react';
import ntcLogo from '../assets/ntc-logo.png';
import '../styles/auth.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      {/* Left Panel - Branding */}
      <div className="auth-left-panel">
        <div className="auth-left-content">
          <div className="mb-4 d-flex justify-content-center">
            <a href="https://www.ntc.net.np/" target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>
              <div className="bg-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center shadow" style={{ width: '80px', height: '80px' }}>
                <img 
                  src={ntcLogo}
                  alt="Nepal Telecom Logo"
                  className="auth-logo-circle"
                />
              </div>
            </a>
          </div>
          <a href="https://www.ntc.net.np/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <h1>Nepal Telecom</h1>
          </a>
          <h2 className="h4 mb-4 fw-normal opacity-75">Vehicle Management System</h2>
          <p>
            Secure, reliable, and efficient fleet management platform for Nepal Telecom's enterprise operations. Access your dashboard to manage drivers, vehicles, and schedules.
          </p>
          <div className="mt-5 d-flex justify-content-center align-items-center gap-2 opacity-75">
            <ShieldCheck size={20} />
            <span className="fw-medium">Government-grade Secure Portal</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Content */}
      <div className="auth-right-panel">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
