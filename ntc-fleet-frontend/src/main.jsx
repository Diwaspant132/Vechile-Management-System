import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/dashboard.css'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './i18n'

// Global Fetch Interceptor to automatically attach JWT token
const originalFetch = window.fetch;
window.fetch = async (resource, config = {}) => {
  let url = typeof resource === 'string' ? resource : resource?.url;
  
  if (url && url.includes('/api/') && !url.includes('/api/auth/')) {
    const token = sessionStorage.getItem('ntc_token');
    if (token) {
      // Create headers object safely
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  const response = await originalFetch(resource, config);
  
  // Global 401 handler: Redirect to login if token is expired
  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    sessionStorage.removeItem('ntc_token');
    sessionStorage.removeItem('ntc_user');
    window.location.href = '/login';
  }
  
  return response;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fee', color: '#c00', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Click for error details</summary>
            <br />
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children; 
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
