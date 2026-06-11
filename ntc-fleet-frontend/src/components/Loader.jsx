import React from 'react';

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="d-flex justify-content-center align-items-center my-3">
      <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && <span className="ms-2 text-primary fw-medium">{text}</span>}
    </div>
  );
};

export default Loader;
