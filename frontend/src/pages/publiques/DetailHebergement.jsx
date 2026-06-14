import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Star, MapPin, Clock, Users, BedDouble, Maximize2, ChevronLeft,
  ChevronRight, Heart, Share2, Wifi, Car, Waves, Wind, Coffee,
  Utensils, Dumbbell, Sparkles, Shield, Check, ArrowLeft,
} from 'lucide-react'
import { api } from '../../services/api'
import { BadgeStatut } from '../../composants/ui/Badge'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage } from '../../composants/ui/Alerte'
import { useAuth } from '../../contextes/AuthContexte'
import { getImageHebergement, getImageChambre } from '../../lib/images'
import { formatPrix, TYPES_ETAB, POLITIQUES } from '../../lib/format'

// ── Icônes d'équipements ──────────────────────────────────────────────────

const ICONES_AMENITY = {
  wifi: Wifi, parking: Car, pool: Waves, ac: Wind,
  breakfast: Coffee, restaurant: Utensils, gym: Dumbbell,
  spa: Sparkles,
}

function IconeAmenity({ category }) {
  const Icone = ICONES_AMENITY[category] || Shield
  return <Icone className="w-4 h-4" />
}

// ── Galerie photos ────────────────────────────────────────────────────────

function Galerie({ images, nom, type }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [aimee, setAimee] = useState(false)

  // Construit la liste d'images (API + fallback Unsplash)
  const liste = images && images.length > 0
    ? images.map((img) => img.url || img.image || null).filter(Boolean)
    : [
        getImageHebergement(type, 0),
        getImageHebergement(type, 1),
        getImageHebergement(type, 2),
      ]

  const prev = (e) => { e?.stopPropagation(); setIdx((i) => (i - 1 + liste.length) % liste.length) }
  const next = (e) => { e?.stopPropagation(); setIdx((i) => (i + 1) % liste.length) }

  return (
    <>
      <div className="relative">
        {/* Image principale */}
        <div
          className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-200 cursor-pointer"
          onClick={() => setLightbox(true)}
        >
          <img
            src={liste[idx]}
            alt={nom}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.src = getImageHebergement(type, 1) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setAimee(!aimee) }}
              className={`p-2.5 rounded-xl backdrop-blur-sm transition-all ${aimee ? 'bg-red-500 text-white' : 'bg-white/85 text-gray-700 hover:bg-white'}`}
            >
              <Heart className={`w-5 h-5 ${aimee ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2.5 bg-white/85 backdrop-blur-sm text-gray-700 hover:bg-white rounded-xl transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          {liste.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/85 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/85 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {liste.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/60'}`}
                  />
                ))}
              </div>
              <span className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                {idx + 1}/{liste.length}
              </span>
            </>
          )}
        </div>

        {/* Miniatures */}
        {liste.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {liste.map((src, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all ${i === idx ? 'ring-2 ring-primary-500 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(false)}>
            <ChevronLeft className="w-8 h-8 rotate-[-90deg]" />
          </button>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img src={liste[idx]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </>
  )
}

// ── Carte chambre ─────────────────────────────────────────────────────────

function CarteChambre({ chambre, onReserver }) {
  const imgSrc = chambre.primary_image?.url || chambre.primary_image?.image || getImageChambre(chambre.name)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200 bg-white">
      {/* Image chambre */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={chambre.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = getImageChambre('standard') }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-2">
          {chambre.capacity_adults && (
            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" /> {chambre.capacity_adults}
            </span>
          )}
          {chambre.size_sqm && (
            <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> {chambre.size_sqm}m²
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-gray-900">{chambre.name}</h3>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-primary-600">
              {formatPrix(chambre.base_price_per_night)}
            </p>
            <p className="text-xs text-gray-400">/ nuit</p>
          </div>
        </div>

        {chambre.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{chambre.description}</p>
        )}

        {chambre.bed_type && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <BedDouble className="w-4 h-4 text-gray-400" /> {chambre.bed_type}
          </p>
        )}

        {chambre.amenities && chambre.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {chambre.amenities.slice(0, 4).map((a) => (
              <span key={a.id} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-100">
                <IconeAmenity category={a.category} />
                {a.name}
              </span>
            ))}
            {chambre.amenities.length > 4 && (
              <span className="text-xs text-gray-400 px-2 py-1">+{chambre.amenities.length - 4}</span>
            )}
          </div>
        )}

        <button onClick={() => onReserver(chambre)} className="btn-primary w-full justify-center">
          Réserver cette chambre
        </button>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────

export function PageDetailHebergement() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { estConnecte, estVoyageur } = useAuth()
  const [h, setH] = useState(null)
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    Promise.allSettled([
      api.get(`/public/hebergements/${slug}/`),
      api.get(`/public/hebergements/${slug}/avis/`),
    ]).then(([rH, rA]) => {
      if (rH.status === 'fulfilled') setH(rH.value)
      else setErreur(rH.reason?.message || 'Hébergement introuvable')
      if (rA.status === 'fulfilled') setAvis(rA.value.results || rA.value || [])
    }).finally(() => setChargement(false))
  }, [slug])

  const handleReserver = (chambre) => {
    if (!estConnecte) {
      navigate('/connexion', { state: { depuis: `/hebergements/${slug}` } })
      return
    }
    if (!estVoyageur) return
    navigate(`/reservation/${slug}?chambre=${chambre.id}`)
  }

  if (chargement) return <div className="py-20"><SectionChargement /></div>
  if (erreur || !h) return (
    <div className="section py-20">
      <ErreurPage message={erreur || 'Introuvable'} onReessayer={() => window.location.reload()} />
    </div>
  )

  const note = h.avg_rating > 0 ? Number(h.avg_rating).toFixed(1) : null

  return (
    <div className="bg-white min-h-screen">
      <div className="section py-8">

        {/* Breadcrumb */}
        <button onClick={() => navigate('/hebergements')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux hébergements
        </button>

        {/* Titre + badges */}
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <span className="badge-bleu">{TYPES_ETAB[h.establishment_type] || h.establishment_type}</span>
          {h.is_featured && <span className="badge-vert">En vedette</span>}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{h.name}</h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
          {note && (
            <span className="flex items-center gap-1.5 text-gray-700 font-semibold">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {note}
              <span className="text-gray-400 font-normal">({h.review_count} avis)</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-500" />
            {h.city}{h.quarter ? `, ${h.quarter}` : ''}
          </span>
        </div>

        {/* Galerie */}
        <Galerie images={h.images} nom={h.name} type={h.establishment_type} />

        {/* Corps */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-10">

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">À propos</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{h.description}</p>
            </section>

            <div className="divider" />

            {/* Infos pratiques */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations pratiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { Icone: Clock, label: 'Arrivée', val: h.check_in_time },
                  { Icone: Clock, label: 'Départ', val: h.check_out_time },
                  { Icone: Shield, label: 'Annulation', val: POLITIQUES[h.cancellation_policy] },
                ].map(({ Icone, label, val }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icone className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-700">{val || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {h.requires_manual_validation && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Cet hébergement nécessite une <strong>validation manuelle</strong> de l'hébergeur après paiement.
                    Votre réservation sera confirmée dans les 24h.
                  </p>
                </div>
              )}
            </section>

            <div className="divider" />

            {/* Chambres */}
            {h.room_types?.filter((c) => c.is_active).length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Chambres disponibles
                  <span className="text-base font-normal text-gray-400 ml-2">
                    ({h.room_types.filter((c) => c.is_active).length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {h.room_types.filter((c) => c.is_active).map((c) => (
                    <CarteChambre key={c.id} chambre={c} onReserver={handleReserver} />
                  ))}
                </div>
              </section>
            )}

            <div className="divider" />

            {/* Avis */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {note && (
                    <span className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {note} · {h.review_count} avis
                    </span>
                  )}
                  {!note && 'Avis des voyageurs'}
                </h2>
              </div>

              {avis.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <Star className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">Aucun avis pour le moment.</p>
                  <p className="text-gray-300 text-xs mt-1">Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {avis.map((a) => (
                    <div key={a.id} className="p-4 border border-gray-100 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                          {(a.reviewer_name || 'V')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{a.reviewer_name || 'Voyageur'}</p>
                          <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < a.rating_overall ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{a.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Colonne sticky */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {h.room_types?.filter((c) => c.is_active).length > 0 && (
                <div className="card border border-gray-200 shadow-md">
                  <p className="text-sm text-gray-500 mb-1">À partir de</p>
                  <p className="text-3xl font-bold text-gray-900 mb-0.5">
                    {formatPrix(Math.min(...h.room_types.filter((c) => c.is_active).map((c) => c.base_price_per_night)))}
                  </p>
                  <p className="text-sm text-gray-400 mb-5">par nuit</p>

                  {estConnecte && estVoyageur ? (
                    <button
                      onClick={() => handleReserver(h.room_types.filter((c) => c.is_active)[0])}
                      className="btn-primary w-full btn-lg justify-center"
                    >
                      Voir les chambres
                    </button>
                  ) : (
                    <Link to="/connexion" className="btn-primary w-full btn-lg justify-center block text-center">
                      Se connecter pour réserver
                    </Link>
                  )}

                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Paiement sécurisé par Wave / Orange Money
                  </p>
                </div>
              )}

              <div className="card bg-gray-50 border-0">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Ce que propose cet hébergement</h3>
                <ul className="space-y-2">
                  {[
                    'Réservation instantanée',
                    'Paiement local accepté',
                    `Annulation ${POLITIQUES[h.cancellation_policy] || ''}`.trim(),
                    `Arrivée à ${h.check_in_time || '14:00'}`,
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
