import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CarFront, 
  ClipboardList, 
  History, 
  Users, 
  Settings as SettingsIcon,
  Car,
  FileBarChart,
  MapPin,
  Wrench,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    // Super Admin Dashboard
    { path: '/dashboard/super-dashboard', name: 'Global Dashboard', icon: <LayoutDashboard />, roles: ['SUPER_ADMIN'] },
    // Branch Admin Dashboard
    { path: '/dashboard/branch-dashboard', name: 'Branch Dashboard', icon: <LayoutDashboard />, roles: ['BRANCH_ADMIN'] },
    // Employee Dashboard
    { path: '/dashboard/employee-dashboard', name: 'Employee Portal', icon: <LayoutDashboard />, roles: ['EMPLOYEE'] },
    
    { path: '/dashboard/request-vehicle', name: 'Request Vehicle', icon: <CarFront />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'TRANSPORT_OFFICER'] },
    
    { path: '/dashboard/my-requests', name: 'My Requests', icon: <History />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'] },
    
    // Vehicles mapping
    // SUPER_ADMIN gets 'All Vehicles', others get 'Branch Vehicles' only if assigned
    { path: '/dashboard/vehicles', name: 'All Vehicles', icon: <Car />, roles: ['SUPER_ADMIN'] },
    { path: '/dashboard/branch-vehicles', name: 'Branch Vehicles', icon: <Car />, roles: ['BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    
    { path: '/dashboard/tracking', name: 'Live Tracking', icon: <MapPin />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/admin-requests', name: 'Request Management', icon: <ClipboardList />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    
    // Driver Command Console
    { path: '/dashboard/driver-dashboard', name: 'Driver Command Console', icon: <Activity />, roles: ['DRIVER'] },
    { path: '/dashboard/trip-management', name: 'Trip Management', icon: <MapPin />, roles: ['DRIVER'] },
    { path: '/dashboard/reports', name: 'My Vehicle Report', icon: <FileBarChart />, roles: ['DRIVER'] },
    
    { path: '/dashboard/driver-management', name: 'Driver Management', icon: <Users />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/employee-management', name: 'Employee Directory', icon: <Users />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN'] },
    { path: '/dashboard/reports', name: 'Reports & Analytics', icon: <FileBarChart />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/maintenance', name: 'Maintenance', icon: <Wrench />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/audit-logs', name: 'Audit Logs', icon: <Activity />, roles: ['SUPER_ADMIN'] },
    
    // Branch Admin Approval
    { path: '/dashboard/user-approvals', name: 'Branch Admin Approval', icon: <Users />, roles: ['SUPER_ADMIN'] },
    
    { path: '/dashboard/settings', name: 'Global Settings', icon: <SettingsIcon />, roles: ['SUPER_ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className={`sidebar ${isOpen ? '' : 'collapsed'} ${isOpen && window.innerWidth <= 768 ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <span className="truncate" title="NTC Fleet System">NTC Fleet System</span>
      </div>
      
      <div className="sidebar-nav">
        {allowedNavItems.map((item, index) => (
          <NavLink 
            key={index}
            to={item.path} 
            className={({ isActive }) => `sidebar-link ${isActive && item.path !== '#' ? 'active' : ''}`}
            onClick={closeMobile}
            end={item.path.includes('dashboard/super-dashboard') || item.path.includes('dashboard/branch-dashboard')}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;