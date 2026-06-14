import React, { useState, useEffect } from 'react'
import { Calendar, User, BedDouble, CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix, formatPlageDates } from '../../lib/format'

export function PageReservationsHebergeur() {
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)

  const charger = () => {
    setChargement(true)
    api.get('/owner/bookings/')
      .then((d) => setReservations(d.results || d || []))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const handleAction = async (id, action) => {
    const label = action === 'approve' ? 'approuver' : 'rejeter'
    if (!confirm(`Voulez-vous vraiment ${label} cette réservation ?`)) return
    try {
      await api.post(`/owner/bookings/${id}/${action}/`, {})
      setMessage({ type: 'succes', texte: `Réservation ${action === 'approve' ? 'approuvée' : 'rejetée'}.` })
      charger()
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message })
    }
  }

  if (chargement) return <SectionChargement />
  if (erreur) return <ErreurPage message={erreur} onReessayer={charger} />

  const enAttente = reservations.filter((r) => r.status === 'pending_host_validation')
  const autres = reservations.filter((r) => r.status !== 'pending_host_validation')

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Réservations reçues</h1>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      {/* En attente de validation */}
      {enAttente.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">
              En attente de validation
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{enAttente.length}</span>
            </h2>
          </div>
          <div className="space-y-3">
            {enAttente.map((r) => (
              <div key={r.id} className="card border-l-4 border-amber-400 bg-amber-50/30">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border border-gray-200">{r.booking_number}</span>
                      <BadgeStatut statut={r.status} />
                    </div>
                    <h3 className="font-bold text-gray-900">{r.establishment?.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{r.guest?.first_name} {r.guest?.last_name}</span>
                      <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" />{r.room_type?.name}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatPlageDates(r.check_in_date, r.check_out_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xl font-bold text-primary-600">{formatPrix(r.total_amount)}</p>
                    <button onClick={() => handleAction(r.id, 'approve')} className="btn-primary gap-2">
                      <CheckCircle className="w-4 h-4" /> Approuver
                    </button>
                    <button onClick={() => handleAction(r.id, 'reject')} className="btn-danger gap-2">
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toutes les réservations */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
        {reservations.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Aucune réservation pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {autres.map((r) => (
              <div key={r.id} className="card hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-lg">{r.booking_number}</span>
                      <BadgeStatut statut={r.status} />
                    </div>
                    <p className="font-semibold text-gray-800">{r.establishment?.name} · {r.room_type?.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatPlageDates(r.check_in_date, r.check_out_date)}
                    </p>
                  </div>
                  <p className="font-bold text-primary-600 text-lg">{formatPrix(r.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
