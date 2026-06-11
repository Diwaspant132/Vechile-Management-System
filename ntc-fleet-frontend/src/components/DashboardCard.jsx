import React from 'react';

const DashboardCard = ({ title, value, icon, color = 'blue' }) => {
  return (
    <div className="dashboard-card card">
      <div className="card-body">
        <div className={`card-icon-wrapper ${color}`}>
          {icon}
        </div>
        <h6 className="text-muted mb-2">{title}</h6>
        <h3 className="mb-0 fw-bold">{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;
