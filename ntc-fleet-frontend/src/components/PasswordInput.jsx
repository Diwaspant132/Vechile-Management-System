import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder = "Enter password", 
  error, 
  required = false,
  showStrength = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const calculateStrength = (pass) => {
    if (!pass) return '';
    let score = 0;
    if (pass.length > 8) score += 1;
    if (pass.match(/[A-Z]/)) score += 1;
    if (pass.match(/[0-9]/)) score += 1;
    if (pass.match(/[^A-Za-z0-9]/)) score += 1;
    
    if (score < 2) return 'weak';
    if (score < 4) return 'medium';
    return 'strong';
  };

  const strength = calculateStrength(value);
  
  const getStrengthText = () => {
    if (strength === 'weak') return 'Weak';
    if (strength === 'medium') return 'Fair';
    if (strength === 'strong') return 'Strong';
    return '';
  };

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control password-input ${error ? 'is-invalid' : ''}`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        <span 
          className="input-group-text password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} className="text-muted" /> : <Eye size={18} className="text-muted" />}
        </span>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
      
      {showStrength && value && (
        <div className="mt-1">
          <div className="password-strength-bar">
            <div className={`password-strength-fill strength-${strength}`}></div>
          </div>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
            Password strength: <span className="fw-medium">{getStrengthText()}</span>
          </small>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
