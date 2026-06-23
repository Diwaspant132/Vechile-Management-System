import React from 'react';
import { Menu, User, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <button onClick={toggleSidebar} className="toggle-sidebar-btn">
          <Menu size={24} />
        </button>
        <h5 className="mb-0 text-primary fw-bold d-none d-sm-block" style={{ color: 'var(--ntc-blue)' }}>
          Nepal Telecom
        </h5>
      </div>

      <div className="nav-right">
        <div className="d-none d-md-inline-block me-3">
          <span className="user-role-badge badge bg-primary bg-opacity-10 text-primary border border-primary-subtle py-2 px-3">
            {user?.role?.replace('_', ' ') || 'No Role'}
          </span>
        </div>
        
        {/* Theme Toggle */}
        <div className="dropdown">
          <button 
            className="btn btn-link text-dark text-decoration-none p-2" 
            type="button" 
            id="themeDropdown" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            {theme === 'light' ? <Sun size={20} className="text-warning" /> : 
             theme === 'dark' ? <Moon size={20} className="text-primary" /> : 
             <Monitor size={20} className="text-secondary" />}
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="themeDropdown">
            <li>
              <button className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                <Sun size={16} /> Light
              </button>
            </li>
            <li>
              <button className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                <Moon size={16} /> Dark
              </button>
            </li>
            <li>
              <button className={`dropdown-item d-flex align-items-center gap-2 ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}>
                <Monitor size={16} /> System
              </button>
            </li>
          </ul>
        </div>

        <NotificationPanel />

        <div className="dropdown">
          <button 
            className="btn btn-link text-dark dropdown-toggle d-flex align-items-center gap-2 text-decoration-none" 
            type="button" 
            id="userDropdown" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <div className="bg-light rounded-circle p-1">
              <User size={20} className="text-primary" />
            </div>
            <span className="d-none d-sm-inline">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : 'Unknown'}
            </span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="userDropdown">
            <li>
              <button className="dropdown-item" onClick={() => navigate('/dashboard/settings')}>
                Profile Settings
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;