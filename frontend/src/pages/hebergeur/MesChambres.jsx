/**
 * CRUD complet des chambres pour l'hébergeur.
 * Création, modification, activation/désactivation, suppression.
 */
import React, { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, BedDouble, Users, Maximize2,
  ToggleLeft, ToggleRight, Loader2, X, Check,
} from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage, Alerte } from '../../composants/ui/Alerte'
import { formatPrix } from '../../lib/format'
import { getImageChambre } from '../../lib/images'

// ── Formulaire chambre (création + édition) ───────────────────────────────

function ModalChambre({ chambre, etablissements, onSauvegarder, onFermer }) {
  const estEdition = Boolean(chambre?.id)
  const [form, setForm] = useState({
    establishment: chambre?.establishment || etablissements[0]?.id || '',
    name: chambre?.name || '',
    description: chambre?.description || '',
    capacity_adults: chambre?.capacity_adults ?? 2,
    capacity_children: chambre?.capacity_children ?? 0,
    base_price_per_night: chambre?.base_price_per_night || '',
    physical_room_count: chambre?.physical_room_count ?? 1,
    size_sqm: chambre?.size_sqm || '',
    bed_type: chambre?.bed_type || '',
    is_active: chambre?.is_active ?? true,
  })
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.base_price_per_night || !form.establishment) {
      setErreur('Nom, établissement et prix sont obligatoires.')
      return
    }
    setEnCours(true)
    setErreur(null)
    try {
      const payload = {
        ...form,
        capacity_adults: Number(form.capacity_adults),
        capacity_children: Number(form.capacity_children),
        base_price_per_night: Number(form.base_price_per_night),
        physical_room_count: Number(form.physical_room_count),
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      }
      let result
      if (estEdition) {
        result = await api.patch(`/owner/rooms/${chambre.id}/`, payload)
      } else {
        result = await api.post('/owner/rooms/', payload)
      }
      onSauvegarder(result, estEdition)
    } catch (err) {
      const d = err.details
      if (d && typeof d === 'object') {
        setErreur(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '))
      } else {
        setErreur(err.message)
      }
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {estEdition ? 'Modifier la chambre' : 'Ajouter une chambre'}
          </h2>
          <button onClick={onFermer} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {erreur && <Alerte type="erreur" message={erreur} onFermer={() => setErreur(null)} />}

          <div>
            <label className="label">Établissement *</label>
            <select value={form.establishment} onChange={e => set('establishment', e.target.value)} required className="input">
              {etablissements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom de la chambre *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder="Ex: Chambre Standard, Suite Junior..." />
            </div>
            <div>
              <label className="label">Type de lit</label>
              <input type="text" value={form.bed_type} onChange={e => set('bed_type', e.target.value)} className="input" placeholder="King Size, Twin, Double..." />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input resize-none" placeholder="Vue sur la mer, climatisation, TV câble..." />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Adultes max *</label>
              <input type="number" min="1" max="20" value={form.capacity_adults} onChange={e => set('capacity_adults', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Enfants max</label>
              <input type="number" min="0" max="10" value={form.capacity_children} onChange={e => set('capacity_children', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Nb chambres *</label>
              <input type="number" min="1" max="100" value={form.physical_room_count} onChange={e => set('physical_room_count', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Surface (m²)</label>
              <input type="number" min="1" value={form.size_sqm} onChange={e => set('size_sqm', e.target.value)} className="input" placeholder="—" />
            </div>
          </div>

          <div>
            <label className="label">Prix par nuit (XOF) *</label>
            <input type="number" min="1000" value={form.base_price_per_night} onChange={e => set('base_price_per_night', e.target.value)} required className="input" placeholder="Ex: 25000" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => set('is_active', !form.is_active)} className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {form.is_active ? 'Chambre active (visible et réservable)' : 'Chambre désactivée'}
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onFermer} className="btn-secondary flex-1" disabled={enCours}>Annuler</button>
            <button type="submit" disabled={enCours} className="btn-primary flex-1 justify-center gap-2">
              {enCours ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Check className="w-4 h-4" /> {estEdition ? 'Modifier' : 'Créer la chambre'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────

export function PageMesChambres() {
  const [chambres, setChambres]       = useState([])
  const [etablissements, setEtab]     = useState([])
  const [chargement, setChargement]   = useState(true)
  const [erreur, setErreur]           = useState(null)
  const [message, setMessage]         = useState(null)
  const [modal, setModal]             = useState(null) // null | 'nouveau' | chambre

  const charger = async () => {
    setChargement(true)
    try {
      const [ch, et] = await Promise.all([
        api.get('/owner/rooms/'),
        api.get('/owner/establishments/'),
      ])
      setChambres(ch.results || ch || [])
      setEtab(et.results || et || [])
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  const handleSauvegarder = (chambre, estEdition) => {
    if (estEdition) {
      setChambres(prev => prev.map(c => c.id === chambre.id ? chambre : c))
      setMessage({ type: 'succes', texte: 'Chambre modifiée avec succès.' })
    } else {
      setChambres(prev => [chambre, ...prev])
      setMessage({ type: 'succes', texte: 'Chambre créée avec succès.' })
    }
    setModal(null)
  }

  const handleToggleActif = async (chambre) => {
    try {
      const result = await api.patch(`/owner/rooms/${chambre.id}/`, { is_active: !chambre.is_active })
      setChambres(prev => prev.map(c => c.id === chambre.id ? { ...c, is_active: result.is_active } : c))
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message })
    }
  }

  const handleSupprimer = async (id, nom) => {
    if (!confirm(`Supprimer la chambre "${nom}" ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/owner/rooms/${id}/`)
      setChambres(prev => prev.filter(c => c.id !== id))
      setMessage({ type: 'succes', texte: 'Chambre supprimée.' })
    } catch (e) {
      setMessage({ type: 'erreur', texte: e.message })
    }
  }

  if (chargement) return <SectionChargement />
  if (erreur)     return <ErreurPage message={erreur} onReessayer={charger} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modal */}
      {modal && (
        <ModalChambre
          chambre={modal === 'nouveau' ? null : modal}
          etablissements={etablissements}
          onSauvegarder={handleSauvegarder}
          onFermer={() => setModal(null)}
        />
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes chambres</h1>
          <p className="text-gray-500 text-sm mt-0.5">{chambres.length} type{chambres.length > 1 ? 's' : ''} de chambre</p>
        </div>
        {etablissements.length > 0 && (
          <button onClick={() => setModal('nouveau')} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            Nouvelle chambre
          </button>
        )}
      </div>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      {etablissements.length === 0 ? (
        <div className="card text-center py-14">
          <Building2Icon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-600 mb-2">Aucun établissement</h2>
          <p className="text-gray-400 text-sm">Créez d'abord un établissement avant d'ajouter des chambres.</p>
        </div>
      ) : chambres.length === 0 ? (
        <div className="card text-center py-14">
          <BedDouble className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-600 mb-2">Aucune chambre</h2>
          <p className="text-gray-400 text-sm mb-5">Ajoutez vos types de chambres pour commencer à recevoir des réservations.</p>
          <button onClick={() => setModal('nouveau')} className="btn-primary gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Ajouter une chambre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {chambres.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${c.is_active ? 'border-gray-100 hover:shadow-md' : 'border-gray-200 opacity-70'}`}>
              {/* Image */}
              <div className="relative h-36 bg-gray-100 overflow-hidden">
                <img
                  src={getImageChambre(c.name)}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getImageChambre('standard') }}
                />
                {!c.is_active && (
                  <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                    <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">Désactivée</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{c.establishment_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary-600">{formatPrix(c.base_price_per_night)}</p>
                    <p className="text-xs text-gray-400">/ nuit</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" /> {c.capacity_adults} adulte{c.capacity_adults > 1 ? 's' : ''}
                  </span>
                  {c.bed_type && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <BedDouble className="w-3.5 h-3.5" /> {c.bed_type}
                    </span>
                  )}
                  {c.size_sqm && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Maximize2 className="w-3.5 h-3.5" /> {c.size_sqm} m²
                    </span>
                  )}
                  <span className="bg-gray-50 px-2 py-1 rounded-lg">{c.physical_room_count} chambre{c.physical_room_count > 1 ? 's' : ''}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 py-2 rounded-xl transition-all"
                  >
                    <Pencil className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => handleToggleActif(c)}
                    className={`px-3 py-2 rounded-xl border transition-all ${c.is_active ? 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                    title={c.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {c.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleSupprimer(c.id, c.name)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// icône manquante
function Building2Icon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  )
}
