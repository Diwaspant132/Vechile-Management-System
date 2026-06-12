import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import RoleDropdown from '../components/RoleDropdown';
import Loader from '../components/Loader';
import { NTC_BRANCHES } from '../data/branches';

const Register = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirm_password: '', 
    first_name: '', last_name: '', requested_role: '', phone_number: '', branch: 'JAWALAKHEL' 
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    } else if (typeof e === 'string') {
      setFormData(prev => ({ ...prev, requested_role: e }));
      if (errors.requested_role) setErrors(prev => ({ ...prev, requested_role: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.requested_role) newErrors.requested_role = 'Please select a role';
    if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
    
    if (['BRANCH_ADMIN', 'EMPLOYEE', 'DRIVER'].includes(formData.requested_role) && !formData.branch) {
      newErrors.branch = 'Please select branch';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    
    if (validateForm()) {
      setIsLoading(true);
      
      // 🟢 Payload aligned with server.js expectations
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.requested_role, // Backend logic uses this
        requested_role: formData.requested_role,
        phone_number: formData.phone_number,
        branch: formData.requested_role === 'SUPER_ADMIN' ? 'CENTRAL_OFFICE' : formData.branch
      };

      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Registration failed.');

        setSuccessMsg(data.message);
        setFormData({ username: '', email: '', password: '', confirm_password: '', first_name: '', last_name: '', requested_role: '', phone_number: '', branch: 'JAWALAKHEL' });
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        console.error("❌ Registration Error:", err);
        setErrors({ general: err.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card" style={{ maxWidth: '700px' }}>
        <h2 className="auth-title text-center">Create Account</h2>
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errors.general && <div className="alert alert-danger">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6"><FormInput label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} error={errors.first_name} required /></div>
            <div className="col-md-6"><FormInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} error={errors.last_name} required /></div>
          </div>
          <div className="row">
            <div className="col-md-6"><FormInput label="Username" name="username" value={formData.username} onChange={handleChange} error={errors.username} required /></div>
            <div className="col-md-6"><FormInput label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} error={errors.phone_number} required /></div>
          </div>
          <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
          
          <RoleDropdown value={formData.requested_role} onChange={handleChange} error={errors.requested_role} />

          {['EMPLOYEE', 'DRIVER', 'BRANCH_ADMIN'].includes(formData.requested_role) && (
            <div className="mb-3">
              <label className="form-label">Branch *</label>
              <select className="form-select" name="branch" value={formData.branch} onChange={handleChange}>
                {NTC_BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="row">
            <div className="col-md-6"><PasswordInput label="Password" name="password" value={formData.password} onChange={handleChange} error={errors.password} required /></div>
            <div className="col-md-6"><PasswordInput label="Confirm Password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} required /></div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-4" disabled={isLoading}>
            {isLoading ? <Loader text="Registering..." /> : "Register Account"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Register;