import React, { useState, useEffect, useRef } from 'react';
import { User, FileText, Clock, Truck, Fuel, Play, Square, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [driverDetails, setDriverDetails] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      const drvRes = await fetch(`${API_URL}/api/drivers`);
      const drvData = await drvRes.json();
      
      const myProfile = Array.isArray(drvData) 
        ? drvData.find(d => String(d.phone_number) === String(user?.phone_number)) 
        : null;
      
      setDriverDetails(myProfile);

      if (myProfile) {
        const vehRes = await fetch(`${API_URL}/api/driver/my-vehicle/${myProfile.id}`);
        if (vehRes.ok) {
          const vehData = await vehRes.json();
          setVehicle(vehData.license_plate ? vehData : null);
        }
      }
      setLoading(false);
    } catch (err) { 
      console.error("Dashboard loading error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file || !driverDetails) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('license_document', file);

    try {
      const response = await fetch(`${API_URL}/api/drivers/${driverDetails.id}/document`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchData(); 
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const errorData = await response.json();
        alert("Upload failed: " + errorData.error);
      }
    } catch (e) {
      alert("Error uploading document: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const customStyles = `
    .premium-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 1.25rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .premium-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
    }
    .gradient-header {
      background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gradient-bg {
      background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
      min-height: 100vh;
    }
    .glass-badge {
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255,255,255,0.5);
    }
  `;

  if (loading) return <div className="p-4 text-center text-muted">Authenticating dashboard securely...</div>;

  return (
    <div className="container-fluid p-4 gradient-bg">
      <style>{customStyles}</style>
      
      <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-10">
        <h2 className="fw-bolder gradient-header mb-0 d-flex align-items-center">
          <User className="me-3" size={36} color="#0d6efd" /> 
          Driver Command Center
        </h2>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card p-4 shadow-sm premium-card h-100">
            <div className="text-center mb-4 pt-2">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3 position-relative shadow-sm">
                <User size={48} className="text-primary"/>
                <span className={`position-absolute top-0 start-100 translate-middle p-2 border border-light rounded-circle ${driverDetails?.status === 'ON TRIP' ? 'bg-info' : 'bg-success'}`} style={{ width: '18px', height: '18px' }}>
                  <span className="visually-hidden">New alerts</span>
                </span>
              </div>
              <h4 className="fw-bolder text-dark mb-1">{user?.first_name} {user?.last_name}</h4>
              <span className="text-muted font-monospace bg-light px-3 py-1 rounded-pill border">ID: #{driverDetails?.id}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4 border shadow-sm">
              <span className="text-secondary fw-bold">Current Status</span>
              <span className={`badge rounded-pill px-4 py-2 shadow-sm ${driverDetails?.status === 'ON TRIP' ? 'bg-info text-dark' : 'bg-success'}`}>
                {driverDetails?.status || 'AVAILABLE'}
              </span>
            </div>

            <div className="border-top pt-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <Truck size={20} className="me-2 text-primary"/> Assigned Vehicle
              </h6>
              
              {(!vehicle && !driverDetails?.default_vehicle_plate) ? (
                <div className="alert alert-secondary border-0 bg-secondary bg-opacity-10 text-center py-4 rounded-4">
                  <Truck size={36} className="text-secondary mb-2 opacity-50" />
                  <p className="mb-0 text-muted small fw-medium">No vehicle assigned to you at the moment.</p>
                </div>
              ) : (
                <div className="bg-white border rounded-4 p-4 shadow-sm position-relative overflow-hidden">
                  <div className="position-absolute top-0 end-0 bg-primary opacity-10" style={{ width: '100px', height: '100px', borderRadius: '0 0 0 100%' }}></div>
                  <div className="d-flex flex-column gap-2">
                    {vehicle ? (
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="badge bg-success mb-2">Active Trip Assignment</span><br/>
                                <span className="badge bg-dark px-3 py-2 fs-6 font-monospace shadow-sm rounded-pill">{vehicle.license_plate}</span>
                            </div>
                            <span className="text-primary fw-bolder fs-5">{vehicle.model}</span>
                        </div>
                    ) : (
                        <div className="d-flex justify-content-between align-items-center opacity-75">
                            <div>
                                <span className="badge bg-secondary mb-2">Default Vehicle</span><br/>
                                <span className="badge bg-dark px-3 py-2 fs-6 font-monospace shadow-sm rounded-pill">{driverDetails.default_vehicle_plate}</span>
                            </div>
                            <span className="text-primary fw-bolder fs-5">{driverDetails.default_vehicle_model}</span>
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
           <div className="card p-5 shadow-sm premium-card h-100 d-flex flex-column">
             <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
               <div>
                 <h4 className="fw-bolder text-dark mb-1 d-flex align-items-center"><FileText size={28} className="me-2 text-primary"/> Document Vault</h4>
                 <p className="text-muted small fw-medium mb-0">Securely manage your verification documents and licenses.</p>
               </div>
               {driverDetails?.license_document_url && (
                 <span className="badge bg-success bg-opacity-10 text-success border border-success px-4 py-2 fs-6 rounded-pill shadow-sm d-flex align-items-center">
                   <CheckCircle size={18} className="me-2"/> Verified Upload
                 </span>
               )}
             </div>
             
             <div className="flex-grow-1 d-flex flex-column justify-content-center">
               {driverDetails?.license_document_url ? (
                 <div className="bg-success bg-opacity-10 p-5 rounded-4 border border-success border-opacity-25 text-center shadow-sm transition-all">
                   <div className="bg-white rounded-circle d-inline-flex p-4 shadow-sm mb-3 text-success">
                     <CheckCircle size={48} />
                   </div>
                   <h4 className="text-success fw-bolder mb-3">Your License is securely stored!</h4>
                   <p className="text-muted px-md-5 mb-4 fs-6">Your documents are visible to the Branch Admin for approval and deployment. You're ready to hit the road!</p>
                   
                   <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4">
                     <a href={`${API_URL}${driverDetails.license_document_url}`} target="_blank" rel="noreferrer" className="btn btn-success btn-lg px-4 rounded-pill fw-bold shadow text-nowrap d-flex align-items-center">
                       <FileText size={20} className="me-2" /> View Uploaded Document
                     </a>
                     
                     <div className="bg-white p-2 rounded-pill shadow-sm border d-flex align-items-center w-100" style={{ maxWidth: '350px' }}>
                       <input type="file" className="form-control form-control-sm border-0 bg-transparent text-muted flex-grow-1 ms-2" ref={fileInputRef} accept="image/*,.pdf" />
                       <button className="btn btn-outline-secondary rounded-pill px-3 fw-bold" onClick={handleFileUpload} disabled={uploading}>
                         {uploading ? 'Updating...' : 'Update'}
                       </button>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-5">
                   <div className="bg-light rounded-circle d-inline-flex p-5 shadow-sm mb-4 border border-white border-4">
                     <FileText size={56} className="text-primary opacity-50"/>
                   </div>
                   <h4 className="fw-bolder mb-3 text-dark">Upload Your Driver's License</h4>
                   <p className="text-muted mx-auto mb-4 fs-6" style={{ maxWidth: '550px', lineHeight: '1.6' }}>
                     Please provide a high-resolution, legible photo or PDF of your official driver's license. This is required for Branch Admins to assign you to active routes.
                   </p>
                   
                   <div className="d-inline-flex flex-column align-items-center bg-white p-4 rounded-4 border shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
                     <input 
                       type="file" 
                       className="form-control form-control-lg mb-4 shadow-sm border-primary border-opacity-25" 
                       ref={fileInputRef}
                       accept="image/*,.pdf"
                     />
                     <button 
                       className="btn btn-primary btn-lg w-100 rounded-pill fw-bolder shadow-lg d-flex align-items-center justify-content-center" 
                       onClick={handleFileUpload}
                       disabled={uploading}
                       style={{ transition: 'all 0.2s ease', transform: uploading ? 'scale(0.98)' : 'scale(1)' }}
                     >
                       {uploading ? (
                         <span className="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>
                       ) : <Play size={22} className="me-2"/>}
                       {uploading ? 'Uploading Securely...' : 'Begin Secure Upload'}
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;