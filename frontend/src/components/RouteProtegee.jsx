import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/ContexteAuth';

export default function RouteProtegee({ children, roleRequis }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-noam-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (roleRequis && user.role !== roleRequis && user.role !== 'superadmin') {
    if (user.role === 'host') {
      return <Navigate to="/hote/tableau-de-bord" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
