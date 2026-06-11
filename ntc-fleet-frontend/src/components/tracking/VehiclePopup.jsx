import React from 'react';

const VehiclePopup = ({ vehicle }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-bg-green';
      case 'IDLE': return 'status-bg-gray';
      case 'MAINTENANCE': return 'status-bg-red';
      case 'OFFLINE': return 'status-bg-slate';
      default: return 'status-bg-blue';
    }
  };

  return (
    <div className="tracking-popup-content">
      <div className="tracking-popup-header">
        <h3 className="tracking-popup-title">{vehicle.plateNumber}</h3>
        <span className={`tracking-popup-status ${getStatusColor(vehicle.status)}`}>
          {vehicle.status}
        </span>
      </div>
      
      <div className="tracking-popup-details">
        <div className="tracking-popup-row">
          <span className="tracking-popup-label">Driver:</span>
          <span>{vehicle.driver}</span>
        </div>
        <div className="tracking-popup-row">
          <span className="tracking-popup-label">Type:</span>
          <span>{vehicle.type}</span>
        </div>
        <div className="tracking-popup-row">
          <span className="tracking-popup-label">Speed:</span>
          <span>{vehicle.speed} km/h</span>
        </div>
        <div className="tracking-popup-row">
          <span className="tracking-popup-label">Fuel:</span>
          <span>{vehicle.fuelLevel}%</span>
        </div>
      </div>

      {vehicle.status === 'ACTIVE' && (
        <div className="tracking-popup-destination-wrapper">
          <p className="tracking-popup-dest-label">Destination</p>
          <p className="tracking-popup-dest-value" title={vehicle.destination}>
            {vehicle.destination}
          </p>
          <p className="tracking-popup-eta">ETA: {vehicle.eta}</p>
        </div>
      )}
    </div>
  );
};

export default VehiclePopup;
