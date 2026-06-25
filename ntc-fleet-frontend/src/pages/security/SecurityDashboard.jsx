import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from '../../utils/toast';
import { CarFront, MapPin, Clock, Users, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { customConfirm } from '../../components/customConfirm';

const SecurityDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const branchParam = user?.branch ? `?branch=${encodeURIComponent(user.branch)}` : '';
      const response = await fetch(`${API_URL}/api/requests${branchParam}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching security dashboard data:', error);
      toast.error('Could not load trips');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleGateStatus = async (reqId, newGateStatus) => {
    const isConfirmed = await customConfirm({
      title: 'Update Gate Status',
      text: `Mark this vehicle as ${newGateStatus}?`,
      confirmButtonText: 'Yes, update',
      icon: 'question'
    });

    if (!isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/requests/${reqId}/gate-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate_status: newGateStatus })
      });

      if (response.ok) {
        toast.success(`Vehicle marked as ${newGateStatus}`);
        fetchData();
      } else {
        toast.error('Could not update gate status.');
      }
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Network error');
    }
  };

  if (loading) return <div className="p-5 text-center text-muted"><div className="spinner-border text-primary" /></div>;

  // Active trips: APPROVED or IN_PROGRESS
  const activeTrips = requests.filter(r => ['APPROVED', 'IN_PROGRESS'].includes(r.status));
  
  // History trips: Only COMPLETED trips (assigned and finished)
  const historyTrips = requests.filter(r => r.status === 'COMPLETED');

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <ShieldCheck className="text-primary" size={32} />
            Security Dashboard
          </h2>
          <p className="text-muted mb-0">{user?.branch} Branch Gate Control</p>
        </div>
      </div>

      <div className="row mb-5">
        <h4 className="fw-bold mb-3 text-dark">Active & Assigned Trips</h4>
        {activeTrips.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 text-center p-5 bg-white">
              <CarFront size={48} className="text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted mb-0 fs-5">No vehicles are currently expected or active.</p>
            </div>
          </div>
        ) : (
          activeTrips.map(trip => {
            const passengers = trip.passengers ? JSON.parse(trip.passengers) : [];
            const gateStatus = trip.gate_status || 'WAITING';
            
            return (
              <div key={trip.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                  <div className={`card-header border-0 px-4 py-3 text-white d-flex justify-content-between align-items-center ${gateStatus === 'WAITING' ? 'bg-primary' : gateStatus === 'DEPARTED' ? 'bg-warning text-dark' : 'bg-success'}`}>
                    <h5 className="mb-0 fw-bold fs-6">Trip #REQ-{trip.id}</h5>
                    <span className="badge bg-white text-dark rounded-pill fw-bold">
                      {gateStatus}
                    </span>
                  </div>
                  
                  <div className="card-body p-4 bg-light bg-opacity-50">
                    <h5 className="fw-bold text-dark mb-3">Assigned Trip Details</h5>
                    
                    <div className="d-flex flex-column gap-3 mb-4">
                      <div className="d-flex align-items-start gap-3">
                        <MapPin className="text-primary mt-1 flex-shrink-0" size={20} />
                        <div>
                          <div className="small text-muted fw-bold text-uppercase">Route</div>
                          <div className="text-dark fw-medium">{trip.pickup_location} <ArrowRight size={14} className="mx-1" /> {trip.destination}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-3">
                        <Clock className="text-primary mt-1 flex-shrink-0" size={20} />
                        <div>
                          <div className="small text-muted fw-bold text-uppercase">Time</div>
                          <div className="text-dark fw-medium">{trip.pickup_time ? new Date(trip.pickup_time.replace(' ', 'T').replace(/Z$/, '') + 'Z').toLocaleString() : '-'}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-3">
                        <Users className="text-primary mt-1 flex-shrink-0" size={20} />
                        <div>
                          <div className="small text-muted fw-bold text-uppercase">Requester</div>
                          <div className="text-dark fw-medium">{trip.first_name} {trip.last_name}</div>
                          {passengers.length > 0 && (
                            <div className="small text-muted mt-1">
                              <strong>Other Passengers:</strong> {passengers.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="d-flex align-items-start gap-3">
                        <CarFront className="text-primary mt-1 flex-shrink-0" size={20} />
                        <div>
                          <div className="small text-muted fw-bold text-uppercase">Assigned Driver & Vehicle</div>
                          <div className="text-dark fw-medium">
                            {trip.driver_first_name ? `${trip.driver_first_name} ${trip.driver_last_name}` : 'Pending Driver'}
                          </div>
                          <div className="small text-primary fw-bold mt-1">
                            {trip.license_plate ? `${trip.license_plate} (${trip.vehicle_model})` : 'Pending Vehicle'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {trip.purpose && (
                      <div className="fst-italic text-muted small border-start border-3 border-secondary ps-3 py-1 mb-4">
                        "{trip.purpose}"
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-auto">
                      {gateStatus === 'WAITING' && (
                        <button 
                          className="btn btn-warning w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                          onClick={() => handleGateStatus(trip.id, 'DEPARTED')}
                        >
                          <ArrowRight size={18} /> Mark Departed
                        </button>
                      )}
                      {gateStatus === 'DEPARTED' && (
                        <button 
                          className="btn btn-success w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                          onClick={() => handleGateStatus(trip.id, 'RETURNED')}
                        >
                          <CheckCircle2 size={18} /> Mark Returned
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="row">
        <div className="col-12">
          <h4 className="fw-bold mb-3 text-dark">Trip History</h4>
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Trip ID</th>
                    <th>Requester</th>
                    <th>Driver & Vehicle</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Gate Status</th>
                    <th>Departed At</th>
                    <th>Returned At</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTrips.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">No completed trips found.</td>
                    </tr>
                  ) : (
                    historyTrips.map(trip => (
                      <tr key={trip.id}>
                        <td className="fw-bold">#REQ-{trip.id}</td>
                        <td>{trip.first_name} {trip.last_name}</td>
                        <td>
                          <div>{trip.driver_first_name} {trip.driver_last_name}</div>
                          <div className="small text-muted">{trip.license_plate}</div>
                        </td>
                        <td>{trip.destination}</td>
                        <td>
                          <span className={`badge ${trip.status === 'COMPLETED' ? 'bg-success' : 'bg-danger'}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td>
                           <span className="badge bg-secondary text-white">
                             {trip.gate_status || 'UNKNOWN'}
                           </span>
                        </td>
                        <td className="small text-muted">
                           {trip.gate_departed_at ? new Date(trip.gate_departed_at).toLocaleString() : '-'}
                        </td>
                        <td className="small text-muted">
                           {trip.gate_returned_at ? new Date(trip.gate_returned_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SecurityDashboard;
