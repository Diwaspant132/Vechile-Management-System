import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPanel = ({ notifications }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} color="#eab308" />;
      case 'success': return <CheckCircle size={16} color="#22c55e" />;
      default: return <Info size={16} color="#3b82f6" />;
    }
  };

  return (
    <div className="tracking-notification-panel">
      <div className="tracking-notification-list">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="tracking-notification-item"
            >
              <div style={{ marginTop: '2px' }}>{getIcon(notif.type)}</div>
              <div className="tracking-notification-content">
                <p className="tracking-notification-message">{notif.message}</p>
                <p className="tracking-notification-time">{notif.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationPanel;
