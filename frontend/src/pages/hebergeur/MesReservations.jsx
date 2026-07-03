import React, { useState, useEffect } from 'react'
import { Calendar, User, BedDouble, CheckCircle, XCircle, Clock, LogIn, LogOut, Search, AlertCircle, CreditCard } from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix, formatPlageDates } from '../../lib/format'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_money', label: 'MTN Money' },
  { value: 'moov', label: 'Moov' },
  { value: 'card', label: 'Carte bancaire' },
]

export function PageReservationsHebergeur() {
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [validatingPayment, setValidatingPayment] = useState(false)

  const charger = () => {
    setChargement(true)
    api.get('/owner/bookings/')
      .then((d) => setReservations(d.results || d || []))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  const handleAction = async (id, action) => {
    const labels = {
      approve: 'approuver',
      reject: 'rejeter',
      check_in: 'effectuer le check-in',
      check_out: 'effectuer le check-out',
    }
    if (!confirm(`Voulez-vous vraiment ${labels[action]} cette réservation ?`)) return
    try {
      await api.post(`/owner/bookings/${id}/${action}/`, {})
      setMessage({ type: 'succes', texte: `Action réussie : ${labels[action]}.` })
      charger()
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message })
    }
  }

  const handleSearchByCode = async (e) => {
    e.preventDefault()
    if (!searchCode.trim()) return

    setSearchLoading(true)
    setSearchResult(null)
    setPaymentMethod('')
    try {
      const result = await api.get(`/bookings/by-code/${searchCode.trim().toUpperCase()}/`)
      setSearchResult(result)
      setMessage({ type: 'succes', texte: 'Réservation trouvée !' })
    } catch (e) {
      setMessage({ type: 'erreur', texte: 'Aucune réservation trouvée avec ce code.' })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleValidatePayment = async () => {
    if (!searchResult || !paymentMethod) return

    setValidatingPayment(true)
    try {
      await api.post(`/bookings/${searchResult.booking_number}/validate_payment/`, { payment_method })
      setMessage({ type: 'succes', texte: 'Paiement validé avec succès !' })
      setSearchResult(null)
      setPaymentMethod('')
      charger()
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message || 'Erreur lors de la validation du paiement.' })
    } finally {
      setValidatingPayment(false)
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

      {/* Recherche par code de réservation */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-600" />
          Rechercher par code de réservation
        </h2>
        <form onSubmit={handleSearchByCode} className="flex gap-3">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="Entrez le code (ex: ABC123)"
            className="input flex-1 font-mono uppercase"
            maxLength={6}
          />
          <button
            type="submit"
            disabled={searchLoading || !searchCode.trim()}
            className="btn-primary gap-2"
          >
            {searchLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </form>
      </div>

      {/* Résultat de recherche */}
      {searchResult && (
        <div className="card border-2 border-primary-200 bg-primary-50/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">Réservation trouvée</h3>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg bg-white px-3 py-1 rounded-lg border border-gray-200 font-bold">
                {searchResult.reservation_code}
              </span>
              <BadgeStatut statut={searchResult.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-semibold">{searchResult.guest_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Téléphone</p>
                <p className="font-semibold">{searchResult.guest_phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Chambre</p>
                <p className="font-semibold">{searchResult.room_type_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-semibold">{formatPlageDates(searchResult.check_in_date, searchResult.check_out_date)}</p>
              </div>
            </div>

            {/* Validation de paiement */}
            {searchResult.payment_status === 'pending' && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-primary-600" />
                  <p className="font-semibold text-gray-900">Valider le paiement</p>
                </div>
                <div className="space-y-3">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input"
                  >
                    <option value="">Sélectionner le moyen de paiement</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleValidatePayment}
                      disabled={!paymentMethod || validatingPayment}
                      className="btn-primary flex-1 gap-2"
                    >
                      {validatingPayment ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Valider le paiement
                    </button>
                    <button
                      onClick={() => setSearchResult(null)}
                      className="btn-secondary"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {searchResult.payment_status === 'paid' && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <p className="font-semibold">Paiement validé via {searchResult.payment_method_display}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <p className="text-xl font-bold text-primary-600">{formatPrix(searchResult.total_amount)}</p>
              {searchResult.payment_status !== 'pending' && (
                <button
                  onClick={() => setSearchResult(null)}
                  className="btn-secondary text-sm"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-primary-600 text-lg">{formatPrix(r.total_amount)}</p>
                    {r.status === 'confirmed' && (
                      <button onClick={() => handleAction(r.id, 'check_in')} className="btn-primary btn-sm gap-2">
                        <LogIn className="w-4 h-4" /> Check-in
                      </button>
                    )}
                    {r.status === 'in_progress' && (
                      <button onClick={() => handleAction(r.id, 'check_out')} className="btn-primary btn-sm gap-2">
                        <LogOut className="w-4 h-4" /> Check-out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
