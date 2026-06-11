import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 


  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user?.branch) {
      setPickupLocation(user.branch.replace('_', ' '));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');

    if (!user || !user.id) {
      setErrorBanner('Session invalid. Please logout and login again.');
      return;
    }

    if (!pickupLocation || !destination || !pickupTime || !purpose) {
      setErrorBanner('Please fill out all booking form fields.');
      return;
    }

    const payload = {
      employee_id: user.id,

      purpose: purpose.trim(),
      pickup_location: pickupLocation.trim(),
      destination: destination.trim(),
      pickup_time: pickupTime
    };

    try {
      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 🟢 Improved Response Handling
      const data = await response.json().catch(() => ({})); 

      if (response.ok) {
        alert('Vehicle request logged into NTC database successfully!');
        // Ensure this route exists in your App.jsx routes
        navigate('/dashboard/my-requests'); 
      } else {
        setErrorBanner(data.error || 'Server rejected the request.');
      }
    } catch (error) {
      console.error('Network/Parsing Error:', error);
      setErrorBanner(`Connection error: ${error.message}`);
    }
  };

  return (
    <div className="card p-4 shadow-sm border-0 rounded-3 bg-white mt-3">
      {errorBanner && (
        <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger mb-4" role="alert">
          {errorBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">


        <div>
          <label className="form-label fw-semibold text-dark small mb-1">Pickup Location *</label>
          <input type="text" className="form-control text-uppercase" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
        </div>

        <div>
          <label className="form-label fw-semibold text-secondary small">Destination *</label>
          <input type="text" className="form-control" value={destination} onChange={(e) => setDestination(e.target.value)} required />
        </div>

        <div>
          <label className="form-label fw-semibold text-secondary small">Pickup Date & Time *</label>
          <input type="datetime-local" className="form-control" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required />
        </div>

        <div>
          <label className="form-label fw-semibold text-secondary small">Purpose *</label>
          <textarea className="form-control" rows="3" value={purpose} onChange={(e) => setPurpose(e.target.value)} required></textarea>
        </div>

        <button type="submit" className="btn btn-primary fw-bold py-2.5 mt-2">
          Submit Trip Request
        </button>
      </form>
    </div>
  );
};

export default RequestForm;