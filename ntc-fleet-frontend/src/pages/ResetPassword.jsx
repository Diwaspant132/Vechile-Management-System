import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Loader from '../components/Loader';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Your new password must be different from previously used passwords.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {success ? (
          <div className="text-center">
            <div className="alert alert-success mb-4">
              <p className="mb-0">Your password has been successfully reset.</p>
            </div>
            <a href="/login" className="btn btn-primary w-100">Continue to Login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <PasswordInput
              label="New Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              showStrength={true}
            />

            <PasswordInput
              label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              required
            />

            <button 
              type="submit" 
              className="btn btn-primary w-100 mt-4 mb-3"
              disabled={isLoading}
            >
              {isLoading ? <Loader text="Updating..." /> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
