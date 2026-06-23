import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NTC_BRANCHES } from '../data/branches';

const RequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [branchEmployees, setBranchEmployees] = useState([]);
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user?.branch) {
      const branchObj = NTC_BRANCHES.find(b => b.id === user.branch);
      setPickupLocation(branchObj ? branchObj.name : user.branch);

      fetch(`${API_URL}/api/employees?branch=${user.branch}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setBranchEmployees(data.filter(emp => emp.id !== user.id));
            }
        })
        .catch(err => console.error("Failed to fetch branch employees:", err));
    }
  }, [user, API_URL]);

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
      pickup_time: pickupTime,
      passengers: selectedPassengers
    };

    try {
      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({})); 

      if (response.ok) {
        alert('Vehicle request logged into NTC database successfully!');
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
        <div className="position-relative">
          <label className="form-label fw-semibold text-dark small mb-1">Pickup Location *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Select branch or type location..." 
            value={pickupLocation} 
            onChange={(e) => setPickupLocation(e.target.value)} 
            onFocus={() => setShowPickupDropdown(true)}
            onBlur={() => setTimeout(() => setShowPickupDropdown(false), 200)}
            required 
          />
          {showPickupDropdown && (
            <ul className="dropdown-menu show w-100 position-absolute shadow-sm" style={{ top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {NTC_BRANCHES.filter(b => b.name.toLowerCase().includes(pickupLocation.toLowerCase())).map(b => (
                <li key={b.id}>
                  <button type="button" className="dropdown-item py-2" onMouseDown={() => setPickupLocation(b.name)}>
                    {b.name}
                  </button>
                </li>
              ))}
              {NTC_BRANCHES.filter(b => b.name.toLowerCase().includes(pickupLocation.toLowerCase())).length === 0 && (
                <li><span className="dropdown-item text-muted">Press enter to use custom location</span></li>
              )}
            </ul>
          )}
        </div>

        <div className="position-relative">
          <label className="form-label fw-semibold text-secondary small">Destination *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Select branch or type destination..." 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)} 
            onFocus={() => setShowDestDropdown(true)}
            onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
            required 
          />
          {showDestDropdown && (
            <ul className="dropdown-menu show w-100 position-absolute shadow-sm" style={{ top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {NTC_BRANCHES.filter(b => b.name.toLowerCase().includes(destination.toLowerCase())).map(b => (
                <li key={b.id}>
                  <button type="button" className="dropdown-item py-2" onMouseDown={() => setDestination(b.name)}>
                    {b.name}
                  </button>
                </li>
              ))}
              {NTC_BRANCHES.filter(b => b.name.toLowerCase().includes(destination.toLowerCase())).length === 0 && (
                <li><span className="dropdown-item text-muted">Press enter to use custom destination</span></li>
              )}
            </ul>
          )}
        </div>

        <div>
          <label className="form-label fw-semibold text-secondary small">Pickup Date & Time *</label>
          <input type="datetime-local" className="form-control" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required />
        </div>

        <div className="position-relative">
          <label className="form-label fw-semibold text-secondary small">Passengers (Optional)</label>
          <div 
            className="form-control d-flex justify-content-between align-items-center" 
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            style={{ cursor: 'pointer', minHeight: '38px', backgroundColor: '#fff' }}
          >
            <span className={selectedPassengers.length === 0 ? "text-muted" : "text-dark"} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {selectedPassengers.length === 0 
                ? "Select friends..." 
                : selectedPassengers.join(', ')}
            </span>
            <span className="text-muted small">▼</span>
          </div>
          {showPassengerDropdown && (
            <ul className="dropdown-menu show w-100 position-absolute shadow-sm p-2" style={{ top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
              {branchEmployees.length === 0 ? (
                <li className="dropdown-item text-muted small">No other employees found in your branch</li>
              ) : (
                branchEmployees.map(emp => {
                  const empName = `${emp.first_name} ${emp.last_name}`;
                  const isChecked = selectedPassengers.includes(empName);
                  return (
                    <li key={emp.id} className="dropdown-item py-1" onClick={(e) => e.stopPropagation()}>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id={`passenger-${emp.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPassengers([...selectedPassengers, empName]);
                            } else {
                              setSelectedPassengers(selectedPassengers.filter(p => p !== empName));
                            }
                          }}
                        />
                        <label className="form-check-label w-100" htmlFor={`passenger-${emp.id}`} style={{ cursor: 'pointer' }}>
                          {empName}
                        </label>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
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