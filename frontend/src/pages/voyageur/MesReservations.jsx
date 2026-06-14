import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calendar, MapPin, BedDouble, Clock, XCircle, Search, ChevronRight } from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix, formatPlageDates } from '../../lib/format'

export function PageMesReservations() {
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.succes) {
      setMessage({ type: 'succes', texte: location.state.succes })
      window.history.replaceState({}, '')
    }
    api.get('/client/bookings/')
      .then((d) => setReservations(d.results || d || []))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }, [])

  const handleAnnuler = async (id) => {
    if (!confirm('Confirmer l\'annulation de cette réservation ?')) return
    try {
      await api.post(`/client/bookings/${id}/cancel/`, {})
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r))
      setMessage({ type: 'succes', texte: 'Réservation annulée avec succès.' })
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message })
    }
  }

  if (chargement) return <SectionChargement />
  if (erreur) return <ErreurPage message={erreur} />

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      {reservations.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Aucune réservation</h2>
          <p className="text-gray-400 mb-6 text-sm">Vous n'avez pas encore effectué de réservation.</p>
          <Link to="/hebergements" className="btn-primary gap-2">
            <Search className="w-4 h-4" />
            Chercher un hébergement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Info principale */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {r.booking_number}
                    </span>
                    <BadgeStatut statut={r.status} />
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg">
                    {r.establishment?.name || 'Établissement'}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-gray-400" />
                      {r.room_type?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatPlageDates(r.check_in_date, r.check_out_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {r.total_nights} nuit{r.total_nights > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Montant + actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">{formatPrix(r.total_amount)}</p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                  {['pending_payment', 'pending_host_validation', 'confirmed'].includes(r.status) && (
                    <button
                      onClick={() => handleAnnuler(r.id)}
                      className="btn-danger btn-sm gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Annuler
                    </button>
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
