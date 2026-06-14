/**
 * Gestion des disponibilités — mise à jour en masse et vue liste.
 */
import React, { useState, useEffect } from 'react'
import { CalendarDays, Loader2, Check, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix } from '../../lib/format'

export function PageDisponibilites() {
  const [chambres, setChambres]     = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(null)
  const [message, setMessage]       = useState(null)
  const [enCours, setEnCours]       = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    room_type_id: '',
    start_date: today,
    end_date: in30,
    available_count: 1,
    special_price: '',
    is_manually_blocked: false,
  })

  useEffect(() => {
    api.get('/owner/rooms/')
      .then(d => {
        const list = d.results || d || []
        setChambres(list)
        if (list.length > 0) setForm(p => ({ ...p, room_type_id: list[0].id }))
      })
      .catch(e => setErreur(e.message))
      .finally(() => setChargement(false))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.room_type_id || !form.start_date || !form.end_date) {
      setMessage({ type: 'erreur', texte: 'Sélectionnez une chambre et une plage de dates.' })
      return
    }
    if (form.start_date > form.end_date) {
      setMessage({ type: 'erreur', texte: 'La date de fin doit être après la date de début.' })
      return
    }
    setEnCours(true)
    setMessage(null)
    try {
      const payload = {
        room_type_id: form.room_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        available_count: Number(form.available_count),
        is_manually_blocked: form.is_manually_blocked,
      }
      if (form.special_price) payload.special_price = Number(form.special_price)

      const data = await api.post('/owner/availability/bulk_update/', payload)
      setMessage({ type: 'succes', texte: data.detail || 'Disponibilités mises à jour avec succès.' })
    } catch (err) {
      setMessage({ type: 'erreur', texte: err.message })
    } finally {
      setEnCours(false)
    }
  }

  if (chargement) return <SectionChargement />
  if (erreur)     return <ErreurPage message={erreur} />

  const chambreSelectionnee = chambres.find(c => c.id === form.room_type_id)
  const nbJours = form.start_date && form.end_date
    ? Math.max(0, Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000)) + 1
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilités</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Définissez la disponibilité et les tarifs sur une plage de dates.
        </p>
      </div>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      {chambres.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Créez d'abord des chambres pour gérer les disponibilités.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Formulaire de mise à jour ── */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                Mise à jour en masse
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Chambre */}
                <div>
                  <label className="label">Chambre *</label>
                  <select value={form.room_type_id} onChange={e => set('room_type_id', e.target.value)} className="input" required>
                    {chambres.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.establishment_name}</option>
                    ))}
                  </select>
                </div>

                {/* Plage de dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date de début *</label>
                    <input type="date" value={form.start_date} min={today} onChange={e => set('start_date', e.target.value)} required className="input" />
                  </div>
                  <div>
                    <label className="label">Date de fin *</label>
                    <input type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} required className="input" />
                  </div>
                </div>

                {nbJours > 0 && (
                  <p className="text-sm text-primary-600 font-medium">
                    → {nbJours} jour{nbJours > 1 ? 's' : ''} sélectionné{nbJours > 1 ? 's' : ''}
                  </p>
                )}

                {/* Disponibilité et prix */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Chambres disponibles</label>
                    <input
                      type="number" min="0"
                      max={chambreSelectionnee?.physical_room_count || 99}
                      value={form.available_count}
                      onChange={e => set('available_count', e.target.value)}
                      disabled={form.is_manually_blocked}
                      className="input disabled:opacity-50"
                    />
                    {chambreSelectionnee && (
                      <p className="text-xs text-gray-400 mt-1">Max : {chambreSelectionnee.physical_room_count}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Tarif spécial (XOF)</label>
                    <input
                      type="number" min="0"
                      value={form.special_price}
                      onChange={e => set('special_price', e.target.value)}
                      disabled={form.is_manually_blocked}
                      className="input disabled:opacity-50"
                      placeholder="Laisser vide = tarif standard"
                    />
                    {chambreSelectionnee && (
                      <p className="text-xs text-gray-400 mt-1">
                        Standard : {formatPrix(chambreSelectionnee.base_price_per_night)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Blocage manuel */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !form.is_manually_blocked
                      set('is_manually_blocked', newVal)
                      if (newVal) set('available_count', 0)
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_manually_blocked ? 'bg-red-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_manually_blocked ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bloquer ces dates</p>
                    <p className="text-xs text-gray-500">Les voyageurs ne pourront pas réserver pendant cette période.</p>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={enCours || !form.room_type_id}
                  className="btn-primary w-full justify-center gap-2 py-3"
                >
                  {enCours
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour...</>
                    : <><Check className="w-4 h-4" /> Appliquer les modifications</>
                  }
                </button>
              </form>
            </div>
          </div>

          {/* ── Résumé / info ── */}
          <div className="space-y-4">
            <div className="card bg-primary-50 border-primary-100">
              <h3 className="font-bold text-primary-800 mb-3">Comment ça marche ?</h3>
              <ul className="space-y-2 text-sm text-primary-700">
                {[
                  'Sélectionnez une chambre et une plage de dates.',
                  'Définissez le nombre de chambres disponibles.',
                  'Ajoutez un tarif spécial (optionnel).',
                  'Bloquez des dates si vous êtes indisponible.',
                  'Cliquez sur "Appliquer" pour sauvegarder.',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {chambreSelectionnee && (
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">Chambre sélectionnée</h3>
                <p className="font-semibold text-gray-900">{chambreSelectionnee.name}</p>
                <p className="text-sm text-gray-500">{chambreSelectionnee.establishment_name}</p>
                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <p>Tarif standard : <strong>{formatPrix(chambreSelectionnee.base_price_per_night)}</strong></p>
                  <p>Chambres physiques : <strong>{chambreSelectionnee.physical_room_count}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
