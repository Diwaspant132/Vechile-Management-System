import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Fuel, Gauge, Navigation } from 'lucide-react';
import L from 'leaflet';
import { io } from 'socket.io-client';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

import { useAuth } from '../../contexts/AuthContext';

const LiveTracking = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let socket;
    
    const fetchTelemetry = async () => {
      try {
        const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
        const response = await fetch(`${API_URL}/api/tracking/all${branchParam}`);
        const data = await response.json();
        
        const formattedData = data.map(v => ({
            id: v.vehicle_id,
            plateNumber: v.license_plate,
            model: v.model,
            lat: v.latitude || 27.7172,
            lng: v.longitude || 85.3240,
            pickup: v.pickup_location,
            destination: v.destination,
            status: 'ACTIVE', // Defaulting as we fetch from location table
            speed: 0,         // Placeholder if not in location table
            fuelLevel: 100    // Placeholder
        }));

        setVehicles(formattedData);
        if (formattedData.length > 0) {
          setSelectedVehicle(prev => {
             if (!prev) return formattedData[0];
             const updatedCurrent = formattedData.find(v => v.id === prev.id);
             return updatedCurrent || prev;
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching GPS telemetry data:', error);
        setLoading(false);
      }
    };

    fetchTelemetry();
    
    // Setup WebSocket
    socket = io(API_URL);
    
    socket.on('vehicle_location_updated', (data) => {
      setVehicles(prevVehicles => {
        const updated = prevVehicles.map(v => {
          if (v.id === data.vehicle_id) {
            return { ...v, lat: data.latitude, lng: data.longitude };
          }
          return v;
        });
        
        setSelectedVehicle(prevSelected => {
          if (prevSelected && prevSelected.id === data.vehicle_id) {
             return { ...prevSelected, lat: data.latitude, lng: data.longitude };
          }
          return prevSelected;
        });
        
        return updated;
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [API_URL, user]);

  if (loading) return <div className="p-4 text-center text-muted">Booting real-time GPS terminal systems...</div>;

  return (
    <div className="container-fluid py-3">
      <h3 className="mb-4 fw-bold text-primary">NTC Active Fleet Live Telemetry Hub</h3>

      <div className="row g-4">
        <div className="col-md-5">
          <div className="card shadow-sm border-0 p-3 h-100" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <h5 className="fw-bold mb-3 text-secondary">Operational Fleet Status</h5>
            <div className="d-flex flex-column gap-3">
              {vehicles.map((v) => (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedVehicle(v)}
                  className={`card p-3 border transition-all ${selectedVehicle?.id === v.id ? 'border-primary bg-light shadow-sm' : 'border-light'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between">
                    <h6 className="fw-bold mb-1">{v.plateNumber}</h6>
                    <span className="badge bg-success">ACTIVE</span>
                  </div>
                  <small className="text-muted">{v.model}</small>
                  {(v.pickup && v.destination) && (
                    <div className="mt-2 small bg-white border rounded p-2">
                      <div className="d-flex align-items-center mb-1">
                        <div className="bg-primary rounded-circle me-2" style={{width: '6px', height: '6px'}}></div>
                        <span className="text-truncate">From: {v.pickup}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-danger rounded-circle me-2" style={{width: '6px', height: '6px'}}></div>
                        <span className="text-truncate">To: {v.destination}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="alert alert-info border-0 small text-center p-4">
                  <Navigation size={24} className="mb-2 text-info opacity-75" />
                  <p className="mb-0">No active trips detected.</p>
                  <p className="text-muted mb-0" style={{fontSize: '0.75rem'}}>Vehicles will appear here instantly when a driver starts a trip.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm border-0 h-100 p-3 bg-white rounded-3" style={{ minHeight: '60vh' }}>
            {selectedVehicle ? (
              <>
                <div className="mb-3">
                  <h5>{selectedVehicle.plateNumber}</h5>
                  {selectedVehicle.pickup && selectedVehicle.destination && (
                    <p className="text-muted small mb-0">
                      <strong>Route:</strong> {selectedVehicle.pickup} &rarr; {selectedVehicle.destination}
                    </p>
                  )}
                </div>
                <div className="rounded-3 border overflow-hidden" style={{ height: '400px' }}>
                  <MapContainer center={[selectedVehicle.lat, selectedVehicle.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <Marker position={[selectedVehicle.lat, selectedVehicle.lng]}>
                      <Popup>{selectedVehicle.plateNumber}</Popup>
                    </Marker>

                    {vehicles.filter(v => v.id !== selectedVehicle.id).map(v => (
                      <Marker key={v.id} position={[v.lat, v.lng]}>
                        <Popup>{v.plateNumber}</Popup>
                      </Marker>
                    ))}
                    
                    <MapRecenter lat={selectedVehicle.lat} lng={selectedVehicle.lng} />
                  </MapContainer>
                </div>
              </>
            ) : (
              <p className="text-center py-5">Select a vehicle to view live position.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;