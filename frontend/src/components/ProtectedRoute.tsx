import { Navigate } from 'react-router-dom';
import { PageState } from './common/PageState';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/domain';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: JSX.Element;
}

const defaultPathByRole = (role: UserRole): string => {
  if (role === 'ADMIN') {
    return '/admin';
  }
  if (role === 'DOCTOR') {
    return '/doctor';
  }
  return '/patient';
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageState message="Cargando sesion..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultPathByRole(user.role)} replace />;
  }

  return children;
}
