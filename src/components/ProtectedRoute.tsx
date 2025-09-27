import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Onboarding from './onboarding/Onboarding';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireCompleteProfile = true 
}) => {
  const { currentUser } = useAuthStore();

  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser || !currentUser.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere perfil completo y no lo tiene, mostrar onboarding
  if (requireCompleteProfile && !currentUser.profileCompleted) {
    return <Onboarding />;
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;