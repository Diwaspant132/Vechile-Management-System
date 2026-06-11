import React, { useState } from 'react';
import { Search, Filter, Car, Activity, AlertTriangle, Coffee, MapPin } from 'lucide-react';

const TrackingSidebar = ({ vehicles, onSelectVehicle, selectedVehicleId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <Activity size={16} color="#10b981" />;
      case 'MAINTENANCE': return <AlertTriangle size={16} color="#ef4444" />;
      case 'IDLE': return <Coffee size={16} color="#6b7280" />;
      default: return <Car size={16} color="#3b82f6" />;
    }
  };

  return (
    <div className="tracking-sidebar">
      <div className="tracking-sidebar-header">
        <h2 className="tracking-sidebar-title">Fleet Tracking</h2>
        
        <div className="tracking-search-box">
          <input 
            type="text" 
            placeholder="Search vehicle or driver..." 
            className="tracking-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} className="tracking-search-icon" />
        </div>

        <div className="tracking-filters">
          {['ALL', 'ACTIVE', 'IDLE', 'MAINTENANCE'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`tracking-filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="tracking-vehicle-list">
        {filteredVehicles.map(vehicle => (
          <div 
            key={vehicle.id}
            onClick={() => onSelectVehicle(vehicle)}
            className={`tracking-vehicle-card ${selectedVehicleId === vehicle.id ? 'selected' : ''}`}
          >
            <div className="tracking-vehicle-header">
              <div className="tracking-vehicle-info-wrapper">
                <div className="tracking-vehicle-icon-box">
                  <Car size={18} color="#374151" />
                </div>
                <div>
                  <h4 className="tracking-vehicle-plate">{vehicle.plateNumber}</h4>
                  <p className="tracking-vehicle-driver">{vehicle.driver}</p>
                </div>
              </div>
              {getStatusIcon(vehicle.status)}
            </div>

            <div className="tracking-vehicle-stats">
              <div className="tracking-stat-item">
                <span className="tracking-stat-label">Speed</span>
                <span className="tracking-stat-value">{vehicle.speed} km/h</span>
              </div>
              <div className="tracking-stat-item">
                <span className="tracking-stat-label">Fuel</span>
                <span className="tracking-stat-value">{vehicle.fuelLevel}%</span>
              </div>
            </div>

            {vehicle.status === 'ACTIVE' && (
              <div className="tracking-vehicle-destination">
                <MapPin size={12} color="#003893" style={{ flexShrink: 0 }} />
                <span className="tracking-vehicle-destination-text">{vehicle.destination}</span>
              </div>
            )}
          </div>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="tracking-empty-list">
            No vehicles found.
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingSidebar;
