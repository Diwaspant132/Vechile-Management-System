import React from 'react';
import { FileQuestion, Inbox } from 'lucide-react';

const EmptyState = ({ title = "No Data Available", message = "There is no data to display matching your criteria.", icon = <Inbox size={48} className="text-muted mb-3" /> }) => {
  return (
    <div className="text-center py-5">
      {icon}
      <h5 className="fw-bold text-dark">{title}</h5>
      <p className="text-muted">{message}</p>
    </div>
  );
};

export default EmptyState;
