import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, BedDouble, ClipboardList, Clock,
  TrendingUp, Star, ChevronRight, Plus, CalendarDays,
  ArrowUpRight,
} from 'lucide-react'
import { api } from '../../services/api'
import { SectionChargement } from '../../composants/ui/Chargement'
import { useAuth } from '../../contextes/AuthContexte'
import { formatPrix } from '../../lib/format'

function StatCard({ Icone, titre, valeur, sous, couleur = 'primary', lien }) {
  const palettes = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600' },
    vert:    { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    bleu:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
  }
  const p = palettes[couleur] || palettes.primary
  const inner = (
    <div className="card hover:shadow-md transition-all group">
      <div className={`w-11 h-11 rounded-2xl ${p.bg} flex items-center justify-center mb-4`}>
        <Icone className={`w-5 h-5 ${p.text}`} />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900">{valeur}</p>
      <p className="text-sm text-gray-500 mt-0.5">{titre}</p>
      {sous && <p className="text-xs text-gray-400 mt-1">{sous}</p>}
      {lien && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 absolute top-4 right-4 transition-colors" />}
    </div>
  )
  if (lien) return <Link to={lien} className="relative">{inner}</Link>
  return <div className="relative">{inner}</div>
}

export function PageTableauDeBordHebergeur() {
  const [stats, setStats] = useState(null)
  const [chargement, setChargement] = useState(true)
  const { utilisateur } = useAuth()

  useEffect(() => {
    api.get('/owner/dashboard/')
      .then((d) => setStats(Array.isArray(d) ? d[0] : d))
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <SectionChargement />

  const ACTIONS_RAPIDES = [
    { to: '/hebergeur/etablissements', Icone: Building2, titre: 'Mes établissements', desc: 'Gérer vos propriétés' },
    { to: '/hebergeur/chambres', Icone: BedDouble, titre: 'Mes chambres', desc: 'Types de chambres' },
    { to: '/hebergeur/disponibilites', Icone: CalendarDays, titre: 'Disponibilités', desc: 'Calendrier et tarifs' },
    { to: '/hebergeur/reservations', Icone: ClipboardList, titre: 'Réservations', desc: 'Valider et gérer' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bonjour, {utilisateur?.first_name}
          </h1>
          <p className="text-gray-500 mt-1">Voici un résumé de votre activité.</p>
        </div>
        <Link to="/hebergeur/etablissements" className="btn-primary gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nouvel établissement
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard Icone={Building2} titre="Établissements" valeur={stats.total_establishments ?? 0} lien="/hebergeur/etablissements" />
          <StatCard Icone={BedDouble} titre="Chambres" valeur={stats.total_rooms ?? 0} couleur="bleu" lien="/hebergeur/chambres" />
          <StatCard Icone={ClipboardList} titre="Actives" valeur={stats.active_bookings ?? 0} couleur="vert" lien="/hebergeur/reservations" />
          <StatCard Icone={Clock} titre="En attente" valeur={stats.pending_bookings ?? 0} couleur="amber" sous="Validation requise" lien="/hebergeur/reservations" />
        </div>
      )}

      {/* Revenus */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-700 text-white border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
            <p className="text-primary-200 text-sm mb-1 relative">Revenus ce mois</p>
            <p className="text-4xl font-bold relative">{formatPrix(stats.current_month_revenue || 0)}</p>
            <p className="text-primary-200 text-sm mt-2 relative">
              Total cumulé : {formatPrix(stats.total_revenue || 0)}
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Note moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.average_rating > 0 ? Number(stats.average_rating).toFixed(1) : '—'}
                  {stats.average_rating > 0 && <span className="text-base font-normal text-gray-400">/5</span>}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Basé sur <strong className="text-gray-700">{stats.total_reviews ?? 0}</strong> avis
            </p>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACTIONS_RAPIDES.map(({ to, Icone, titre, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <Icone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{titre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
