import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext'; 

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);

    setIsLoading(false);
    if (result.success) {
      // 🟢 UPDATED: Role-based navigation for immediate Driver access
      if (result.user?.role === 'DRIVER') {
        navigate('/dashboard/driver-dashboard');
      } else {
        navigate('/dashboard'); 
      }
    } else {
      setError(result.error || 'Please enter valid credentials.'); 
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your enterprise account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Employee ID / Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your ID or username"
            required
          />

          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label className="form-check-label text-muted" htmlFor="rememberMe" style={{ fontSize: '0.9rem' }}>
                Remember Me
              </label>
            </div>
            <a href="/forgot-password" className="text-primary text-decoration-none" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
              Forgot Password?
            </a>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? <Loader text="Authenticating..." /> : "Secure Login"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Don't have an account? <a href="/register" className="text-primary text-decoration-none fw-medium">Register here</a>
          </p>
        </div>

        <div className="mt-4 p-3 bg-light rounded text-center border">
          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
            <strong>Security Notice:</strong> This is a secure enterprise portal. Unauthorized access is strictly prohibited.
          </small>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;