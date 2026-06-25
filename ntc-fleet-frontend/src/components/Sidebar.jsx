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
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, closeMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';
  const { t } = useTranslation();

  const navItems = [
    // Super Admin Dashboard
    { path: '/dashboard/super-dashboard', name: t('global_dashboard'), icon: <LayoutDashboard />, roles: ['SUPER_ADMIN'] },
    // Branch Admin Dashboard
    { path: '/dashboard/branch-dashboard', name: t('branch_dashboard'), icon: <LayoutDashboard />, roles: ['BRANCH_ADMIN'] },
    // Employee Dashboard
    { path: '/dashboard/employee-dashboard', name: t('employee_portal'), icon: <LayoutDashboard />, roles: ['EMPLOYEE'] },
    
    { path: '/dashboard/request-vehicle', name: t('request_vehicle'), icon: <CarFront />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'TRANSPORT_OFFICER'] },
    
    { path: '/dashboard/my-requests', name: t('my_requests'), icon: <History />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'] },
    
    // Vehicles mapping
    // SUPER_ADMIN gets 'All Vehicles', others get 'Branch Vehicles' only if assigned
    { path: '/dashboard/vehicles', name: t('all_vehicles'), icon: <Car />, roles: ['SUPER_ADMIN'] },
    { path: '/dashboard/transfer-requests', name: t('transfer_requests'), icon: <CarFront />, roles: ['SUPER_ADMIN'] },
    { path: '/dashboard/branch-vehicles', name: t('branch_vehicles'), icon: <Car />, roles: ['BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    
    { path: '/dashboard/tracking', name: t('live_tracking'), icon: <MapPin />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/admin-requests', name: t('request_management'), icon: <ClipboardList />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    
    // Driver Command Console
    { path: '/dashboard/driver-dashboard', name: t('driver_command_console'), icon: <Activity />, roles: ['DRIVER'] },
    { path: '/dashboard/trip-management', name: t('trip_management'), icon: <MapPin />, roles: ['DRIVER'] },
    { path: '/dashboard/reports', name: t('my_vehicle_report'), icon: <FileBarChart />, roles: ['DRIVER'] },
    
    { path: '/dashboard/driver-management', name: t('driver_management'), icon: <Users />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/employee-management', name: t('employee_directory'), icon: <Users />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN'] },
    { path: '/dashboard/reports', name: t('reports_analytics'), icon: <FileBarChart />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/maintenance', name: t('maintenance'), icon: <Wrench />, roles: ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER'] },
    { path: '/dashboard/audit-logs', name: t('audit_logs'), icon: <Activity />, roles: ['SUPER_ADMIN'] },
    
    // Branch Admin Approval
    { path: '/dashboard/user-approvals', name: t('branch_admin_approval'), icon: <Users />, roles: ['SUPER_ADMIN'] },
    
    { path: '/dashboard/settings', name: t('global_settings'), icon: <SettingsIcon />, roles: ['SUPER_ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className={`sidebar ${isOpen ? '' : 'collapsed'} ${isOpen && window.innerWidth <= 768 ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <span className="truncate" title={t('ntc_fleet_system')}>{t('ntc_fleet_system')}</span>
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