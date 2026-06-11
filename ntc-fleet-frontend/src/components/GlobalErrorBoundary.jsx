import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global UI Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
          <div className="card shadow-lg border-0 p-5 rounded-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="text-danger mb-4">
              <AlertTriangle size={64} className="mx-auto" />
            </div>
            <h2 className="fw-bold mb-3">System Recovery</h2>
            <p className="text-muted mb-4">
              A critical UI exception occurred. The system has paused to prevent data corruption.
            </p>
            <div className="bg-dark bg-opacity-10 rounded p-3 text-start mb-4" style={{ overflowX: 'auto' }}>
              <code className="text-danger small">{this.state.error?.toString()}</code>
            </div>
            <button 
              className="btn btn-primary btn-lg px-4"
              onClick={() => window.location.href = '/'}
            >
              <Home size={20} className="me-2" /> Reboot Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
