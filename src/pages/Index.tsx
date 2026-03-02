import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/inventory';

const Index = () => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
};

export default Index;
