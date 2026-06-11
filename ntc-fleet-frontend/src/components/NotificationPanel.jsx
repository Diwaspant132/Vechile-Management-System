import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotificationPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user?.id) return;
    
    // Initial fetch to get history
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    fetchNotifs();

    // Establish Server-Sent Events (SSE) connection for real-time push
    const eventSource = new EventSource(`${API_URL}/api/notifications/stream/${user.id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Removed eventSource.close() to allow the browser to automatically reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [user, API_URL]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  const getIcon = (type) => {
    if (type === 'success') return <CheckCircle size={16} className="text-success" />;
    if (type === 'warning') return <Clock size={16} className="text-warning" />;
    return <AlertCircle size={16} className="text-info" />;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dropdown">
      <button 
        className="btn btn-link text-dark position-relative p-2 dropdown-toggle d-flex align-items-center text-decoration-none" 
        type="button" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        style={{ caretColor: 'transparent' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New alerts</span>
          </span>
        )}
      </button>

      <div className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-0" style={{ width: '320px', borderRadius: '10px', overflow: 'hidden' }}>
        <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">Notifications</h6>
          {unreadCount > 0 && <span className="badge bg-primary rounded-pill">{unreadCount} New</span>}
        </div>
        
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted small">No notifications yet.</div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-3 border-bottom d-flex gap-3 align-items-start ${notif.is_read === 0 ? 'bg-primary bg-opacity-10' : ''}`} 
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => notif.is_read === 0 && markAsRead(notif.id)}
              >
                <div className="mt-1">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <p className={`mb-1 small text-dark ${notif.is_read === 0 ? 'fw-bold' : ''}`}>{notif.message}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>{formatTime(notif.created_at)}</p>
                </div>
                {notif.is_read === 0 && (
                  <div className="ms-auto align-self-center">
                    <span className="bg-primary rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }}></span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-2 text-center bg-light">
          <button 
            className="btn btn-sm btn-link text-decoration-none text-primary fw-medium"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
