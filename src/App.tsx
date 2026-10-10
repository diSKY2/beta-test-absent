/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import Monitoring from './pages/admin/Monitoring';
import Rostering from './pages/admin/Rostering';
import Approvals from './pages/admin/Approvals';
import Payroll from './pages/admin/Payroll';
import OrgStructure from './pages/admin/OrgStructure';
import Geofencing from './pages/admin/Geofencing';
import CMS from './pages/admin/CMS';
import HRAdminManager from './pages/admin/HRAdminManager';
import HRRegistrations from './pages/admin/HRRegistrations';
import WorkReports from './pages/admin/WorkReports';
import EmployeePortal from './pages/EmployeePortal';
import RegisterPage from './pages/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isKawasdal, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center p-4">Loading...</div>;
  if (!user || (!isAdmin && !isKawasdal)) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center p-4">Loading...</div>;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}

export default function App() {
  const isMobileApp = (window as any).Capacitor?.isNativePlatform();

  if (isMobileApp) {
    return (
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<EmployeePortal />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pegawai" element={<EmployeePortal />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Monitoring />} />
              <Route path="rostering" element={<AdminOnlyRoute><Rostering /></AdminOnlyRoute>} />
              <Route path="approvals" element={<AdminOnlyRoute><Approvals /></AdminOnlyRoute>} />
              <Route path="payroll" element={<AdminOnlyRoute><Payroll /></AdminOnlyRoute>} />
              <Route path="organization" element={<AdminOnlyRoute><OrgStructure /></AdminOnlyRoute>} />
              <Route path="geofencing" element={<AdminOnlyRoute><Geofencing /></AdminOnlyRoute>} />
              <Route path="reports" element={<AdminOnlyRoute><WorkReports /></AdminOnlyRoute>} />
              <Route path="hr-users" element={<AdminOnlyRoute><HRAdminManager /></AdminOnlyRoute>} />
              <Route path="registrations" element={<AdminOnlyRoute><HRRegistrations /></AdminOnlyRoute>} />
              <Route path="settings" element={<AdminOnlyRoute><CMS /></AdminOnlyRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

