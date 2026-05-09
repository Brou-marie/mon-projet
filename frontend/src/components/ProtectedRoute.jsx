import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protège une route :
 * - Redirige vers /login si non connecté (en mémorisant la page d'origine)
 * - Redirige vers / si le rôle ne correspond pas
 *   Exception : superadmin a accès à tout
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
    // Rediriger vers l'espace approprié selon le rôle
    if (user.role === 'host') {
      return <Navigate to="/host/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
