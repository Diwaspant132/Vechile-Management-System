import React, { useState } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const initialNotifications = [
  { id: 1, type: 'success', title: 'Vehicle Request Approved', message: 'Your request for SUV (Ba 1 Ja 1234) has been approved by the Branch Admin.', time: '10 minutes ago', read: false },
  { id: 2, type: 'warning', title: 'Maintenance Due', message: 'Vehicle Ba 2 Ja 5678 is scheduled for routine maintenance tomorrow.', time: '2 hours ago', read: false },
  { id: 3, type: 'danger', title: 'Fuel Low Alert', message: 'Vehicle Ba 3 Ja 9012 fuel level dropped below 15%.', time: '5 hours ago', read: true },
  { id: 4, type: 'info', title: 'New Trip Assigned', message: 'You have been assigned a new trip to Pokhara Branch.', time: '1 day ago', read: true },
  { id: 5, type: 'info', title: 'System Update', message: 'The NTC Fleet Management system will undergo maintenance at midnight.', time: '2 days ago', read: true },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-success" />;
      case 'warning': return <AlertTriangle className="text-warning" />;
      case 'danger': return <AlertTriangle className="text-danger" />;
      default: return <Info className="text-primary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title d-flex align-items-center gap-2 mb-0">
          <Bell className="text-primary" style={{ color: 'var(--ntc-blue)' }} /> 
          Notification Center
          {unreadCount > 0 && <span className="badge bg-danger rounded-pill fs-6 ms-2">{unreadCount}</span>}
        </h2>
        <button className="btn btn-outline-primary" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark All as Read
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="list-group list-group-flush rounded">
          {notifications.length > 0 ? notifications.map(notif => (
            <div key={notif.id} className={`list-group-item p-4 border-bottom position-relative ${!notif.read ? 'bg-light' : ''}`}>
              {!notif.read && (
                <div className="position-absolute" style={{ left: '0', top: '0', bottom: '0', width: '4px', backgroundColor: 'var(--ntc-blue)' }}></div>
              )}
              <div className="d-flex gap-3">
                <div className="mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className={`mb-0 ${!notif.read ? 'fw-bold text-dark' : 'text-muted'}`}>{notif.title}</h6>
                    <small className="text-muted">{notif.time}</small>
                  </div>
                  <p className="mb-0 text-secondary">{notif.message}</p>
                </div>
                <button 
                  className="btn btn-sm btn-link text-muted p-0 ms-3 d-flex align-items-start" 
                  onClick={() => deleteNotification(notif.id)}
                  title="Remove Notification"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-5">
              <Bell size={48} className="text-muted opacity-50 mb-3" />
              <h5 className="text-muted fw-bold">All caught up!</h5>
              <p className="text-secondary mb-0">You have no notifications at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
