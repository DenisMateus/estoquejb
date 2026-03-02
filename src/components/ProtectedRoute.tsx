import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/inventory';
import { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
