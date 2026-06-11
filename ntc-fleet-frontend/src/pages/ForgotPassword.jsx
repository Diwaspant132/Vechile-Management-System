import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import Loader from '../components/Loader';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your Employee ID or Email');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            Enter your Employee ID or registered email address, and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        
        {isSent ? (
          <div className="text-center">
            <div className="alert alert-success mb-4">
              <h5 className="alert-heading">Reset Link Sent!</h5>
              <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                If an account exists for <strong>{identifier}</strong>, you will receive a password reset link shortly. Please check your inbox and spam folder.
              </p>
            </div>
            <a href="/login" className="btn btn-primary w-100">Return to Login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Employee ID or Email"
              name="identifier"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
              }}
              placeholder="e.g. emp_1234 or email@ntc.net.np"
              required
            />

            <button 
              type="submit" 
              className="btn btn-primary w-100 mb-3 mt-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader text="Sending link..." /> : "Send Reset Link"}
            </button>
            
            <div className="text-center mt-3">
              <a href="/login" className="text-muted text-decoration-none fw-medium" style={{ fontSize: '0.9rem' }}>
                &larr; Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
