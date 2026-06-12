import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, MapPin, History, Car } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Wrapping TripManagement with an Error Boundary to catch render errors
class TripErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("TripManagement Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 alert alert-danger">
          <h4>Something went wrong rendering Trip Management</h4>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const TripManagementContent = () => {
  const { user } = useAuth();
  const [driverDetails, setDriverDetails] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [finalDistance, setFinalDistance] = useState('');
  const [petrolConsumed, setPetrolConsumed] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const lastPositionRef = useRef(null);
  const accumulatedDistanceRef = useRef(0);

  const fetchData = async () => {
    try {
      const drvRes = await fetch(`${API_URL}/api/drivers`);
      const drvData = await drvRes.json();
      
      const myProfile = Array.isArray(drvData) 
        ? drvData.find(d => String(d.phone_number) === String(user?.phone_number) && String(d.first_name).toLowerCase() === String(user?.first_name).toLowerCase()) 
        : null;
      
      setDriverDetails(myProfile);
      if (myProfile) {
        setIsTripActive(!!myProfile.trip_active);
        
        // Fetch vehicle
        const vehRes = await fetch(`${API_URL}/api/driver/my-vehicle/${myProfile.id}`);
        if (vehRes.ok) {
          const vehData = await vehRes.json();
          setVehicle(vehData.license_plate ? vehData : null);
        }

        // Fetch current assigned request
        const reqRes = await fetch(`${API_URL}/api/drivers/${myProfile.id}/current-request`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setCurrentRequest(reqData);
        }

        // Fetch trips
        fetchTrips(myProfile.id);
      }
      setLoading(false);
    } catch (err) { 
      console.error("Data loading error:", err);
      setLoading(false);
    }
  };

  const fetchTrips = async (driverId) => {
    try {
      const res = await fetch(`${API_URL}/api/drivers/${driverId}/trips`);
      if (res.ok) {
        const data = await res.json();
        setTripHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching trips:", e);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleStartTrip = async () => {
    if (!driverDetails) return;
    try {
      await fetch(`${API_URL}/api/drivers/trip-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverDetails.id, trip_active: 1 })
      });
      setIsTripActive(true);
      accumulatedDistanceRef.current = 0;
      lastPositionRef.current = null;
      setTimeout(() => fetchData(), 500);
    } catch (err) { console.error("Error toggling trip:", err); }
  };

  const handleEndTripClick = () => {
    const distKm = (accumulatedDistanceRef.current / 1000).toFixed(2);
    setFinalDistance(distKm);
    
    const kmpl = vehicle?.mileage_kmpl || 15.0;
    setPetrolConsumed((distKm / kmpl).toFixed(2));
    
    setShowEndTripModal(true);
  };

  const handleDistanceChange = (e) => {
    const val = e.target.value;
    setFinalDistance(val);
    
    const distKm = parseFloat(val) || 0;
    const kmpl = vehicle?.mileage_kmpl || 15.0;
    setPetrolConsumed((distKm / kmpl).toFixed(2));
  };

  const submitEndTrip = async (e) => {
    e.preventDefault();
    if (!driverDetails) return;
    try {
      await fetch(`${API_URL}/api/drivers/trip-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driver_id: driverDetails.id, 
          trip_active: 0,
          distance_km: parseFloat(finalDistance) || 0,
          petrol_consumed: parseFloat(petrolConsumed) || 0
        })
      });
      setIsTripActive(false);
      setShowEndTripModal(false);
      lastPositionRef.current = null;
      accumulatedDistanceRef.current = 0;
      setTimeout(() => fetchData(), 500);
    } catch (err) { console.error("Error ending trip:", err); }
  };

  // GPS Broadcasting Logic
  useEffect(() => {
    if (!isTripActive || !vehicle) return;
    
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        if (lastPositionRef.current) {
          const dist = calculateHaversineDistance(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            latitude,
            longitude
          );
          accumulatedDistanceRef.current += dist;
        }
        lastPositionRef.current = { latitude, longitude };

        fetch(`${API_URL}/api/tracking/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id: vehicle.id,
            latitude,
            longitude
          })
        }).catch(console.error);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTripActive, vehicle]);

  if (loading) return <div className="p-4">Loading Trip Management...</div>;

  const validTrips = Array.isArray(tripHistory) ? tripHistory : [];

  return (
    <div className="container-fluid p-4">
      <h3 className="fw-bold mb-4">Trip Management</h3>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card p-4 shadow-sm border-0 mb-4">
            <h5 className="mb-4"><MapPin className="me-2 text-primary"/> Active Trip Control</h5>
            
            {!vehicle ? (
               <div className="alert alert-warning">
                 <Car className="me-2"/> You cannot start a trip without an assigned vehicle.
               </div>
            ) : (
              <>
                {currentRequest && (
                  <div className="bg-light border p-3 rounded mb-4 text-start">
                    <h6 className="fw-bold mb-2 border-bottom pb-2">Assigned Trip Details</h6>
                    <div className="small">
                      <p className="mb-1 text-truncate"><strong>From:</strong> {currentRequest.pickup_location}</p>
                      <p className="mb-1 text-truncate"><strong>To:</strong> {currentRequest.destination}</p>
                      <p className="mb-1"><strong>Time:</strong> {currentRequest.pickup_time}</p>
                      <p className="mb-1 text-truncate"><strong>Passenger:</strong> {currentRequest.first_name} {currentRequest.last_name}</p>
                      <p className="mb-0 text-muted"><em>"{currentRequest.purpose}"</em></p>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 text-center">
                  <div className={`d-inline-flex p-3 rounded-circle mb-3 ${isTripActive ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                    {isTripActive ? <MapPin size={40}/> : <MapPin size={40}/>}
                  </div>
                  <h4 className={isTripActive ? 'text-danger' : 'text-success'}>
                    {isTripActive ? 'Trip in Progress' : 'Ready to Start'}
                  </h4>
                  <p className="text-muted small">Vehicle: {vehicle.license_plate}</p>
                </div>
                
                <div className="d-flex gap-2">
                  {(!isTripActive && !currentRequest) ? (
                    <div className="alert alert-info text-center w-100 mb-0">
                      <strong>Waiting for Assignment:</strong> You cannot start a trip until a Branch Admin assigns a request to you.
                    </div>
                  ) : (
                    <button 
                      className={`btn btn-lg ${isTripActive ? 'btn-danger' : 'btn-success'} w-100 py-3 fw-bold`}
                      onClick={isTripActive ? handleEndTripClick : handleStartTrip}
                      disabled={!driverDetails}
                    >
                      {isTripActive ? (
                        <><Square size={20} className="me-2"/> END TRIP</>
                      ) : (
                        <><Play size={20} className="me-2"/> START REQUESTED TRIP</>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {showEndTripModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">End Trip Details</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEndTripModal(false)}></button>
                </div>
                <form onSubmit={submitEndTrip}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label text-muted">Distance Travelled (km) <small>(Auto-calculated via GPS)</small></label>
                      <input type="number" step="0.01" className="form-control" value={finalDistance} onChange={handleDistanceChange} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Petrol Consumed (Liters) <small>(Calculated at {vehicle?.mileage_kmpl || 15.0} km/L)</small></label>
                      <input type="number" step="0.01" className="form-control bg-light" value={petrolConsumed} readOnly required />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEndTripModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-danger">Confirm End Trip</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="col-md-7">
           <div className="card p-4 shadow-sm border-0 h-100">
             <h5 className="mb-3"><History size={20} className="me-2 text-secondary"/> Old Trip History</h5>
             
             {validTrips.length === 0 ? (
               <p className="text-muted text-center py-5">No trips recorded yet.</p>
             ) : (
               <div className="table-responsive">
                 <table className="table table-hover align-middle">
                   <thead className="table-light">
                     <tr>
                       <th>Trip ID</th>
                       <th>Vehicle</th>
                       <th>Started At</th>
                       <th>Ended At</th>
                       <th>Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {validTrips.map(trip => (
                       <tr key={trip.id}>
                         <td>#{trip.id}</td>
                         <td>
                           {trip.license_plate ? (
                             <div>
                               <div className="fw-bold small">{trip.vehicle_model}</div>
                               <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>{trip.license_plate}</span>
                             </div>
                           ) : (
                             <span className="text-muted">-</span>
                           )}
                         </td>
                         <td>{trip.start_time ? new Date(trip.start_time.replace(' ', 'T') + 'Z').toLocaleString() : '-'}</td>
                         <td>{trip.end_time ? new Date(trip.end_time.replace(' ', 'T') + 'Z').toLocaleString() : '-'}</td>
                         <td>
                           <span className={`badge ${trip.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                             {trip.status}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const TripManagement = () => (
  <TripErrorBoundary>
    <TripManagementContent />
  </TripErrorBoundary>
);

export default TripManagement;
