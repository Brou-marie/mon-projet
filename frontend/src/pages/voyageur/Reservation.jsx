/**
 * Page de réservation — sélection chambre, dates, estimation prix, confirmation.
 * Le backend attend : room_type_id, check_in_date, check_out_date,
 *                     guest_count_adults, guest_count_children, guest_notes
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Calendar, Users, BedDouble, Shield, Check,
  ChevronLeft, AlertCircle, Loader2, Star,
} from 'lucide-react'
import { api } from '../../services/api'
import { SectionChargement } from '../../composants/ui/Chargement'
import { Alerte } from '../../composants/ui/Alerte'
import { formatPrix, TYPES_ETAB } from '../../lib/format'
import { getImageHebergement, getImageChambre } from '../../lib/images'

// ── Composant résumé prix ─────────────────────────────────────────────────

function ResumePrix({ estimation, chambre, chargement }) {
  if (chargement) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Calcul du prix...
      </div>
    )
  }
  if (!estimation) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Sélectionnez des dates pour voir le prix.
      </p>
    )
  }
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {formatPrix(chambre?.base_price_per_night)} × {estimation.total_nights} nuit{estimation.total_nights > 1 ? 's' : ''}
        </span>
        <span className="font-medium">{formatPrix(estimation.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Frais de service</span>
        <span className="font-medium">{formatPrix(estimation.platform_fee)}</span>
      </div>
      {estimation.tax_amount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Taxes</span>
          <span className="font-medium">{formatPrix(estimation.tax_amount)}</span>
        </div>
      )}
      <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold">
        <span>Total</span>
        <span className="text-primary-600 text-lg">{formatPrix(estimation.total_amount)}</span>
      </div>
      {!estimation.available && estimation.unavailable_dates?.length > 0 && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-xs mt-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Certaines dates sont indisponibles.
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────

export function PageReservation() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const chambreIdInitial = searchParams.get('chambre')
  const navigate = useNavigate()

  const [hebergement, setHebergement] = useState(null)
  const [chambre, setChambre] = useState(null)
  const [chargementPage, setChargementPage] = useState(true)
  const [estimation, setEstimation] = useState(null)
  const [chargementEstim, setChargementEstim] = useState(false)
  const [enSoumission, setEnSoumission] = useState(false)
  const [erreur, setErreur] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    check_in_date: today,
    check_out_date: demain,
    guest_count_adults: 1,
    guest_count_children: 0,
    guest_notes: '',
  })

  // Charger l'hébergement
  useEffect(() => {
    window.scrollTo(0, 0)
    api.get(`/public/hebergements/${slug}/`)
      .then((data) => {
        setHebergement(data)
        const chambresActives = data.room_types?.filter((c) => c.is_active) || []
        const cible = chambreIdInitial
          ? chambresActives.find((c) => c.id === chambreIdInitial)
          : chambresActives[0]
        setChambre(cible || chambresActives[0] || null)
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargementPage(false))
  }, [slug, chambreIdInitial])

  // Estimation prix automatique (avec debounce)
  const estimerPrix = useCallback(async () => {
    if (!chambre || !form.check_in_date || !form.check_out_date) return
    if (form.check_in_date >= form.check_out_date) return

    setChargementEstim(true)
    setEstimation(null)
    try {
      const data = await api.post('/public/hebergements/disponibilite/', {
        room_type_id: chambre.id,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
      })
      setEstimation(data)
    } catch {
      setEstimation(null)
    } finally {
      setChargementEstim(false)
    }
  }, [chambre, form.check_in_date, form.check_out_date])

  useEffect(() => {
    const t = setTimeout(estimerPrix, 500)
    return () => clearTimeout(t)
  }, [estimerPrix])

  const handleChange = (champ, val) => setForm((p) => ({ ...p, [champ]: val }))

  // Soumission de la réservation
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!chambre) return
    if (!estimation?.available) {
      setErreur('Ces dates ne sont pas disponibles pour cette chambre.')
      return
    }

    setEnSoumission(true)
    setErreur(null)

    try {
      // Le backend attend room_type_id (pas room_type)
      const payload = {
        room_type_id: chambre.id,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        guest_count_adults: Number(form.guest_count_adults),
        guest_count_children: Number(form.guest_count_children),
        guest_notes: form.guest_notes,
      }
      const data = await api.post('/bookings/', payload)
      navigate('/voyageur/reservations', {
        state: { succes: `Réservation ${data.booking_number} créée ! En attente de paiement.` },
      })
    } catch (e) {
      // Extraire le détail de l'erreur Django
      const detail = e.details
      if (detail && typeof detail === 'object') {
        const msgs = Object.entries(detail)
          .map(([k, v]) => Array.isArray(v) ? v.join(', ') : v)
          .join(' | ')
        setErreur(msgs)
      } else {
        setErreur(e.message || 'Une erreur est survenue.')
      }
    } finally {
      setEnSoumission(false)
    }
  }

  if (chargementPage) return <div className="py-20 section"><SectionChargement /></div>

  if (!hebergement) {
    return (
      <div className="py-20 section text-center">
        <p className="text-gray-400">Hébergement introuvable.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">Retour</button>
      </div>
    )
  }

  const chambresActives = hebergement.room_types?.filter((c) => c.is_active) || []
  const imgSrc = (hebergement.images?.[0]?.url) || getImageHebergement(hebergement.establishment_type)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section py-8">

        {/* Retour */}
        <button
          onClick={() => navigate(`/hebergements/${slug}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 group text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour à l'hébergement
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Finaliser la réservation</h1>
        <p className="text-gray-500 text-sm mb-8">
          {hebergement.name} · {TYPES_ETAB[hebergement.establishment_type]}
        </p>

        {erreur && (
          <div className="mb-6">
            <Alerte type="erreur" titre="Erreur de réservation" message={erreur} onFermer={() => setErreur(null)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Formulaire (3/5) ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Sélection chambre */}
            {chambresActives.length > 1 && (
              <div className="card">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-primary-600" />
                  Choisir le type de chambre
                </h2>
                <div className="space-y-3">
                  {chambresActives.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        chambre?.id === c.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="chambre"
                        checked={chambre?.id === c.id}
                        onChange={() => setChambre(c)}
                        className="w-4 h-4 text-primary-600 accent-primary-600"
                      />
                      {/* Image miniature */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={c.primary_image?.url || getImageChambre(c.name)}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = getImageChambre('standard') }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c.capacity_adults} adulte{c.capacity_adults > 1 ? 's' : ''}
                          {c.bed_type ? ` · ${c.bed_type}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary-600 text-sm">
                          {formatPrix(c.base_price_per_night)}
                        </p>
                        <p className="text-xs text-gray-400">/ nuit</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Dates du séjour
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Arrivée</label>
                  <input
                    type="date"
                    value={form.check_in_date}
                    min={today}
                    onChange={(e) => handleChange('check_in_date', e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Départ</label>
                  <input
                    type="date"
                    value={form.check_out_date}
                    min={form.check_in_date || today}
                    onChange={(e) => handleChange('check_out_date', e.target.value)}
                    required
                    className="input"
                  />
                </div>
              </div>
              {form.check_in_date >= form.check_out_date && form.check_out_date && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  La date de départ doit être après la date d'arrivée.
                </p>
              )}
            </div>

            {/* Voyageurs */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Voyageurs
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Adultes</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('guest_count_adults', Math.max(1, Number(form.guest_count_adults) - 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >−</button>
                    <span className="w-8 text-center font-bold text-lg">{form.guest_count_adults}</span>
                    <button
                      type="button"
                      onClick={() => handleChange('guest_count_adults', Math.min(chambre?.capacity_adults || 10, Number(form.guest_count_adults) + 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >+</button>
                  </div>
                  {chambre && (
                    <p className="text-xs text-gray-400 mt-1">Max {chambre.capacity_adults}</p>
                  )}
                </div>
                <div>
                  <label className="label">Enfants</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('guest_count_children', Math.max(0, Number(form.guest_count_children) - 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >−</button>
                    <span className="w-8 text-center font-bold text-lg">{form.guest_count_children}</span>
                    <button
                      type="button"
                      onClick={() => handleChange('guest_count_children', Math.min(chambre?.capacity_children || 5, Number(form.guest_count_children) + 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >+</button>
                  </div>
                  {chambre && (
                    <p className="text-xs text-gray-400 mt-1">Max {chambre.capacity_children}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3">Message à l'hébergeur</h2>
              <textarea
                value={form.guest_notes}
                onChange={(e) => handleChange('guest_notes', e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Heure d'arrivée approximative, demandes spéciales, allergies..."
              />
            </div>

            {/* Bouton mobile — submit */}
            <div className="lg:hidden">
              <button
                onClick={handleSubmit}
                disabled={enSoumission || chargementEstim || !estimation?.available}
                className="btn-primary w-full btn-lg justify-center"
              >
                {enSoumission
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Réservation en cours...</>
                  : estimation?.available === false
                    ? 'Dates indisponibles'
                    : 'Confirmer la réservation'
                }
              </button>
            </div>
          </div>

          {/* ── Résumé sticky (2/5) ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 space-y-4">

              {/* Card hébergement */}
              <div className="card p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={imgSrc} alt={hebergement.name} className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getImageHebergement('hotel') }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 line-clamp-2">{hebergement.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{hebergement.city}</p>
                    {hebergement.avg_rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium">{Number(hebergement.avg_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {chambre && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Chambre sélectionnée</p>
                    <p className="font-semibold text-sm text-gray-800 mt-0.5">{chambre.name}</p>
                  </div>
                )}
              </div>

              {/* Détail prix */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Détail du prix</h3>
                <ResumePrix estimation={estimation} chambre={chambre} chargement={chargementEstim} />
              </div>

              {/* Bouton desktop */}
              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  disabled={enSoumission || chargementEstim || !estimation?.available}
                  className="btn-primary w-full btn-lg justify-center"
                >
                  {enSoumission
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> En cours...</>
                    : chargementEstim
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Calcul...</>
                      : estimation?.available === false
                        ? 'Dates indisponibles'
                        : 'Confirmer la réservation'
                  }
                </button>
              </form>

              {/* Garanties */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <ul className="space-y-2">
                  {[
                    'Paiement sécurisé Wave / Orange Money',
                    'Annulation selon la politique de l\'hébergeur',
                    'Confirmation immédiate par email',
                  ].map((g) => (
                    <li key={g} className="flex items-center gap-2 text-xs text-gray-500">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
