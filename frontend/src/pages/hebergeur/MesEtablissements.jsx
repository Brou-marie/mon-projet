import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Building2, Star, ExternalLink, Pencil } from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { getImageHebergement } from '../../lib/images'
import { TYPES_ETAB, formatPrix } from '../../lib/format'

export function PageMesEtablissements() {
  const [etablissements, setEtab] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const location = useLocation()

  const charger = () => {
    setChargement(true)
    api.get('/owner/establishments/')
      .then(d => setEtab(d.results || d || []))
      .catch(e => setErreur(e.message))
      .finally(() => setChargement(false))
  }

  useEffect(() => {
    if (location.state?.succes) {
      setMessage({ type: 'succes', texte: location.state.succes })
      window.history.replaceState({}, '')
    }
    charger()
  }, [])

  if (chargement) return <SectionChargement />
  if (erreur) return <ErreurPage message={erreur} onReessayer={charger} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes établissements</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {etablissements.length} établissement{etablissements.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/hebergeur/etablissements/nouveau" className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Nouvel établissement
        </Link>
      </div>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      {etablissements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 px-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Aucun établissement</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Créez votre premier établissement. Il sera soumis à validation avant publication.
          </p>
          <Link to="/hebergeur/etablissements/nouveau" className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Créer mon premier établissement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {etablissements.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                <img
                  src={getImageHebergement(e.establishment_type)}
                  alt={e.name}
                  className="w-full h-full object-cover"
                  onError={ev => { ev.target.src = getImageHebergement('hotel') }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <p className="text-white font-semibold text-sm line-clamp-1">{e.name}</p>
                  <BadgeStatut statut={e.status} />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">{TYPES_ETAB[e.establishment_type] || e.establishment_type}</span>
                  <span>·</span>
                  <span>{e.city}</span>
                  {e.avg_rating > 0 && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {Number(e.avg_rating).toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  {[
                    { val: e.room_count ?? 0, label: 'Chambres' },
                    { val: e.booking_count ?? 0, label: 'Réservations' },
                    { val: e.review_count ?? 0, label: 'Avis' },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-gray-50 rounded-xl py-2">
                      <p className="font-bold text-gray-900 text-sm">{val}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {e.total_revenue > 0 && (
                  <p className="text-xs text-gray-500 mb-3">
                    Revenus : <span className="font-semibold text-primary-600">{formatPrix(e.total_revenue)}</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <Link
                    to={`/hebergeur/etablissements/${e.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 py-2 rounded-xl transition-all"
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </Link>
                  {e.slug && (
                    <Link
                      to={`/hebergements/${e.slug}`}
                      className="flex items-center justify-center px-3 py-2 border border-gray-200 text-gray-500 hover:border-gray-300 rounded-xl transition-all"
                      title="Voir la page publique"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
