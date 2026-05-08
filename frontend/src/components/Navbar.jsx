import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Hotel, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
            <Hotel className="h-6 w-6 text-brand-500" />
            <span>AfriStay</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'host' && (
                  <Link to="/host/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary-600">
                    Espace Hébergeur
                  </Link>
                )}
                <Link to="/my-bookings" className="text-sm font-medium text-gray-700 hover:text-primary-600">
                  Mes Réservations
                </Link>
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600">
                    <User className="h-4 w-4" />
                    {user.first_name || user.email}
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-outline">Connexion</Link>
                <Link to="/register" className="btn-primary">S'inscrire</Link>
              </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4">
          {user ? (
            <div className="mt-3 space-y-2">
              {user.role === 'host' && (
                <Link to="/host/dashboard" className="block text-sm font-medium text-gray-700">Espace Hébergeur</Link>
              )}
              <Link to="/my-bookings" className="block text-sm font-medium text-gray-700">Mes Réservations</Link>
              <Link to="/profile" className="block text-sm font-medium text-gray-700">Profil</Link>
              <button onClick={handleLogout} className="block text-sm text-red-600">Déconnexion</button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Link to="/login" className="block text-sm font-medium text-gray-700">Connexion</Link>
              <Link to="/register" className="block text-sm font-medium text-gray-700">Inscription</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
