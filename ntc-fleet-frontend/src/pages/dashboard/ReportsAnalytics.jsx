import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState(null);
  const [automatedReports, setAutomatedReports] = useState([]);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({ liters_added: '', token_date: new Date().toISOString().split('T')[0] });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ service_type: 'Other/Mechanical Issue', description: '' });
  
  const location = useLocation();
  const navigate = useNavigate();
  const selectedVehicleId = location.state?.selectedVehicleId;
  const licensePlate = location.state?.licensePlate;

  const [driverVehicleId, setDriverVehicleId] = useState(null);
  const [driverLicensePlate, setDriverLicensePlate] = useState(null);

  const activeVehicleId = selectedVehicleId || driverVehicleId;
  const activeLicensePlate = licensePlate || driverLicensePlate;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user?.role === 'DRIVER') {
      const fetchDriverVehicle = async () => {
        try {
          const res = await fetch(`${API_URL}/api/drivers`);
          const data = await res.json();
          const myProfile = Array.isArray(data) ? data.find(d => String(d.phone_number) === String(user.phone_number) && String(d.first_name).toLowerCase() === String(user.first_name).toLowerCase()) : null;
          if (myProfile) {
            const vehRes = await fetch(`${API_URL}/api/driver/my-vehicle/${myProfile.id}`);
            if (vehRes.ok) {
              const vehData = await vehRes.json();
              setDriverVehicleId(vehData.id || vehData.vehicle_id);
              setDriverLicensePlate(vehData.license_plate);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchDriverVehicle();
    }
  }, [user, API_URL]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (activeVehicleId) {
            const vRes = await fetch(`${API_URL}/api/vehicles/${activeVehicleId}/reports`);
            if (vRes.ok) {
                const vData = await vRes.json();
                setVehicleData(vData);
            }
        }
        
        const branchParam = user?.role === 'BRANCH_ADMIN' ? `?branch=${encodeURIComponent(user?.branch || '')}` : '';
        const response = await fetch(`${API_URL}/api/requests${branchParam}`);
        const data = await response.json();
        
        let processedData = Array.isArray(data) ? data : [];
        // Backend handles branch isolation via branchParam
        
        const autoRes = await fetch(`${API_URL}/api/reports/automated`);
        if (autoRes.ok) {
           setAutomatedReports(await autoRes.json());
        }

        setRequests(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error pulling real data aggregates:', error);
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [API_URL, activeVehicleId, user]);

  const handleResetVehicle = async () => {
    if (window.confirm(`Are you sure you want to permanently delete all trip history and reset total distance for vehicle ${activeLicensePlate || vehicleData?.vehicle?.license_plate}?`)) {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/${activeVehicleId}/reset`, { method: 'POST' });
        if (res.ok) {
          toast.success('Vehicle data reset successfully.');
          // Refetch data
          const vRes = await fetch(`${API_URL}/api/vehicles/${activeVehicleId}/reports`);
          if (vRes.ok) {
              const vData = await vRes.json();
              setVehicleData(vData);
          }
        } else {
          toast.error('Failed to reset vehicle data.');
        }
      } catch (error) {
        console.error('Error resetting vehicle:', error);
        toast.error('An error occurred while resetting the vehicle data.');
      }
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      let dId = null;
      if (user.role === 'DRIVER') {
          const res = await fetch(`${API_URL}/api/drivers`);
          const data = await res.json();
          const me = Array.isArray(data) ? data.find(d => String(d.phone_number) === String(user.phone_number) && String(d.first_name).toLowerCase() === String(user.first_name).toLowerCase()) : null;
          if (me) dId = me.id;
      }
      
      const res = await fetch(`${API_URL}/api/vehicles/${activeVehicleId}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: dId,
          liters_added: fuelForm.liters_added,
          token_date: fuelForm.token_date
        })
      });
      if (res.ok) {
        setShowFuelModal(false);
        setFuelForm({ liters_added: '', token_date: new Date().toISOString().split('T')[0] });
        const vRes = await fetch(`${API_URL}/api/vehicles/${activeVehicleId}/reports`);
        if (vRes.ok) {
            const vData = await vRes.json();
            setVehicleData(vData);
        }
        toast.success("Fuel token logged successfully!");
      } else {
        toast.error("Failed to log fuel purchase.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while logging fuel.");
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      let dId = null;
      if (user.role === 'DRIVER') {
          const res = await fetch(`${API_URL}/api/drivers`);
          const data = await res.json();
          const me = Array.isArray(data) ? data.find(d => String(d.phone_number) === String(user.phone_number) && String(d.first_name).toLowerCase() === String(user.first_name).toLowerCase()) : null;
          if (me) dId = me.id;
      }
      const res = await fetch(`${API_URL}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: activeVehicleId,
          reported_by_driver_id: dId,
          service_type: issueForm.service_type,
          description: issueForm.description,
          scheduled_date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShowIssueModal(false);
        setIssueForm({ service_type: 'Other/Mechanical Issue', description: '' });
        toast.success("Issue reported to admin successfully!");
      } else {
        toast.error("Failed to report issue.");
      }
    } catch (err) { toast.error(err.message); }
  };

  const exportToCSV = () => {
    if (!vehicleData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "VEHICLE SUMMARY\n";
    csvContent += `License Plate,${vehicleData.vehicle?.license_plate || ''}\n`;
    csvContent += `Total Distance,${vehicleData.vehicle?.total_distance || 0} km\n\n`;
    
    csvContent += "FUEL TOKEN LOGS\n";
    csvContent += "Date,Driver,Liters\n";
    vehicleData.fuel_logs?.forEach(f => {
      const dateVal = f.token_date ? new Date(f.token_date).toLocaleDateString() : (f.created_at ? new Date(f.created_at).toLocaleDateString() : '');
      csvContent += `${dateVal},${f.first_name || 'Admin'} ${f.last_name || ''},${f.liters_added || 0}\n`;
    });
    csvContent += "\n";
    
    csvContent += "MAINTENANCE LOGS (COMPLETED)\n";
    csvContent += "Date,Service,Cost,Notes\n";
    vehicleData.maintenance_logs?.filter(m => m.status === 'COMPLETED').forEach(m => {
      const notes = m.mechanic_notes ? m.mechanic_notes.replace(/"/g, '""') : '';
      csvContent += `${m.completed_date ? new Date(m.completed_date).toLocaleDateString() : ''},${m.service_type},${m.cost || 0},"${notes}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vehicle_Report_${vehicleData.vehicle?.license_plate || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-5 text-center text-muted">Calculating real database analytics indices...</div>;

  if (activeVehicleId && vehicleData) {
      const { vehicle, trips, fuel_logs, maintenance_logs } = vehicleData;
      const totalCalculatedFuel = trips?.reduce((acc, t) => acc + (t.petrol_consumed || 0), 0) || 0;
      const totalPurchasedFuel = fuel_logs?.reduce((acc, f) => acc + (f.liters_added || 0), 0) || 0;
      const totalMaintenanceCost = maintenance_logs?.filter(m => m.status === 'COMPLETED').reduce((acc, m) => acc + (m.cost || 0), 0) || 0;
      const tco = totalMaintenanceCost;
      const variance = totalPurchasedFuel - totalCalculatedFuel;

      return (
         <div className="card p-4 shadow-sm border-0 rounded-3 mt-2">
           <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
             <div>
               <h3 className="fw-bold text-primary mb-1">Vehicle Report: {activeLicensePlate || vehicle?.license_plate}</h3>
               <p className="text-muted mb-0">Integrated Trip & Fuel Transparency Hub.</p>
             </div>
             <div className="d-flex gap-2">
                 <button className="btn btn-outline-primary d-flex align-items-center gap-1 fw-bold" onClick={exportToCSV}>
                     <Download size={18} /> Export CSV
                 </button>
                 {user?.role === 'DRIVER' && (
                     <button className="btn btn-warning text-dark d-flex align-items-center gap-1 fw-bold" onClick={() => setShowIssueModal(true)}>
                         <AlertTriangle size={18} /> Report Issue
                     </button>
                 )}
                 <button className="btn btn-success" onClick={() => setShowFuelModal(true)}>Log Fuel Token</button>
                 {user?.role !== 'DRIVER' && (
                     <>
                         <button className="btn btn-danger" onClick={handleResetVehicle}>Reset Data</button>
                         <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Back to Fleet</button>
                     </>
                 )}
             </div>
           </div>
           
           <div className="row g-4 mb-4">
               <div className="col-md-3">
                   <div className="p-3 border rounded bg-light text-center">
                       <h6 className="text-muted">Total Distance</h6>
                       <h3 className="text-primary">{vehicle?.total_distance ? vehicle.total_distance.toFixed(2) : '0.00'} km</h3>
                   </div>
               </div>
               <div className="col-md-3">
                   <div className="p-3 border rounded bg-light text-center">
                       <h6 className="text-muted">Calculated Burn (Trips)</h6>
                       <h3 className="text-danger">{totalCalculatedFuel.toFixed(2)} L</h3>
                   </div>
               </div>
               <div className="col-md-3">
                   <div className="p-3 border rounded bg-light text-center">
                       <h6 className="text-muted">Purchased Fuel (Logs)</h6>
                       <h3 className="text-success">{totalPurchasedFuel.toFixed(2)} L</h3>
                   </div>
               </div>
               <div className="col-md-3">
                   <div className="p-3 border rounded text-center text-white" style={{ backgroundColor: Math.abs(variance) > 10 ? '#dc3545' : '#198754' }}>
                       <h6 className="text-white opacity-75">Fuel Variance</h6>
                       <h3 className="mb-0">{variance > 0 ? '+' : ''}{variance.toFixed(2)} L</h3>
                       <small className="opacity-75">{Math.abs(variance) > 10 ? 'High Discrepancy' : 'Normal Range'}</small>
                   </div>
               </div>
               <div className="col-md-12 mt-3">
                   <div className="p-3 border rounded bg-dark text-white text-center">
                       <h6 className="text-white opacity-75">Total Cost of Ownership (Maintenance Only)</h6>
                       <h2 className="mb-0 text-warning">Rs. {tco.toFixed(2)}</h2>
                       <small className="opacity-75">Maintenance: Rs. {totalMaintenanceCost.toFixed(2)}</small>
                   </div>
               </div>
           </div>

           <div className="row g-4">
               <div className="col-lg-6">
                   <h6 className="fw-bold mb-3 text-secondary">Automated Trip History</h6>
                   <div className="table-responsive border rounded bg-white">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Trip ID</th>
                            <th>Driver</th>
                            <th>Ended At</th>
                            <th>Distance</th>
                            <th>Petrol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips?.map(t => (
                              <tr key={t.id}>
                                  <td>#{t.id}</td>
                                  <td>{t.first_name} {t.last_name}</td>
                                  <td className="small">{t.end_time ? new Date(t.end_time.replace(' ', 'T') + 'Z').toLocaleString() : '-'}</td>
                                  <td>{t.distance_km ? t.distance_km.toFixed(2) : '0.00'} km</td>
                                  <td className="text-danger">{t.petrol_consumed ? t.petrol_consumed.toFixed(2) : '0.00'} L</td>
                              </tr>
                          ))}
                          {(!trips || trips.length === 0) && (
                              <tr><td colSpan="5" className="text-center py-4 text-muted">No completed trips recorded.</td></tr>
                          )}
                        </tbody>
                      </table>
                   </div>
               </div>
               
               <div className="col-lg-6">
                   <h6 className="fw-bold mb-3 text-secondary">Manual Fuel Token Logs</h6>
                   <div className="table-responsive border rounded bg-white">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Token Date</th>
                            <th>Driver</th>
                            <th>Liters Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fuel_logs?.map(f => (
                              <tr key={f.id}>
                                  <td className="small">{f.token_date ? new Date(f.token_date).toLocaleDateString() : (f.created_at ? new Date(f.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : '-')}</td>
                                  <td>{f.first_name ? `${f.first_name} ${f.last_name}` : 'Admin/Unknown'}</td>
                                  <td className="text-success">+{f.liters_added?.toFixed(2)} L</td>
                              </tr>
                          ))}
                          {(!fuel_logs || fuel_logs.length === 0) && (
                              <tr><td colSpan="3" className="text-center py-4 text-muted">No fuel tokens logged yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                   </div>
               </div>
               <div className="col-lg-12">
                   <h6 className="fw-bold mb-3 text-secondary">Maintenance History</h6>
                   <div className="table-responsive border rounded bg-white">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Completed Date</th>
                            <th>Service Type</th>
                            <th>Mechanic Notes</th>
                            <th>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {maintenance_logs?.filter(m => m.status === 'COMPLETED').map(m => (
                              <tr key={m.id}>
                                  <td className="small">{m.completed_date ? new Date(m.completed_date.replace(' ', 'T') + 'Z').toLocaleString() : '-'}</td>
                                  <td>{m.service_type}</td>
                                  <td className="text-muted small">{m.mechanic_notes || '-'}</td>
                                  <td className="text-danger fw-bold">Rs. {m.cost?.toFixed(2)}</td>
                              </tr>
                          ))}
                          {(!maintenance_logs || maintenance_logs.filter(m => m.status === 'COMPLETED').length === 0) && (
                              <tr><td colSpan="4" className="text-center py-4 text-muted">No completed maintenance records.</td></tr>
                          )}
                        </tbody>
                      </table>
                   </div>
               </div>
           </div>

           {showFuelModal && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Log Fuel Token</h5>
                      <button type="button" className="btn-close" onClick={() => setShowFuelModal(false)}></button>
                    </div>
                    <form onSubmit={handleFuelSubmit}>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label text-muted">Liters Added</label>
                          <input type="number" step="0.01" className="form-control" value={fuelForm.liters_added} onChange={e => setFuelForm({...fuelForm, liters_added: e.target.value})} placeholder="e.g. 20" required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted">Token Date</label>
                          <input type="date" className="form-control" value={fuelForm.token_date} onChange={e => setFuelForm({...fuelForm, token_date: e.target.value})} required />
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-success">Save Log</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
           )}

           {showIssueModal && (
             <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
               <div className="modal-dialog modal-dialog-centered">
                 <div className="modal-content border-warning">
                   <div className="modal-header bg-warning bg-opacity-10 text-warning-emphasis border-warning">
                     <h5 className="modal-title"><AlertTriangle size={20} className="me-2"/>Report Mechanical Issue</h5>
                     <button type="button" className="btn-close" onClick={() => setShowIssueModal(false)}></button>
                   </div>
                   <form onSubmit={handleIssueSubmit}>
                     <div className="modal-body">
                       <div className="alert alert-warning small border-0 mb-3">
                         This will alert the Branch Admin that vehicle {activeLicensePlate || vehicle?.license_plate} requires maintenance.
                       </div>
                       <div className="mb-3">
                         <label className="form-label text-muted">Issue Category</label>
                         <select className="form-select" required value={issueForm.service_type} onChange={e => setIssueForm({...issueForm, service_type: e.target.value})}>
                           <option>Other/Mechanical Issue</option>
                           <option>Brake Problems</option>
                           <option>Engine Noise/Warning Light</option>
                           <option>Tire Damage / Low Pressure</option>
                           <option>Body Damage</option>
                           <option>Fluid Leak</option>
                         </select>
                       </div>
                       <div className="mb-3">
                         <label className="form-label text-muted">Detailed Description</label>
                         <textarea className="form-control" rows="3" required placeholder="What is wrong with the vehicle?" value={issueForm.description} onChange={e => setIssueForm({...issueForm, description: e.target.value})}></textarea>
                       </div>
                     </div>
                     <div className="modal-footer border-top-0">
                       <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
                       <button type="submit" className="btn btn-warning">Submit Report</button>
                     </div>
                   </form>
                 </div>
               </div>
             </div>
           )}
         </div>
      );
   }

   if (user?.role === 'DRIVER') {
       return <div className="p-5 text-center text-muted mt-4">No default vehicle assigned to you. Contact your Branch Admin.</div>;
   }

  // Aggregate trip volume purely from active database properties
  const branchMetrics = {};
  const vehicleMetrics = {};

  requests.forEach(r => {
    const bName = r.user_branch || 'Other';
    branchMetrics[bName] = (branchMetrics[bName] || 0) + 1;

    const vName = r.license_plate || 'Unassigned';
    vehicleMetrics[vName] = (vehicleMetrics[vName] || 0) + 1;
  });

  const branchChartData = Object.keys(branchMetrics).map(b => ({ name: b, Trips: branchMetrics[b] }));

  const exportGlobalCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "MONTHLY TRIP VOLUME BY BRANCH\n";
    csvContent += "Branch,Total Trips\n";
    branchChartData.forEach(b => {
      csvContent += `${b.name},${b.Trips}\n`;
    });
    csvContent += "\n";
    
    csvContent += "VEHICLE UTILIZATION SUMMARY\n";
    csvContent += "Vehicle No.,Trips Logged\n";
    Object.keys(vehicleMetrics).forEach(v => {
      csvContent += `${v},${vehicleMetrics[v]}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Global_Fleet_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGlobalPDF = async () => {
    const element = document.getElementById('analytics-dashboard-content');
    if (!element) return;
    try {
      toast.loading("Generating PDF...", { id: 'pdf-toast' });
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(18);
      pdf.text("NTC Fleet System - Automated Analytics Report", 14, 15);
      pdf.setFontSize(11);
      pdf.setTextColor(100);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      
      pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
      pdf.save(`NTC_Fleet_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF Downloaded successfully!", { id: 'pdf-toast' });
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast.error("Failed to generate PDF report.", { id: 'pdf-toast' });
    }
  };

  return (
    <div className="card p-4 shadow-sm border-0 rounded-3 mt-2">
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold text-primary mb-1">Logistics Reports & Analytics</h3>
          <p className="text-muted mb-0">System metrics calculated dynamically from raw transaction logs.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger d-flex align-items-center gap-2 fw-bold" onClick={exportGlobalPDF}>
            <FileText size={18} /> Export PDF
          </button>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2 fw-bold" onClick={exportGlobalCSV}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div id="analytics-dashboard-content" className="p-2">
        <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="p-3 border rounded bg-light">
            <h6 className="fw-bold text-secondary mb-3">Monthly Trip Volume by Branch</h6>
            {branchChartData.length === 0 ? (
              <p className="text-muted small">No trip history records stored yet.</p>
            ) : (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={branchChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#6c757d" fontSize={11} />
                    <YAxis stroke="#6c757d" />
                    <Tooltip />
                    <Bar dataKey="Trips" fill="#0d6efd" radius={[4, 4, 0, 0]} name="Total Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="p-3 border rounded bg-light h-100">
            <h6 className="fw-bold text-secondary mb-3">Vehicle Utilization Summary</h6>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="small text-muted">
                    <th>Vehicle No.</th>
                    <th className="text-end">Trips Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(vehicleMetrics).map((vehicle, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-dark">{vehicle}</td>
                      <td className="text-end fw-bold text-primary">{vehicleMetrics[vehicle]}</td>
                    </tr>
                  ))}
                  {Object.keys(vehicleMetrics).length === 0 && (
                    <tr><td colSpan="2" className="text-center text-muted small py-3">No active deployment profiles tracked.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-12 mt-4">
          <div className="p-3 border rounded bg-light">
            <h6 className="fw-bold text-secondary mb-3">Daily Automated Aggregates (System Cron)</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>Report Date</th>
                    <th>Total Trips</th>
                    <th>Total Fuel Consumed</th>
                    <th>Total Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {automatedReports.map(ar => (
                    <tr key={ar.id}>
                      <td className="fw-bold">{new Date(ar.report_date).toLocaleDateString()}</td>
                      <td>{ar.total_trips}</td>
                      <td className="text-danger">{ar.total_fuel_consumed?.toFixed(2)} L</td>
                      <td>{ar.total_distance?.toFixed(2)} km</td>
                    </tr>
                  ))}
                  {automatedReports.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted py-4">No automated daily reports generated yet. The CRON job runs at midnight.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;