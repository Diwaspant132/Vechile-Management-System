import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Settings = () => {
  const { user, updateSessionUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');

  const [systemPrefs, setSystemPrefs] = useState({
    require_manager_approval: true,
    auto_assign_drivers: false,
    maintenance_alerts: true
  });

  const [notifRules, setNotifRules] = useState({
    email_notif: true,
    sms_notif: false,
    push_notif: true
  });

  useEffect(() => {
    if (activeTab === 'system') {
      fetch(`${API_URL}/api/settings/system`)
        .then(res => res.json())
        .then(data => setSystemPrefs({
           require_manager_approval: Boolean(data.require_manager_approval ?? 1),
           auto_assign_drivers: Boolean(data.auto_assign_drivers ?? 0),
           maintenance_alerts: Boolean(data.maintenance_alerts ?? 1)
        })).catch(console.error);
    } else if (activeTab === 'notifications' && user?.id) {
      fetch(`${API_URL}/api/settings/notifications/${user.id}`)
        .then(res => res.json())
        .then(data => setNotifRules({
           email_notif: Boolean(data.email_notif ?? 1),
           sms_notif: Boolean(data.sms_notif ?? 0),
           push_notif: Boolean(data.push_notif ?? 1)
        })).catch(console.error);
    }
  }, [activeTab, API_URL, user]);

  const showSuccess = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone_number: phone })
      });
      const updatedUser = await res.json();
      if (updateSessionUser) updateSessionUser(updatedUser);
      showSuccess();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/settings/system`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemPrefs)
      });
      showSuccess();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleNotifSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/settings/notifications/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifRules)
      });
      showSuccess();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="page-title d-flex align-items-center gap-2 mb-4">
        <SettingsIcon className="text-primary" style={{ color: 'var(--ntc-blue)' }} /> 
        System Settings
      </h2>

      {showSaved && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
          <Check size={18} />
          <div>Settings have been successfully updated.</div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="list-group list-group-flush p-2">
              <button 
                className={`list-group-item list-group-item-action border-0 rounded mb-1 d-flex align-items-center gap-2 ${activeTab === 'profile' ? 'bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={activeTab === 'profile' ? { backgroundColor: 'var(--ntc-blue)' } : {}}
              >
                <User size={18} /> Profile Info
              </button>
              <button 
                className={`list-group-item list-group-item-action border-0 rounded mb-1 d-flex align-items-center gap-2 ${activeTab === 'system' ? 'bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('system')}
                style={activeTab === 'system' ? { backgroundColor: 'var(--ntc-blue)' } : {}}
              >
                <Shield size={18} /> System Preferences
              </button>
              <button 
                className={`list-group-item list-group-item-action border-0 rounded d-flex align-items-center gap-2 ${activeTab === 'notifications' ? 'bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('notifications')}
                style={activeTab === 'notifications' ? { backgroundColor: 'var(--ntc-blue)' } : {}}
              >
                <Bell size={18} /> Notification Rules
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-9">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="card-body p-4 p-md-5">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h4 className="mb-4 fw-bold">Profile Information</h4>
                  <form onSubmit={handleProfileSave}>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label text-muted fw-medium">First Name</label>
                        <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted fw-medium">Last Name</label>
                        <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted fw-medium">Email Address</label>
                        <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted fw-medium">Phone Number</label>
                        <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted fw-medium">Role / Access Level</label>
                        <input type="text" className="form-control" value={user?.role?.replace('_', ' ') || 'Unknown'} disabled />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-top">
                      <button type="submit" className="btn btn-ntc" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div>
                  <h4 className="mb-4 fw-bold">System Preferences</h4>
                  <form onSubmit={handleSystemSave}>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                        <div>
                          <h6 className="mb-1 fw-bold">Require Manager Approval</h6>
                          <small className="text-muted">All vehicle requests must be approved by a department manager before reaching admins.</small>
                        </div>
                        <div className="form-check form-switch fs-4">
                          <input className="form-check-input" type="checkbox" role="switch" checked={systemPrefs.require_manager_approval} onChange={e => setSystemPrefs({...systemPrefs, require_manager_approval: e.target.checked})} />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                        <div>
                          <h6 className="mb-1 fw-bold">Auto-Assign Available Drivers</h6>
                          <small className="text-muted">Automatically assign available drivers to approved trips.</small>
                        </div>
                        <div className="form-check form-switch fs-4">
                          <input className="form-check-input" type="checkbox" role="switch" checked={systemPrefs.auto_assign_drivers} onChange={e => setSystemPrefs({...systemPrefs, auto_assign_drivers: e.target.checked})} />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                        <div>
                          <h6 className="mb-1 fw-bold">Maintenance Alerts</h6>
                          <small className="text-muted">Lock vehicles automatically if maintenance date is passed.</small>
                        </div>
                        <div className="form-check form-switch fs-4">
                          <input className="form-check-input" type="checkbox" role="switch" checked={systemPrefs.maintenance_alerts} onChange={e => setSystemPrefs({...systemPrefs, maintenance_alerts: e.target.checked})} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-top">
                      <button type="submit" className="btn btn-ntc" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h4 className="mb-4 fw-bold">Notification Rules</h4>
                  <p className="text-muted mb-4">Choose how and when you want to receive system alerts.</p>
                  
                  <form onSubmit={handleNotifSave}>
                    <div className="form-check mb-3">
                      <input className="form-check-input" type="checkbox" id="emailNotif" checked={notifRules.email_notif} onChange={e => setNotifRules({...notifRules, email_notif: e.target.checked})} />
                      <label className="form-check-label fw-medium" htmlFor="emailNotif">
                        Email Notifications
                      </label>
                      <div className="text-muted small">Receive daily summaries and critical alerts via email.</div>
                    </div>
                    <div className="form-check mb-3">
                      <input className="form-check-input" type="checkbox" id="smsNotif" checked={notifRules.sms_notif} onChange={e => setNotifRules({...notifRules, sms_notif: e.target.checked})} />
                      <label className="form-check-label fw-medium" htmlFor="smsNotif">
                        SMS Notifications
                      </label>
                      <div className="text-muted small">Receive immediate text messages for new vehicle requests.</div>
                    </div>
                    <div className="form-check mb-3">
                      <input className="form-check-input" type="checkbox" id="pushNotif" checked={notifRules.push_notif} onChange={e => setNotifRules({...notifRules, push_notif: e.target.checked})} />
                      <label className="form-check-label fw-medium" htmlFor="pushNotif">
                        In-App Dashboard Alerts
                      </label>
                      <div className="text-muted small">Show notification bubble in the top navigation bar.</div>
                    </div>
                    <div className="mt-4 pt-3 border-top">
                      <button type="submit" className="btn btn-ntc" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Rules'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
