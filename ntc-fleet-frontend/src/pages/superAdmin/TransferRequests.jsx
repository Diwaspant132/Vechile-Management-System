import React, { useState, useEffect } from 'react';
import toast from '../../utils/toast';
import { CarFront, MapPin, CheckCircle } from 'lucide-react';
import { NTC_BRANCHES } from '../../data/branches';
import { customConfirm } from '../../components/customConfirm';

const TransferRequests = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState({});
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchTransfers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vehicles/transfers`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    const interval = setInterval(fetchTransfers, 5000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleBranchSelect = (transferId, branch) => {
    setSelectedBranches(prev => ({ ...prev, [transferId]: branch }));
  };

  const handleAllocate = async (transferId) => {
    const toBranch = selectedBranches[transferId];
    if (!toBranch) {
      toast.error("Please select a destination branch first.");
      return;
    }

    if (await customConfirm(`Are you sure you want to transfer this vehicle to ${toBranch}?`)) {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/transfers/${transferId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_branch: toBranch })
        });
        
        if (res.ok) {
          toast.success(`Vehicle successfully transferred to ${toBranch}.`);
          fetchTransfers();
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to transfer vehicle.");
        }
      } catch (e) {
        console.error(e);
        toast.error("An error occurred.");
      }
    }
  };

  if (loading) return <div className="p-5 text-center text-muted">Loading transfer requests...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <CarFront className="text-primary" /> Vehicle Transfer Requests
          </h3>
          <p className="text-muted mb-0">Review branch transfer requests and allocate vehicles to new branches.</p>
        </div>
      </div>

      <div className="card shadow-sm border-0 p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary">
              <tr>
                <th>Vehicle No.</th>
                <th>Model</th>
                <th>Requested From</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Assign to Branch</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td className="fw-bold text-dark">{t.license_plate}</td>
                  <td>{t.model}</td>
                  <td>
                    <span className="badge bg-light text-dark border border-secondary px-2 py-1">
                      <MapPin size={12} className="me-1 d-inline" /> {t.from_branch}
                    </span>
                  </td>
                  <td>{t.first_name} {t.last_name}</td>
                  <td className="small text-muted">{t.created_at ? new Date(t.created_at.replace(' ', 'T').replace(/Z$/, '') + 'Z').toLocaleDateString() : '-'}</td>
                  <td>
                    <select 
                      className="form-select form-select-sm"
                      value={selectedBranches[t.id] || ''}
                      onChange={(e) => handleBranchSelect(t.id, e.target.value)}
                    >
                      <option value="" disabled>Select Destination...</option>
                      {NTC_BRANCHES.filter(b => b.id !== t.from_branch).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1"
                      onClick={() => handleAllocate(t.id)}
                    >
                      <CheckCircle size={16} /> Allocate
                    </button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No pending vehicle transfer requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransferRequests;
