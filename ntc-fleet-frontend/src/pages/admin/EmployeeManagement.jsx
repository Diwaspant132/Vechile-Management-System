import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('APPROVED'); // 'APPROVED', 'PENDING', 'REJECTED'
  
  const { user } = useAuth();
  const branch = user?.branch || '';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchEmployees = async () => {
    try {
      const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
      const response = await fetch(`${API_URL}/api/employees${branchParam}`);
      if (response.ok) {
        const data = await response.json();
        let filtered = Array.isArray(data) ? data : [];
        if (user?.role === 'BRANCH_ADMIN') {
          // Backend handles branch isolation
        }
        setEmployees(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast.error("Network error while syncing employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user]);

  const handleStatusUpdate = async (employeeId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${employeeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success(`Employee marked as ${newStatus}`);
      fetchEmployees();
    } catch (e) { 
      toast.error('Action failed: ' + e.message); 
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.status === activeTab &&
    (emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container-fluid mt-4">
      <div className="card p-4 shadow-sm border-0 rounded-3">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="fw-bold text-primary mb-1"><Users className="me-2" /> Employee Directory</h3>
            <p className="text-muted mb-0">Manage and review employee access and registrations.</p>
          </div>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search employees..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'APPROVED' ? 'active text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('APPROVED')}
            >
              Approved (Active)
              <span className="badge bg-success ms-2">{employees.filter(e => e.status === 'APPROVED').length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'PENDING' ? 'active text-warning' : 'text-muted'}`}
              onClick={() => setActiveTab('PENDING')}
            >
              Pending Approval
              <span className="badge bg-warning text-dark ms-2">{employees.filter(e => e.status === 'PENDING').length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-bold ${activeTab === 'REJECTED' ? 'active text-danger' : 'text-muted'}`}
              onClick={() => setActiveTab('REJECTED')}
            >
              Rejected
              <span className="badge bg-danger ms-2">{employees.filter(e => e.status === 'REJECTED').length}</span>
            </button>
          </li>
        </ul>

        {/* Table */}
        <div className="table-responsive bg-white rounded border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="small text-muted font-monospace">
                <th>EMPLOYEE ID</th>
                <th>NAME</th>
                <th>CONTACT / EMAIL</th>
                <th>BRANCH</th>
                <th className="text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Syncing directory...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No employees found in this category.</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="fw-bold">#{emp.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{emp.first_name} {emp.last_name}</div>
                      <div className="text-muted small">@{emp.username}</div>
                    </td>
                    <td>
                      <div className="text-dark small">{emp.phone_number || '-'}</div>
                      <div className="text-muted small">{emp.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-dark border">{emp.branch}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {activeTab === 'PENDING' && (
                          <>
                            <button onClick={() => handleStatusUpdate(emp.id, 'APPROVED')} className="btn btn-sm btn-success fw-bold px-3">Approve</button>
                            <button onClick={() => handleStatusUpdate(emp.id, 'REJECTED')} className="btn btn-sm btn-danger fw-bold px-3">Reject</button>
                          </>
                        )}
                        {activeTab === 'APPROVED' && (
                          <button onClick={() => handleStatusUpdate(emp.id, 'REJECTED')} className="btn btn-sm btn-outline-danger fw-bold px-3">Revoke Access</button>
                        )}
                        {activeTab === 'REJECTED' && (
                          <button onClick={() => handleStatusUpdate(emp.id, 'APPROVED')} className="btn btn-sm btn-outline-success fw-bold px-3">Restore Access</button>
                        )}
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

export default EmployeeManagement;
