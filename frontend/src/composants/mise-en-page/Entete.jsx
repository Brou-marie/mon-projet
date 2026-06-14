import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, LayoutDashboard, Home, Building2 } from 'lucide-react'
import { useAuth } from '../../contextes/AuthContexte'

export function Entete() {
  const { utilisateur, estConnecte, estVoyageur, estHebergeur, accueilRole, deconnecter } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [userMenuOuvert, setUserMenuOuvert] = useState(false)
  const navigate = useNavigate()

  const handleDeconnexion = async () => {
    await deconnecter()
    navigate('/')
    setMenuOuvert(false)
    setUserMenuOuvert(false)
  }

  const lienEspace = accueilRole()
  const espaceExterne = lienEspace.startsWith('http')

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="section">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setMenuOuvert(false)}>
            <span className="text-gray-900">Noam<span className="text-primary-600">Home</span></span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>Accueil</NavLink>
            <NavLink to="/hebergements" className={navLinkClass}>Hébergements</NavLink>
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-3">
            {estConnecte ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOuvert(!userMenuOuvert)}
                  className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                    {utilisateur?.first_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate max-w-24">
                      {utilisateur?.first_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {estVoyageur ? 'Voyageur' : estHebergeur ? 'Hébergeur' : 'Admin'}
                    </p>
                  </div>
                </button>

                {userMenuOuvert && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOuvert(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{utilisateur?.first_name} {utilisateur?.last_name}</p>
                        <p className="text-xs text-gray-400 truncate">{utilisateur?.email}</p>
                      </div>
                      {espaceExterne ? (
                        <a href={lienEspace} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" target="_blank" rel="noreferrer" onClick={() => setUserMenuOuvert(false)}>
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Administration
                        </a>
                      ) : (
                        <Link to={lienEspace} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setUserMenuOuvert(false)}>
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Mon espace
                        </Link>
                      )}
                      <button onClick={handleDeconnexion} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/connexion" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
                  Connexion
                </Link>
                <Link to="/inscription" className="btn-primary text-sm py-2 px-4">
                  Créer un compte
                </Link>
              </>
            )}
          </div>

          {/* Bouton mobile */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label="Menu"
          >
            {menuOuvert ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in-up">
          <div className="section py-4 space-y-1">
            <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setMenuOuvert(false)}>
              <Home className="w-4 h-4" /> Accueil
            </NavLink>
            <NavLink to="/hebergements" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setMenuOuvert(false)}>
              <Building2 className="w-4 h-4" /> Hébergements
            </NavLink>

            {estConnecte ? (
              <>
                <div className="px-3 py-2 mt-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {utilisateur?.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{utilisateur?.first_name} {utilisateur?.last_name}</p>
                      <p className="text-xs text-gray-400">{utilisateur?.email}</p>
                    </div>
                  </div>
                </div>
                {espaceExterne ? (
                  <a href={lienEspace} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50" target="_blank" rel="noreferrer" onClick={() => setMenuOuvert(false)}>
                    <LayoutDashboard className="w-4 h-4" /> Mon espace
                  </a>
                ) : (
                  <Link to={lienEspace} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMenuOuvert(false)}>
                    <LayoutDashboard className="w-4 h-4" /> Mon espace
                  </Link>
                )}
                <button onClick={handleDeconnexion} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                <Link to="/connexion" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMenuOuvert(false)}>
                  <User className="w-4 h-4" /> Connexion
                </Link>
                <Link to="/inscription" className="btn-primary w-full justify-center" onClick={() => setMenuOuvert(false)}>
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
