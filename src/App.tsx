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
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center p-4">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  
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
              <Route path="rostering" element={<Rostering />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="organization" element={<OrgStructure />} />
              <Route path="geofencing" element={<Geofencing />} />
              <Route path="reports" element={<WorkReports />} />
              <Route path="hr-users" element={<HRAdminManager />} />
              <Route path="registrations" element={<HRRegistrations />} />
              <Route path="settings" element={<CMS />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

