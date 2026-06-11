import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard Layout & Pages
import MainLayout from './components/MainLayout';
import SuperDashboard from './pages/superAdmin/SuperDashboard';
import BranchDashboard from './pages/branchAdmin/BranchDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import LiveTracking from './pages/tracking/LiveTracking';
import VehicleRequest from './pages/requests/VehicleRequest';
import VehicleAvailability from './pages/vehicles/VehicleAvailability';
import BranchVehicles from './pages/admin/BranchVehicles'; // 🟢 IMPORTED
import RequestManagement from './pages/admin/RequestManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import DriverDashboard from './pages/drivers/DriverDashboard';
import TripManagement from './pages/drivers/TripManagement';
import DriverManagement from './pages/drivers/DriverManagement';
import ReportsAnalytics from './pages/dashboard/ReportsAnalytics';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import Notifications from './pages/notifications/Notifications';
import AuditLogs from './pages/audit/AuditLogs';
import Settings from './pages/dashboard/Settings';
import Unauthorized from './pages/dashboard/Unauthorized';
import UserApprovals from './pages/UserApprovals';
import MyRequests from './pages/MyRequests';
import NotFound from './pages/dashboard/NotFound';

// Intelligent Redirect Component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return null; // Wait for Auth context

  if (user.role === 'DRIVER') return <Navigate to="/dashboard/driver-dashboard" replace />;
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/dashboard/super-dashboard" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/dashboard/employee-dashboard" replace />;
  
  return <Navigate to="/dashboard/branch-dashboard" replace />;
};

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <BranchProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
          <Router>
            <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard Routes - Protected */}
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                
                {/* Dynamic index redirect based on role */}
                <Route index element={<DashboardRedirect />} />

                <Route path="super-dashboard" element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperDashboard />
                  </ProtectedRoute>
                } />

                <Route path="branch-dashboard" element={
                  <ProtectedRoute allowedRoles={['BRANCH_ADMIN']}>
                    <BranchDashboard />
                  </ProtectedRoute>
                } />

                <Route path="employee-dashboard" element={
                  <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } />

                <Route path="unauthorized" element={<Unauthorized />} />
                
                {/* Employee & Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'TRANSPORT_OFFICER']} />}>
                  <Route path="request-vehicle" element={<VehicleRequest />} />
                  <Route path="vehicles" element={<VehicleAvailability />} />
                  <Route path="my-requests" element={<MyRequests />} />
                </Route>

                {/* DRIVER ONLY ROUTE */}
                <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
                  <Route path="driver-dashboard" element={<DriverDashboard />} />
                  <Route path="trip-management" element={<TripManagement />} />
                </Route>

                {/* Branch Admin & Super Admin Management Routes */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER']} />}>
                  <Route path="tracking" element={<LiveTracking />} />
                  <Route path="admin-requests" element={<RequestManagement />} />
                  <Route path="branch-vehicles" element={<BranchVehicles />} /> {/* 🟢 ADDED ROUTE */}
                  <Route path="driver-management" element={<DriverManagement />} />
                  <Route path="employee-management" element={<EmployeeManagement />} />
                  <Route path="maintenance" element={<MaintenanceDashboard />} />
                </Route>
                
                {/* Reports Route for Admins and Drivers */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRANCH_ADMIN', 'TRANSPORT_OFFICER', 'DRIVER']} />}>
                  <Route path="reports" element={<ReportsAnalytics />} />
                </Route>
                
                {/* Super Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                  <Route path="settings" element={<Settings />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="user-approvals" element={<UserApprovals />} />
                </Route>

                {/* Common Routes */}
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </BranchProvider>
    </AuthProvider>
    </GlobalErrorBoundary>
  );
}

export default App;