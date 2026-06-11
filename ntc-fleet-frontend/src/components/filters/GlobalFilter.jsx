import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const GlobalFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  filterOptions, 
  activeFilter, 
  setActiveFilter, 
  placeholder = "Search..." 
}) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4 bg-light p-3 rounded border">
      <div className="d-flex gap-2 w-100 flex-grow-1" style={{ maxWidth: '500px' }}>
        <div className="input-group shadow-sm">
          <span className="input-group-text bg-white border-end-0">
            <Search size={18} className="text-muted" />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 ps-0" 
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="btn bg-white border border-start-0 text-muted" 
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      
      {filterOptions && filterOptions.length > 0 && (
        <div className="d-flex gap-2 align-items-center">
          <Filter size={18} className="text-muted d-none d-md-block" />
          <select 
            className="form-select shadow-sm"
            style={{ minWidth: '180px' }}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {filterOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {activeFilter && (
            <button className="btn btn-outline-secondary btn-sm shadow-sm" onClick={() => setActiveFilter('')}>
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalFilter;
