import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Database, Key, Activity, Download } from 'lucide-react';

const AuditLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/audit-logs`);
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setLoading(false);
      }
    };
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const getIcon = (type) => {
    switch (type) {
      case 'SECURITY': return <Key size={14} className="text-info" />;
      case 'MUTATION': return <Database size={14} className="text-warning" />;
      case 'APPROVAL': return <ShieldCheck size={14} className="text-success" />;
      default: return <Activity size={14} className="text-secondary" />;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString.replace(' ', 'T') + 'Z').toLocaleString();
  };

  const exportToCSV = () => {
    if (!events || events.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Type,Description,Timestamp\n";
    
    events.forEach(log => {
      const desc = log.description ? log.description.replace(/"/g, '""') : '';
      const date = log.created_at ? new Date(log.created_at.replace(' ', 'T') + 'Z').toLocaleString() : '';
      csvContent += `${log.id},${log.type},"${desc}","${date}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NTC_Fleet_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-4 text-center text-muted">Loading system audit logs...</div>;

  return (
    <div className="card p-4 shadow-sm mt-4 border-0 rounded-3">
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-primary mb-1">System Security Audit Logs</h3>
          <p className="text-muted mb-0">Verifiable transactional log of back-end database operations, authentications, and state updates.</p>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2 fw-bold" onClick={exportToCSV}>
          <Download size={18} /> Export to CSV
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {events.length === 0 ? (
          <p className="text-muted text-center py-4">No audit logs recorded yet.</p>
        ) : (
          events.map((log) => (
            <div key={log.id} className="p-3 border rounded-3 bg-light d-flex align-items-start gap-3">
              <div className="p-2 bg-white rounded-circle border shadow-sm">
                {getIcon(log.type)}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-secondary small font-monospace">{log.type}</span>
                  <small className="text-muted font-monospace">{formatTime(log.created_at)}</small>
                </div>
                <p className="mb-0 small text-dark fw-medium">{log.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogs;