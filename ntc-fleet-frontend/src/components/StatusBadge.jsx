import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'status-badge ';
  
  switch (status.toLowerCase()) {
    case 'pending':
      badgeClass += 'status-pending';
      break;
    case 'approved':
    case 'available':
    case 'completed':
      badgeClass += 'status-approved';
      break;
    case 'rejected':
    case 'unavailable':
      badgeClass += 'status-rejected';
      break;
    case 'active':
    case 'in progress':
      badgeClass += 'status-active';
      break;
    case 'maintenance':
      badgeClass += 'status-maintenance';
      break;
    default:
      badgeClass += 'bg-secondary text-white';
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
};

export default StatusBadge;
