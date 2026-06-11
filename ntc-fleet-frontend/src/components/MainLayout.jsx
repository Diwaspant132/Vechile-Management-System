import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarMobile = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen && window.innerWidth <= 768 ? 'show' : ''}`}
        onClick={closeSidebarMobile}
      ></div>

      <Sidebar isOpen={sidebarOpen} closeMobile={closeSidebarMobile} />
      
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;