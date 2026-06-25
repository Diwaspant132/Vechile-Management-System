import React, { useState, useRef, useEffect } from 'react';
import AuthLayout from '../components/AuthLayout';
import Loader from '../components/Loader';
import toast from '../utils/toast';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      if (otpValue === '123456') {
        toast.success('OTP Verified Successfully!');
      } else {
        setError('Invalid OTP code. Please try again.');
      }
    }, 1500);
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Verify Your Identity</h2>
          <p className="auth-subtitle">We've sent a 6-digit code to your registered mobile number.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                className={`otp-input ${error ? 'is-invalid border-danger' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
                maxLength={2}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-4"
            disabled={isLoading}
          >
            {isLoading ? <Loader text="Verifying..." /> : "Verify OTP"}
          </button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Resend code in <span className="fw-bold text-dark">{timer}s</span>
              </p>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Didn't receive the code?{' '}
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-primary fw-medium text-decoration-none"
                  onClick={handleResend}
                >
                  Resend OTP
                </button>
              </p>
            )}
            
            <div className="mt-4">
              <a href="/login" className="text-muted text-decoration-none" style={{ fontSize: '0.85rem' }}>
                &larr; Back to Login
              </a>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default OTPVerification;
