import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Star, User, Building2,
  BedDouble, CalendarDays, ClipboardList, LogOut,
  Menu, Home,
} from 'lucide-react'
import { useAuth } from '../../contextes/AuthContexte'

function NavItem({ to, Icone, libelle, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icone className="w-4 h-4 flex-shrink-0" />
      {libelle}
    </NavLink>
  )
}

function NavVoyageur() {
  return (
    <div className="space-y-0.5">
      <NavItem to="/voyageur/tableau-de-bord" Icone={LayoutDashboard} libelle="Tableau de bord" end />
      <NavItem to="/voyageur/reservations" Icone={Calendar} libelle="Mes réservations" />
      <NavItem to="/voyageur/avis" Icone={Star} libelle="Mes avis" />
      <NavItem to="/voyageur/profil" Icone={User} libelle="Mon profil" />
    </div>
  )
}

function NavHebergeur() {
  return (
    <div className="space-y-0.5">
      <NavItem to="/hebergeur/tableau-de-bord" Icone={LayoutDashboard} libelle="Tableau de bord" end />
      <NavItem to="/hebergeur/etablissements" Icone={Building2} libelle="Établissements" />
      <NavItem to="/hebergeur/chambres" Icone={BedDouble} libelle="Chambres" />
      <NavItem to="/hebergeur/disponibilites" Icone={CalendarDays} libelle="Disponibilités" />
      <NavItem to="/hebergeur/reservations" Icone={ClipboardList} libelle="Réservations reçues" />
      <NavItem to="/hebergeur/profil" Icone={User} libelle="Mon profil" />
    </div>
  )
}

export function DispositionTableauBord() {
  const { utilisateur, estVoyageur, estHebergeur, deconnecter } = useAuth()
  const [sidebarOuverte, setSidebarOuverte] = useState(false)
  const navigate = useNavigate()

  const handleDeconnexion = async () => {
    await deconnecter()
    navigate('/')
  }

  const initiale = utilisateur?.first_name?.[0]?.toUpperCase() || 'U'
  const roleLabel = estVoyageur ? 'Voyageur' : estHebergeur ? 'Hébergeur' : 'Admin'

  const Sidebar = ({ onClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900" onClick={onClick}>
          <span className="bg-primary-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black">NH</span>
          NoamHome
        </Link>
      </div>

      {/* Utilisateur */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
            {initiale}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {utilisateur?.first_name} {utilisateur?.last_name}
            </p>
            <span className="inline-flex items-center text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full mt-0.5">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {estVoyageur && <NavVoyageur />}
        {estHebergeur && <NavHebergeur />}
      </nav>

      {/* Liens bas */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
          onClick={onClick}
        >
          <Home className="w-4 h-4" />
          Retour au site
        </Link>
        <button
          onClick={handleDeconnexion}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-100 shadow-sm z-30">
        <Sidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOuverte && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setSidebarOuverte(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar onClick={() => setSidebarOuverte(false)} />
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOuverte(true)} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-primary-700">
            <span className="bg-primary-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black">NH</span>
            NoamHome
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {initiale}
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
