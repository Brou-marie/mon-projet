/**
 * Page réservations hébergeur.
 *
 * Flux "accueil client" en 3 étapes :
 *  1. L'hébergeur saisit le code 6 caractères du client
 *  2. La fiche complète s'affiche (client, chambre, dates, montant)
 *  3. L'hébergeur sélectionne le moyen de paiement reçu → valide → clés remises
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar, User, BedDouble, CheckCircle, XCircle, Clock,
  LogIn, LogOut, Search, CreditCard, KeyRound, ArrowLeft,
  Phone, Mail, Users, Moon, Banknote, Wifi, Smartphone,
} from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix, formatPlageDates } from '../../lib/format'

// ── Moyens de paiement ────────────────────────────────────────────────────────
const MOYENS_PAIEMENT = [
  { value: 'cash',         label: 'Espèces',        icon: Banknote,    couleur: 'text-amber-600  bg-amber-50  border-amber-200' },
  { value: 'wave',         label: 'Wave',            icon: Smartphone,  couleur: 'text-blue-600   bg-blue-50   border-blue-200' },
  { value: 'orange_money', label: 'Orange Money',    icon: Smartphone,  couleur: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'mtn_money',    label: 'MTN Money',       icon: Smartphone,  couleur: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'moov',         label: 'Moov',            icon: Smartphone,  couleur: 'text-green-600  bg-green-50  border-green-200' },
  { value: 'card',         label: 'Carte bancaire',  icon: CreditCard,  couleur: 'text-purple-600 bg-purple-50 border-purple-200' },
]

// ── Étape 1 : saisie du code ──────────────────────────────────────────────────
function EtapeSaisieCode({ onTrouve, message, setMessage }) {
  const [code, setCode]           = useState('')
  const [chargement, setChargement] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const val = code.trim().toUpperCase()
    if (val.length < 4) return
    setChargement(true)
    setMessage(null)
    try {
      const data = await api.post('/owner/bookings/lookup-code/', { code: val })
      onTrouve(data)
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message || 'Code introuvable.' })
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card text-center py-10">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <KeyRound className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accueillir un client</h2>
        <p className="text-gray-500 text-sm mb-8">
          Demandez au client son code de réservation à 6 caractères.
        </p>

        {message && (
          <div className="mb-5">
            <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Ex : AB3X7K"
            maxLength={6}
            className="input text-center text-3xl font-mono tracking-widest uppercase py-4"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={chargement || code.trim().length < 4}
            className="btn-primary w-full btn-lg justify-center gap-2"
          >
            {chargement
              ? <><Clock className="w-4 h-4 animate-spin" /> Recherche...</>
              : <><Search className="w-4 h-4" /> Trouver la réservation</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Étape 2 : fiche client + paiement ────────────────────────────────────────
function EtapeFicheClient({ reservation, onValide, onRetour, message, setMessage }) {
  const [moyenPaiement, setMoyenPaiement] = useState('')
  const [preuveRef, setPreuveRef]         = useState('')
  const [chargement, setChargement]       = useState(false)

  const dejaPayee = reservation.payment_status === 'paid'

  const handleValider = async () => {
    if (!moyenPaiement) return
    setChargement(true)
    setMessage(null)
    try {
      const data = await api.post(`/owner/bookings/${reservation.id}/validate-payment/`, {
        payment_method: moyenPaiement,
        payment_proof:  preuveRef,
      })
      onValide(data.booking || reservation, moyenPaiement)
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message || 'Erreur lors de la validation.' })
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Bouton retour */}
      <button
        onClick={onRetour}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Saisir un autre code
      </button>

      {message && (
        <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />
      )}

      {/* En-tête fiche */}
      <div className="card border-2 border-primary-200 bg-primary-50/20">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="font-mono text-2xl font-bold bg-white px-4 py-2 rounded-xl border border-primary-200 text-primary-700 tracking-widest">
            {reservation.reservation_code}
          </span>
          <BadgeStatut statut={reservation.status} />
          {dejaPayee && (
            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" /> Déjà payé
            </span>
          )}
        </div>

        {/* Infos client */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <User className="w-4 h-4 text-gray-400" />
              {reservation.guest_name || '—'}
            </div>
            {reservation.guest_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {reservation.guest_phone}
              </div>
            )}
            {reservation.guest_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {reservation.guest_email}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Séjour</p>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <BedDouble className="w-4 h-4 text-gray-400" />
              {reservation.room_type_name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatPlageDates(reservation.check_in_date, reservation.check_out_date)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Moon className="w-4 h-4 text-gray-400" />
              {reservation.total_nights} nuit{reservation.total_nights > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              {reservation.guest_count_adults} adulte{reservation.guest_count_adults > 1 ? 's' : ''}
              {reservation.guest_count_children > 0 && ` · ${reservation.guest_count_children} enfant${reservation.guest_count_children > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Message du client */}
        {reservation.guest_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
            <p className="font-semibold mb-1">Message du client :</p>
            <p>{reservation.guest_notes}</p>
          </div>
        )}

        {/* Montant */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
          <p className="text-gray-500 text-sm font-medium">Montant à encaisser</p>
          <p className="text-3xl font-bold text-primary-600">{formatPrix(reservation.total_amount)}</p>
        </div>
      </div>

      {/* Zone paiement */}
      {!dejaPayee ? (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            Enregistrer le paiement
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Sélectionnez le moyen de paiement utilisé par le client.
          </p>

          {/* Grille des moyens de paiement */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {MOYENS_PAIEMENT.map(({ value, label, icon: Icon, couleur }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMoyenPaiement(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-medium text-sm
                  ${moyenPaiement === value
                    ? `${couleur} border-current shadow-sm`
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-6 h-6" />
                {label}
                {moyenPaiement === value && <CheckCircle className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Référence optionnelle */}
          <div className="mb-5">
            <label className="label">
              Référence de transaction <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={preuveRef}
              onChange={(e) => setPreuveRef(e.target.value)}
              placeholder="N° de transaction, reçu, etc."
              className="input"
            />
          </div>

          <button
            onClick={handleValider}
            disabled={!moyenPaiement || chargement}
            className="btn-primary w-full btn-lg justify-center gap-2"
          >
            {chargement
              ? <><Clock className="w-4 h-4 animate-spin" /> Validation...</>
              : <><KeyRound className="w-4 h-4" /> Valider le paiement et remettre les clés</>
            }
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-gray-800">Paiement déjà enregistré</p>
          <p className="text-gray-500 text-sm mt-1">
            via {reservation.payment_method_display || reservation.payment_method}
          </p>
          <button onClick={onRetour} className="btn-secondary mt-5">
            Accueillir un autre client
          </button>
        </div>
      )}
    </div>
  )
}

// ── Étape 3 : confirmation remise des clés ─────────────────────────────────
function EtapeConfirmation({ reservation, moyenPaiement, onTerminer }) {
  const methode = MOYENS_PAIEMENT.find((m) => m.value === moyenPaiement)

  return (
    <div className="max-w-md mx-auto">
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Clés remises !</h2>
        <p className="text-gray-500 mb-8">
          Le paiement est validé. Vous pouvez remettre les clés à {reservation.guest_name?.split(' ')[0] || 'votre client'}.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Client</span>
            <span className="font-semibold">{reservation.guest_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chambre</span>
            <span className="font-semibold">{reservation.room_type_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dates</span>
            <span className="font-semibold">{formatPlageDates(reservation.check_in_date, reservation.check_out_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Paiement</span>
            <span className="font-semibold">{methode?.label || moyenPaiement}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3">
            <span className="text-gray-500">Montant encaissé</span>
            <span className="font-bold text-primary-600 text-base">{formatPrix(reservation.total_amount)}</span>
          </div>
        </div>

        <button onClick={onTerminer} className="btn-primary w-full justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Accueillir un autre client
        </button>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function PageReservationsHebergeur() {
  // Flux accueil : 'code' | 'fiche' | 'confirmation'
  const [etape, setEtape]               = useState('code')
  const [reservationActive, setReservationActive] = useState(null)
  const [moyenChoisi, setMoyenChoisi]   = useState('')
  const [message, setMessage]           = useState(null)

  // Liste des réservations en bas de page
  const [reservations, setReservations] = useState([])
  const [chargement, setChargement]     = useState(true)
  const [erreur, setErreur]             = useState(null)
  const [msgListe, setMsgListe]         = useState(null)

  const charger = () => {
    setChargement(true)
    api.get('/owner/bookings/')
      .then((d) => setReservations(d.results || d || []))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }

  useEffect(() => { charger() }, [])

  // Callbacks du flux accueil
  const handleTrouve = (data) => {
    setReservationActive(data)
    setEtape('fiche')
  }

  const handleValide = (booking, moyen) => {
    setReservationActive(booking)
    setMoyenChoisi(moyen)
    setEtape('confirmation')
    charger() // rafraîchir la liste
  }

  const handleTerminer = () => {
    setEtape('code')
    setReservationActive(null)
    setMoyenChoisi('')
    setMessage(null)
  }

  // Actions sur la liste (check-in / check-out)
  const handleAction = async (id, action) => {
    const labels = { check_in: 'le check-in', check_out: 'le check-out' }
    if (!confirm(`Effectuer ${labels[action]} pour cette réservation ?`)) return
    try {
      await api.post(`/owner/bookings/${id}/${action}/`, {})
      setMsgListe({ type: 'succes', texte: `${action === 'check_in' ? 'Check-in' : 'Check-out'} effectué.` })
      charger()
    } catch (e) {
      setMsgListe({ type: 'erreur', texte: e.message })
    }
  }

  if (erreur) return <ErreurPage message={erreur} onReessayer={charger} />

  const enCours    = reservations.filter((r) => ['confirmed', 'in_progress'].includes(r.status))
  const historique = reservations.filter((r) => !['confirmed', 'in_progress'].includes(r.status))

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Titre ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <p className="text-gray-500 text-sm mt-1">Accueillez vos clients et gérez leurs séjours.</p>
      </div>

      {/* ── Flux accueil client ── */}
      <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-6 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary-500" />
          Accueil d'un client
        </h2>

        {etape === 'code' && (
          <EtapeSaisieCode
            onTrouve={handleTrouve}
            message={message}
            setMessage={setMessage}
          />
        )}
        {etape === 'fiche' && reservationActive && (
          <EtapeFicheClient
            reservation={reservationActive}
            onValide={handleValide}
            onRetour={handleTerminer}
            message={message}
            setMessage={setMessage}
          />
        )}
        {etape === 'confirmation' && reservationActive && (
          <EtapeConfirmation
            reservation={reservationActive}
            moyenPaiement={moyenChoisi}
            onTerminer={handleTerminer}
          />
        )}
      </section>

      {/* ── Séjours en cours ── */}
      {enCours.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            Séjours en cours
            <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {enCours.length}
            </span>
          </h2>

          {msgListe && (
            <div className="mb-4">
              <Alerte type={msgListe.type} message={msgListe.texte} onFermer={() => setMsgListe(null)} />
            </div>
          )}

          <div className="space-y-3">
            {enCours.map((r) => (
              <div key={r.id} className="card hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg tracking-wider">
                        {r.reservation_code}
                      </span>
                      <BadgeStatut statut={r.status} />
                    </div>
                    <p className="font-semibold text-gray-800">
                      {r.guest_name} · {r.room_type_name}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatPlageDates(r.check_in_date, r.check_out_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Moon className="w-4 h-4" />
                        {r.total_nights} nuit{r.total_nights > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-primary-600 text-xl">{formatPrix(r.total_amount)}</p>
                    {r.status === 'confirmed' && (
                      <button
                        onClick={() => handleAction(r.id, 'check_in')}
                        className="btn-primary btn-sm gap-1.5"
                      >
                        <LogIn className="w-4 h-4" /> Check-in
                      </button>
                    )}
                    {r.status === 'in_progress' && (
                      <button
                        onClick={() => handleAction(r.id, 'check_out')}
                        className="btn-primary btn-sm gap-1.5"
                      >
                        <LogOut className="w-4 h-4" /> Check-out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Historique ── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
        {chargement ? (
          <SectionChargement />
        ) : historique.length === 0 && enCours.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Aucune réservation pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historique.map((r) => (
              <div key={r.id} className="card opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                        {r.booking_number}
                      </span>
                      <BadgeStatut statut={r.status} />
                    </div>
                    <p className="font-semibold text-gray-700 text-sm">
                      {r.guest_name} · {r.room_type_name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatPlageDates(r.check_in_date, r.check_out_date)}
                    </p>
                  </div>
                  <p className="font-bold text-gray-600">{formatPrix(r.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
