import React, { useState, useEffect } from 'react';
import { Search, Filter, Car, Fuel, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from '../utils/toast';
import { customConfirm } from '../components/customConfirm';

const MyRequests = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 2. Fetch all requests from the backend
        const response = await fetch(`${API_URL}/api/requests`);
        const data = await response.json();

        // 3. RELIABLE FILTERING:
        // Convert to Number to ensure ID match works even if types differ
        const filtered = data.filter(req => Number(req.employee_id) === Number(user.id));

        setMyRequests(filtered);
        setLoading(false);
      } catch (error) {
        console.error('Error loading personal history stream:', error);
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [API_URL, user]);

  const handleCancelRequest = async (requestId) => {
    if (!(await customConfirm("Are you sure you want to cancel this request?"))) return;
    
    try {
      const res = await fetch(`${API_URL}/api/requests/status/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      
      if (res.ok) {
        setMyRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'CANCELLED' } : req
        ));
        toast.success("Request cancelled successfully.");
      } else {
        toast.error("Failed to cancel request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cancelling request.");
    }
  };

  if (loading) return <div className="p-4 text-center text-muted">Loading your booking history...</div>;

  return (
    <div className="card p-4 shadow-sm mt-4">
      <h3 className="mb-4 fw-bold text-primary">My Vehicle Booking History</h3>

      {myRequests.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-3">You haven't submitted any vehicle requests yet.</p>
          <a href="/dashboard/request-vehicle" className="btn btn-outline-primary btn-sm">
            Request Your First Vehicle
          </a>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Req ID</th>
                <th>Vehicle Type</th>
                <th>Route Parameters</th>
                <th>Scheduled Time</th>
                <th>Purpose</th>
                <th className="text-center">Approval Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((req) => (
                <tr key={req.id}>
                  <td><strong>#{req.id}</strong></td>
                  <td><span className="badge bg-secondary">{req.vehicle_type}</span></td>
                  <td>
                    <small className="d-block text-dark"><strong>From:</strong> {req.pickup_location}</small>
                    <small className="d-block text-muted"><strong>To:</strong> {req.destination}</small>
                  </td>
                  <td><small>{req.pickup_time || 'Pending Slots'}</small></td>
                  <td><p className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>{req.purpose}</p></td>
                  <td className="text-center">
                    <span className={`badge ${
                      (req.status === 'APPROVED') ? 'bg-success' : 
                      (req.status === 'REJECTED') ? 'bg-danger' : 
                      (req.status === 'CANCELLED') ? 'bg-secondary' : 'bg-warning text-dark'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="text-center">
                    {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                      <button 
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        onClick={() => handleCancelRequest(req.id)}
                        title="Cancel Request"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyRequests;