import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, Heart } from 'lucide-react'
import { getImageHebergement } from '../../lib/images'
import { formatPrix, TYPES_ETAB } from '../../lib/format'

export function CarteHebergement({ hebergement, prioritaire = false }) {
  const [aimee, setAimee] = useState(false)
  const {
    slug, name, city, quarter,
    establishment_type, avg_rating, review_count,
    primary_image, lowest_price, is_featured,
  } = hebergement

  // Image : API ou fallback Unsplash
  const srcImg = primary_image || getImageHebergement(establishment_type)
  const note = avg_rating > 0 ? Number(avg_rating).toFixed(1) : null

  return (
    <Link
      to={`/hebergements/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-250"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
        <img
          src={srcImg}
          alt={name}
          loading={prioritaire ? 'eager' : 'lazy'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = getImageHebergement(establishment_type, 1)
          }}
        />
        {/* Overlay gradient bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favori */}
        <button
          onClick={(e) => { e.preventDefault(); setAimee(!aimee) }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200
            ${aimee ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
          aria-label={aimee ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 ${aimee ? 'fill-current' : ''}`} />
        </button>

        {/* Badge vedette */}
        {is_featured && (
          <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            En vedette
          </span>
        )}

        {/* Type */}
        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {TYPES_ETAB[establishment_type] || establishment_type}
        </span>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 flex-1">
            {name}
          </h3>
          {note && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-gray-700">{note}</span>
            </div>
          )}
        </div>

        <p className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          {city}{quarter ? `, ${quarter}` : ''}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-gray-900">
            {lowest_price ? formatPrix(lowest_price) : '—'}
          </span>
          <span className="text-xs text-gray-400 font-normal">/ nuit</span>
        </div>

        {review_count > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            {review_count} avis
          </p>
        )}
      </div>
    </Link>
  )
}
