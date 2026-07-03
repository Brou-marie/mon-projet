/**
 * Page de création / modification d'un établissement.
 * Route : /hebergeur/etablissements/nouveau  (création)
 *         /hebergeur/etablissements/:id      (modification)
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2, MapPin, Clock, FileText, ChevronLeft,
  Loader2, Check, AlertCircle, ImagePlus, X, Star,
} from 'lucide-react'
import { api } from '../../services/api'
import { Alerte } from '../../composants/ui/Alerte'
import { SectionChargement } from '../../composants/ui/Chargement'

const TYPES = [
  { val: 'hotel',      label: 'Hôtel' },
  { val: 'residence',  label: 'Résidence' },
  { val: 'villa',      label: 'Villa' },
  { val: 'apartment',  label: 'Appartement' },
  { val: 'guesthouse', label: "Maison d'hôtes" },
  { val: 'hostel',     label: 'Auberge' },
]

const POLITIQUES = [
  { val: 'flexible',  label: 'Flexible — remboursement intégral jusqu\'à J-1' },
  { val: 'moderate',  label: 'Modérée — remboursement 50% de J-5 à J-1' },
  { val: 'strict',    label: 'Stricte — remboursement 50% jusqu\'à J-7' },
]

const VIDE = {
  name: '',
  description: '',
  establishment_type: 'hotel',
  address: '',
  city: '',
  quarter: '',
  check_in_time: '14:00',
  check_out_time: '11:00',
  cancellation_policy: 'moderate',
  requires_manual_validation: false,
}

function GestionnaireImages({ establishmentId, slug, estEdition, onImagesChange }) {
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Charger les images existantes si édition
  useEffect(() => {
    if (!estEdition || !slug) return
    api.get(`/establishments/${slug}/images/list/`)
      .then(data => {
        const imgs = data || []
        setImages(imgs)
        setPreviews(imgs.map(img => ({ id: img.id, url: img.url, is_primary: img.is_primary, caption: img.caption })))
      })
      .catch(e => console.error('Erreur chargement images:', e))
  }, [estEdition, slug])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      is_primary: previews.length === 0,
      caption: '',
      temp: true
    }))

    setPreviews([...previews, ...newPreviews])
    onImagesChange([...images, ...newPreviews])
  }

  const handleRemove = (index) => {
    const img = previews[index]
    if (!img.temp) {
      // Supprimer du serveur
      api.delete(`/establishments/images/${img.id}/delete/`)
        .then(() => {
          setPreviews(previews.filter((_, i) => i !== index))
          setImages(images.filter(i => i.id !== img.id))
        })
        .catch(e => setErreur(e.message))
    } else {
      // Supprimer localement
      URL.revokeObjectURL(img.url)
      setPreviews(previews.filter((_, i) => i !== index))
    }
  }

  const handleSetPrimary = (index) => {
    const updated = previews.map((p, i) => ({
      ...p,
      is_primary: i === index
    }))
    setPreviews(updated)
    
    // Mettre à jour sur le serveur si image existante
    const img = updated[index]
    if (!img.temp && img.id) {
      api.patch(`/establishments/images/${img.id}/`, { is_primary: true })
        .catch(e => console.error('Erreur mise à jour primaire:', e))
    }
  }

  const handleCaptionChange = (index, caption) => {
    const updated = [...previews]
    updated[index].caption = caption
    setPreviews(updated)
    
    // Mettre à jour sur le serveur si image existante
    const img = updated[index]
    if (!img.temp && img.id) {
      api.patch(`/establishments/images/${img.id}/`, { caption })
        .catch(e => console.error('Erreur mise à jour caption:', e))
    }
  }

  const uploadImages = async () => {
    const newImages = previews.filter(p => p.temp)
    if (newImages.length === 0) return

    setChargement(true)
    setErreur(null)

    try {
      const formData = new FormData()
      newImages.forEach((p, i) => {
        formData.append('images', p.file)
        if (p.caption) formData.append('caption', p.caption)
      })

      const uploaded = await api.post(`/establishments/${slug}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setPreviews(uploaded.map(img => ({ id: img.id, url: img.url, is_primary: img.is_primary, caption: img.caption })))
      setImages(uploaded)
      return uploaded
    } catch (e) {
      setErreur(e.message)
      throw e
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="label">Photos</label>
        <label className="btn-secondary text-sm gap-2 cursor-pointer">
          <ImagePlus className="w-4 h-4" />
          Ajouter des photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {erreur && <Alerte type="erreur" message={erreur} onFermer={() => setErreur(null)} />}

      {previews.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((img, index) => (
            <div key={img.id || index} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                <img
                  src={img.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Principale
                  </div>
                )}
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(index)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    type="button"
                  >
                    Définir comme principale
                  </button>
                )}
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  placeholder="Légende (optionnel)"
                  className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucune photo ajoutée</p>
        </div>
      )}

      {chargement && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Téléchargement en cours...
        </div>
      )}
    </div>
  )
}

// Étape dans le formulaire multi-sections
function SectionFormulaire({ numero, titre, Icone, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icone className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="font-bold text-gray-900">{titre}</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{numero}</span>
      </div>
      {children}
    </div>
  )
}

export function PageFormulaireEtablissement() {
  const { id } = useParams()        // undefined = création, sinon = édition
  const navigate = useNavigate()
  const estEdition = Boolean(id)

  const [form, setForm] = useState(VIDE)
  const [chargement, setChargement] = useState(estEdition)
  const [enSoumission, setEnSoumission] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [succes, setSucces] = useState(null)
  const [slug, setSlug] = useState(null)
  const [imagesManager, setImagesManager] = useState(null)

  // Si édition : charger les données existantes
  useEffect(() => {
    if (!estEdition) return
    api.get(`/owner/establishments/${id}/`)
      .then((data) => {
        setForm({
          name: data.name || '',
          description: data.description || '',
          establishment_type: data.establishment_type || 'hotel',
          address: data.address || '',
          city: data.city || '',
          quarter: data.quarter || '',
          check_in_time: data.check_in_time?.slice(0, 5) || '14:00',
          check_out_time: data.check_out_time?.slice(0, 5) || '11:00',
          cancellation_policy: data.cancellation_policy || 'moderate',
          requires_manual_validation: data.requires_manual_validation || false,
        })
        setSlug(data.slug)
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }, [id, estEdition])

  const handleChange = (champ, val) => setForm((p) => ({ ...p, [champ]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnSoumission(true)
    setErreur(null)

    // Validation locale
    if (!form.name.trim()) { setErreur('Le nom est requis.'); setEnSoumission(false); return }
    if (!form.description.trim()) { setErreur('La description est requise.'); setEnSoumission(false); return }
    if (!form.city.trim()) { setErreur('La ville est requise.'); setEnSoumission(false); return }
    if (!form.address.trim()) { setErreur('L\'adresse est requise.'); setEnSoumission(false); return }

    try {
      let resultat
      if (estEdition) {
        resultat = await api.patch(`/owner/establishments/${id}/`, form)
        // Upload des nouvelles images si présentes
        if (imagesManager && imagesManager.uploadImages) {
          await imagesManager.uploadImages()
        }
        setSucces('Établissement mis à jour avec succès.')
        setTimeout(() => navigate('/hebergeur/etablissements'), 1500)
      } else {
        resultat = await api.post('/owner/establishments/', form)
        setSlug(resultat.slug)
        // Upload des images après création
        if (imagesManager && imagesManager.uploadImages) {
          await imagesManager.uploadImages()
        }
        navigate('/hebergeur/etablissements', {
          state: { succes: `Établissement "${resultat.name}" créé ! Il est en attente de validation.` },
        })
      }
    } catch (e) {
      const detail = e.details
      if (detail && typeof detail === 'object') {
        const msgs = Object.entries(detail)
          .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        setErreur(msgs)
      } else {
        setErreur(e.message || 'Une erreur est survenue.')
      }
    } finally {
      setEnSoumission(false)
    }
  }

  if (chargement) return <SectionChargement />

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">

      {/* En-tête */}
      <div>
        <button
          onClick={() => navigate('/hebergeur/etablissements')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 text-sm font-medium group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Mes établissements
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {estEdition ? 'Modifier l\'établissement' : 'Créer un établissement'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {estEdition
            ? 'Mettez à jour les informations de votre établissement.'
            : 'Renseignez les informations de votre hébergement. Il sera soumis à validation.'}
        </p>
      </div>

      {erreur && <Alerte type="erreur" titre="Erreur" message={erreur} onFermer={() => setErreur(null)} />}
      {succes && <Alerte type="succes" message={succes} />}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Section 1 : Informations générales ── */}
        <SectionFormulaire numero="1/5" titre="Informations générales" Icone={Building2}>
          <div className="space-y-4">
            <div>
              <label className="label">Nom de l'établissement *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                maxLength={200}
                className="input"
                placeholder="Ex : Résidence Le Plateau, Hôtel Palm Beach..."
              />
            </div>

            <div>
              <label className="label">Type d'établissement *</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleChange('establishment_type', val)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.establishment_type === val
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                rows={5}
                maxLength={2000}
                className="input resize-none"
                placeholder="Décrivez votre établissement : ambiance, atouts, services, proximité des transports..."
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
            </div>
          </div>
        </SectionFormulaire>

        {/* ── Section 2 : Localisation ── */}
        <SectionFormulaire numero="2/5" titre="Localisation" Icone={MapPin}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ville *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                  className="input"
                  placeholder="Ex : Abidjan"
                />
              </div>
              <div>
                <label className="label">Quartier</label>
                <input
                  type="text"
                  value={form.quarter}
                  onChange={(e) => handleChange('quarter', e.target.value)}
                  className="input"
                  placeholder="Ex : Plateau, Cocody..."
                />
              </div>
            </div>
            <div>
              <label className="label">Adresse complète *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
                className="input"
                placeholder="Numéro et nom de rue, bâtiment..."
              />
            </div>
          </div>
        </SectionFormulaire>

        {/* ── Section 3 : Horaires ── */}
        <SectionFormulaire numero="3/5" titre="Horaires d'accueil" Icone={Clock}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Heure d'arrivée (check-in)</label>
              <input
                type="time"
                value={form.check_in_time}
                onChange={(e) => handleChange('check_in_time', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Heure de départ (check-out)</label>
              <input
                type="time"
                value={form.check_out_time}
                onChange={(e) => handleChange('check_out_time', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </SectionFormulaire>

        {/* ── Section 4 : Politique ── */}
        <SectionFormulaire numero="4/5" titre="Politique et options" Icone={FileText}>
          <div className="space-y-5">
            <div>
              <label className="label">Politique d'annulation</label>
              <div className="space-y-2 mt-2">
                {POLITIQUES.map(({ val, label }) => (
                  <label
                    key={val}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.cancellation_policy === val
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellation_policy"
                      value={val}
                      checked={form.cancellation_policy === val}
                      onChange={() => handleChange('cancellation_policy', val)}
                      className="accent-primary-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.requires_manual_validation}
                    onChange={(e) => handleChange('requires_manual_validation', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.requires_manual_validation ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.requires_manual_validation ? 'translate-x-5' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Validation manuelle des réservations</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Si activé, vous devrez approuver chaque réservation manuellement dans les 24h après le paiement.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </SectionFormulaire>

        {/* ── Section 5 : Photos ── */}
        <SectionFormulaire numero="5/5" titre="Photos" Icone={ImagePlus}>
          <GestionnaireImages
            establishmentId={id}
            slug={slug}
            estEdition={estEdition}
            onImagesChange={setImagesManager}
          />
        </SectionFormulaire>

        {/* ── Boutons ── */}
        <div className="flex gap-4 pb-6">
          <button
            type="button"
            onClick={() => navigate('/hebergeur/etablissements')}
            className="btn-secondary flex-1"
            disabled={enSoumission}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={enSoumission}
            className="btn-primary flex-1 justify-center gap-2"
          >
            {enSoumission ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            ) : estEdition ? (
              <><Check className="w-4 h-4" /> Enregistrer les modifications</>
            ) : (
              <><Building2 className="w-4 h-4" /> Créer l'établissement</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
