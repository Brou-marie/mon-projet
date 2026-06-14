import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Star, CheckCircle, Search, TrendingUp, Gift, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import { SectionChargement } from '../../composants/ui/Chargement'
import { useAuth } from '../../contextes/AuthContexte'
import { formatPrix } from '../../lib/format'

function StatCard({ Icone, titre, valeur, sous, couleur = 'primary' }) {
  const palettes = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-100' },
    vert:    { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    bleu:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-100' },
    rouge:   { bg: 'bg-red-50',     text: 'text-red-500',     ring: 'ring-red-100' },
  }
  const p = palettes[couleur] || palettes.primary
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl ${p.bg} ${p.ring} ring-4 flex items-center justify-center`}>
          <Icone className={`w-5 h-5 ${p.text}`} />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-0.5">{valeur}</p>
      <p className="text-sm text-gray-500">{titre}</p>
      {sous && <p className="text-xs text-gray-400 mt-1">{sous}</p>}
    </div>
  )
}

const ACTIONS = [
  { to: '/hebergements', Icone: Search, titre: 'Chercher un hébergement', desc: 'Explorez nos offres' },
  { to: '/voyageur/reservations', Icone: Calendar, titre: 'Mes réservations', desc: 'Gérer mes séjours' },
  { to: '/voyageur/avis', Icone: Star, titre: 'Mes avis', desc: 'Partager mon expérience' },
  { to: '/voyageur/profil', Icone: TrendingUp, titre: 'Mon profil', desc: 'Modifier mes informations' },
]

export function PageTableauDeBordVoyageur() {
  const [stats, setStats] = useState(null)
  const [chargement, setChargement] = useState(true)
  const { utilisateur } = useAuth()

  useEffect(() => {
    api.get('/client/dashboard/')
      .then((d) => setStats(Array.isArray(d) ? d[0] : d))
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <SectionChargement />

  const heure = new Date().getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {salut}, {utilisateur?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Bienvenue dans votre espace voyageur.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            Icone={Calendar}
            titre="Réservations"
            valeur={stats.total_reservations ?? 0}
          />
          <StatCard
            Icone={CheckCircle}
            titre="Confirmées"
            valeur={stats.confirmed_reservations ?? 0}
            couleur="vert"
          />
          <StatCard
            Icone={TrendingUp}
            titre="Terminées"
            valeur={stats.completed_reservations ?? 0}
            couleur="bleu"
          />
          <StatCard
            Icone={Gift}
            titre="Points fidélité"
            valeur={stats.loyalty_points ?? 0}
            couleur="amber"
          />
        </div>
      )}

      {/* Dépenses */}
      {stats?.total_spent > 0 && (
        <div className="card bg-gradient-to-r from-primary-600 to-emerald-600 text-white border-0">
          <p className="text-primary-200 text-sm mb-1">Total dépensé</p>
          <p className="text-3xl font-bold">{formatPrix(stats.total_spent)}</p>
          <p className="text-primary-200 text-sm mt-1">
            Sur {stats.completed_reservations} séjour{stats.completed_reservations > 1 ? 's' : ''} terminé{stats.completed_reservations > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map(({ to, Icone, titre, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                <Icone className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{titre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

