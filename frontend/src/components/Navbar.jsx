import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, User, LogOut, Menu, X, Home, Search } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`text-sm font-medium transition ${
        isActive(to)
          ? 'text-primary-600'
          : 'text-gray-700 hover:text-primary-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
            <Hotel className="h-6 w-6 text-primary-600" />
            <span>AfriStay</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Liens publics toujours visibles */}
            {navLink('/search', 'Hébergements')}

            {/* Connecté */}
            {user ? (
              <>
                {/* Hébergeur */}
                {user.role === 'host' && (
                  <>
                    {navLink('/host/dashboard', 'Tableau de bord')}
                    {navLink('/host/establishments', 'Mes établissements')}
                    {navLink('/host/bookings', 'Réservations reçues')}
                  </>
                )}

                {/* Voyageur */}
                {user.role === 'guest' && (
                  navLink('/my-bookings', 'Mes réservations')
                )}

                {/* Profil + déconnexion */}
                <div className="flex items-center gap-3 border-l pl-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    <User className="h-4 w-4" />
                    {user.first_name || user.email.split('@')[0]}
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                      user.role === 'host' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'host' ? 'Hébergeur' : 'Voyageur'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition"
                    title="Se déconnecter"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Non connecté */
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-outline text-sm py-1.5">Connexion</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">S'inscrire</Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4 shadow-lg">
          <div className="mt-3 space-y-1">
            <Link
              to="/search"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Search className="h-4 w-4" /> Hébergements
            </Link>

            {user ? (
              <>
                {/* Badge rôle */}
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {user.first_name || user.email}
                  </span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === 'host' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'host' ? 'Hébergeur' : 'Voyageur'}
                  </span>
                </div>

                {/* Liens hébergeur */}
                {user.role === 'host' && (
                  <>
                    <Link to="/host/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Tableau de bord
                    </Link>
                    <Link to="/host/establishments" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Mes établissements
                    </Link>
                    <Link to="/host/bookings" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Réservations reçues
                    </Link>
                  </>
                )}

                {/* Liens voyageur */}
                {user.role === 'guest' && (
                  <Link to="/my-bookings" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Mes réservations
                  </Link>
                )}

                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4" /> Mon profil
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Connexion
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
