import React from 'react';
import StatusBadge from './StatusBadge';

const VehicleTable = ({ vehicles }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover ntc-table">
        <thead>
          <tr>
            <th>Vehicle No.</th>
            <th>Type</th>
            <th>Assigned Driver</th>
            <th>Fuel Level</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, index) => (
            <tr key={index}>
              <td className="fw-bold">{v.no}</td>
              <td>{v.type}</td>
              <td>{v.driver}</td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress w-100" style={{ height: '6px' }}>
                    <div 
                      className={`progress-bar ${parseInt(v.fuel) < 20 ? 'bg-danger' : 'bg-success'}`} 
                      style={{ width: v.fuel }}
                    ></div>
                  </div>
                  <span className="small text-muted" style={{ minWidth: '35px' }}>{v.fuel}</span>
                </div>
              </td>
              <td><StatusBadge status={v.status} /></td>
            </tr>
          ))}
          {vehicles.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-muted py-4">
                No vehicles found matching criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleTable;
