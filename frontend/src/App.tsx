import { Navigate, Route, Routes } from 'react-router-dom';
import { PageState } from './components/common/PageState';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DoctorDashboard } from './features/doctor/DoctorDashboard';
import { PatientDashboard } from './features/patient/PatientDashboard';
import { HomePage } from './features/public/HomePage';

function HomeWrapper() {
  const { user, loading } = useAuth();

  console.log('[HomeWrapper] Usuario:', user);
  console.log('[HomeWrapper] Loading:', loading);

  if (loading) {
    return <PageState message="Cargando..." />;
  }

  // Si hay usuario, mostrar HomePage dentro del AppShell
  if (user) {
    console.log('[HomeWrapper] Usuario logueado - Mostrando HomePage con AppShell');
    return (
      <AppShell>
        <HomePage />
      </AppShell>
    );
  }

  // Si no hay usuario, mostrar HomePage sin AppShell
  console.log('[HomeWrapper] Sin usuario - Mostrando HomePage pública');
  return <HomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeWrapper />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <PatientDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <DoctorDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
