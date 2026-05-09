import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/ContexteAuth';
import { Home, Search, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';

export default function BarreNavigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOuvert, setMobileOuvert] = useState(false);

  const handleDeconnexion = async () => {
    setMobileOuvert(false);
    await logout();
  };

  const estActif = (chemin) => location.pathname.startsWith(chemin);

  const lienNav = (vers, texte) => (
    <Link
      to={vers}
      onClick={() => setMobileOuvert(false)}
      className={`text-sm font-medium transition-colors duration-150 ${
        estActif(vers)
          ? 'text-noam-600'
          : 'text-gray-600 hover:text-noam-600'
      }`}
    >
      {texte}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo NoamHome */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-noam-600 to-noam-500 shadow-noam group-hover:shadow-noam-lg transition-shadow">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-noam-600">Noam</span>
              <span className="text-gray-900">Home</span>
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-6">
            {lienNav('/recherche', 'Hébergements')}

            {user ? (
              <>
                {/* Hôte */}
                {user.role === 'host' && (
                  <>
                    {lienNav('/hote/tableau-de-bord', 'Tableau de bord')}
                    {lienNav('/hote/hebergements', 'Mes hébergements')}
                    {lienNav('/hote/reservations', 'Réservations')}
                  </>
                )}

                {/* Voyageur */}
                {user.role === 'guest' && (
                  lienNav('/mes-reservations', 'Mes réservations')
                )}

                {/* Profil */}
                <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                  <Link
                    to="/profil"
                    className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-noam-300 hover:bg-noam-50 hover:text-noam-700 transition-all duration-150"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-noam-100 text-noam-700 text-xs font-bold">
                      {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <span>{user.first_name || user.email.split('@')[0]}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      user.role === 'host'
                        ? 'bg-or-100 text-or-600'
                        : 'bg-noam-100 text-noam-700'
                    }`}>
                      {user.role === 'host' ? 'Hôte' : 'Voyageur'}
                    </span>
                  </Link>
                  <button
                    onClick={handleDeconnexion}
                    title="Se déconnecter"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/connexion" className="btn-fantome text-sm py-2 px-4">
                  Connexion
                </Link>
                <Link to="/inscription" className="btn-primaire text-sm py-2 px-4">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setMobileOuvert(!mobileOuvert)}
            aria-label="Menu"
          >
            {mobileOuvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOuvert && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-5 shadow-lg">
          <div className="mt-3 space-y-1">
            <Link
              to="/recherche"
              onClick={() => setMobileOuvert(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Search className="h-4 w-4 text-gray-400" />
              Hébergements
            </Link>

            {user ? (
              <>
                {/* Badge utilisateur */}
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 border border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-noam-100 text-noam-700 text-sm font-bold">
                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.role === 'host' ? 'bg-or-100 text-or-600' : 'bg-noam-100 text-noam-700'
                  }`}>
                    {user.role === 'host' ? 'Hôte' : 'Voyageur'}
                  </span>
                </div>

                {/* Liens hôte */}
                {user.role === 'host' && (
                  <>
                    {[
                      { to: '/hote/tableau-de-bord', label: 'Tableau de bord' },
                      { to: '/hote/hebergements', label: 'Mes hébergements' },
                      { to: '/hote/reservations', label: 'Réservations reçues' },
                    ].map((l) => (
                      <Link key={l.to} to={l.to} onClick={() => setMobileOuvert(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        {l.label}
                      </Link>
                    ))}
                  </>
                )}

                {/* Liens voyageur */}
                {user.role === 'guest' && (
                  <Link to="/mes-reservations" onClick={() => setMobileOuvert(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Mes réservations
                  </Link>
                )}

                <Link to="/profil" onClick={() => setMobileOuvert(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <User className="h-4 w-4 text-gray-400" />
                  Mon profil
                </Link>

                <button
                  onClick={handleDeconnexion}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setMobileOuvert(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Connexion
                </Link>
                <Link to="/inscription" onClick={() => setMobileOuvert(false)}
                  className="flex items-center gap-3 rounded-xl bg-noam-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-noam-700 transition">
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
