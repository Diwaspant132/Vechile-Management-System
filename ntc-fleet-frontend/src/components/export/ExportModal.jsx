import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';

const ExportModal = ({ show, onClose, title = "Export Report" }) => {
  const [format, setFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // Mock export process
    setTimeout(() => {
      setExporting(false);
      onClose();
      // Dummy download trigger
      alert(`Report exported successfully as ${format.toUpperCase()}`);
    }, 1500);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <Download size={20} className="text-primary" /> {title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body py-4">
              <p className="text-muted mb-4">Select the format you wish to export this data in.</p>
              
              <div className="d-flex gap-3 mb-4">
                <div 
                  className={`export-format-card flex-fill p-3 border rounded text-center cursor-pointer ${format === 'pdf' ? 'border-primary bg-light' : ''}`}
                  onClick={() => setFormat('pdf')}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <FileText size={32} className={format === 'pdf' ? 'text-primary mb-2' : 'text-muted mb-2'} />
                  <div className="fw-medium">PDF Document</div>
                  <small className="text-muted">Best for sharing</small>
                </div>
                
                <div 
                  className={`export-format-card flex-fill p-3 border rounded text-center cursor-pointer ${format === 'csv' ? 'border-success bg-light' : ''}`}
                  onClick={() => setFormat('csv')}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <FileSpreadsheet size={32} className={format === 'csv' ? 'text-success mb-2' : 'text-muted mb-2'} />
                  <div className="fw-medium">CSV / Excel</div>
                  <small className="text-muted">Best for analysis</small>
                </div>
              </div>
              
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button type="button" className="btn btn-light border" onClick={onClose} disabled={exporting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-ntc d-flex align-items-center gap-2" onClick={handleExport} disabled={exporting}>
                  {exporting ? <span className="spinner-border spinner-border-sm"></span> : <Download size={18} />}
                  Export Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportModal;
