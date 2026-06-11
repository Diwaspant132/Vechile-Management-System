import React from 'react';

const RoleDropdown = ({ value, onChange, error, excludeRoles = [] }) => {
  // Define our dynamic card list mapping values
  const roles = [
    {
      id: 'EMPLOYEE',
      name: 'Employee',
      description: 'Standard staff access',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'DRIVER',
      name: 'Driver',
      description: 'Vehicle operation access',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    },
    {
      id: 'BRANCH_ADMIN', // 🟢 CHANGED: Emits the clean multi-tenant role string to your state handler
      name: 'Branch Admin', // 🟢 RENAMED: Replaced standard "Admin" text layout verbatim
      description: 'Regional station manager', // 🟢 UPDATED: Changed from system administrator descriptions
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  // Helper mock element generator to fake standard synthetic click events cleanly back to Register.jsx
  const handleCardClick = (roleId) => {
    onChange({
      target: {
        name: 'requested_role',
        value: roleId
      }
    });
  };

  const visibleRoles = roles.filter(r => !excludeRoles.includes(r.id));

  return (
    <div className="mb-4">
      <label className="form-label fw-semibold text-dark small mb-2">Requested Role *</label>
      <div className="row g-3">
        {visibleRoles.map((role) => {
          const isSelected = value === role.id;
          return (
            <div className="col-4" key={role.id}>
              <div 
                className={`card p-3 text-center h-100 border-2 transition-all shadow-sm rounded-3 ${
                  isSelected ? 'border-primary bg-light bg-opacity-25' : 'border-light bg-white'
                }`}
                onClick={() => handleCardClick(role.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
              >
                <div className="card-body p-0 d-flex flex-column align-items-center justify-content-center">
                  <div className={`mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                    {role.icon}
                  </div>
                  <h6 className="fw-bold mb-1 text-dark text-nowrap" style={{ fontSize: '0.95rem' }}>
                    {role.name}
                  </h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>
                    {role.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && <div className="text-danger small mt-1 font-monospace">{error}</div>}
    </div>
  );
};

export default RoleDropdown;