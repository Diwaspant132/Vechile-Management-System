import React, { useState, useEffect } from 'react';

const UserApprovals = () => {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchPendingAdmins = async () => {
    try {
      // 🟢 UPDATED: Changed from /api/users/pending to /api/admin/pending-admins
      const response = await fetch(`${API_URL}/api/admin/pending-admins`);
      if (response.ok) {
        const data = await response.json();
        setPendingAdmins(data);
      } else {
        console.error("Failed to fetch. Status:", response.status);
      }
    } catch (err) {
      console.error("Failed to load registration queues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoadingId(userId);
    setMessage({ text: '', type: '' });

    try {
      // Ensure this endpoint exists in your server.js as well
      const response = await fetch(`${API_URL}/api/users/approve/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();

      if (response.ok) {
        setMessage({ text: data.message, type: 'success' });
        setPendingAdmins(pendingAdmins.filter(u => u.id !== userId));
      } else {
        setMessage({ text: data.error || 'Approval routine failed.', type: 'danger' });
      }
    } catch (error) {
      setMessage({ text: 'Network connection link timeout.', type: 'danger' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this registration request?")) return;

    setActionLoadingId(userId);
    try {
      const response = await fetch(`${API_URL}/api/users/remove/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ text: "Registration request removed.", type: 'warning' });
        setPendingAdmins(pendingAdmins.filter(u => u.id !== userId));
      } else {
        setMessage({ text: 'Deletion failed.', type: 'danger' });
      }
    } catch (error) {
      setMessage({ text: 'Network error.', type: 'danger' });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Syncing admin registration queues...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark">Branch Admin Activation Console</h2>
          <p className="text-muted small mb-0">Security authorization gateway strictly for activating regional telecom branch administrators.</p>
        </div>
        <span className="badge bg-danger p-2 fs-6 shadow-sm">{pendingAdmins.length} Pending Admins</span>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 shadow-sm mb-4`} role="alert">
          {message.text}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary font-monospace small">
              <tr>
                <th className="ps-4 py-3">ADMIN NAME</th>
                <th className="py-3">USERNAME / EMAIL</th>
                <th className="py-3">ASSIGNED STATION POOL</th>
                <th className="py-3 text-center">PHONE</th>
                <th className="py-3 text-end pe-4">ACTION PANEL</th>
              </tr>
            </thead>
            <tbody>
              {pendingAdmins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted font-monospace">
                    ✨ Clear Horizon! No Branch Admins are currently waiting for system access.
                  </td>
                </tr>
              ) : (
                pendingAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="ps-4 fw-semibold text-dark">
                      {admin.first_name} {admin.last_name}
                    </td>
                    <td>
                      <div className="fw-medium text-secondary">{admin.username}</div>
                      <div className="text-muted small" style={{ fontSize: '0.8rem' }}>{admin.email}</div>
                    </td>
                    <td className="fw-bold text-primary font-monospace">
                      <span className="badge bg-warning text-dark me-2 small" style={{ fontSize: '0.7rem' }}>BRANCH ADMIN</span>
                      {admin.branch}
                    </td>
                    <td className="text-center font-monospace text-muted">{admin.phone_number}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          className="btn btn-success btn-sm fw-bold px-3 py-1.5 shadow-sm rounded-2"
                          onClick={() => handleApprove(admin.id)}
                          disabled={actionLoadingId === admin.id}
                        >
                          {actionLoadingId === admin.id ? '...' : 'Approve'}
                        </button>
                        <button 
                          className="btn btn-danger btn-sm fw-bold px-3 py-1.5 shadow-sm rounded-2"
                          onClick={() => handleRemove(admin.id)}
                          disabled={actionLoadingId === admin.id}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserApprovals;