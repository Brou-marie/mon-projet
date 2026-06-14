import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, MapPin, ChevronDown } from 'lucide-react'
import { api } from '../../services/api'
import { CarteHebergement } from '../../composants/ui/CarteHebergement'
import { CartesSkeleton } from '../../composants/ui/Chargement'
import { ErreurPage } from '../../composants/ui/Alerte'

const TYPES = [
  { valeur: '', libelle: 'Tous les types' },
  { valeur: 'hotel', libelle: 'Hôtel' },
  { valeur: 'residence', libelle: 'Résidence' },
  { valeur: 'villa', libelle: 'Villa' },
  { valeur: 'apartment', libelle: 'Appartement' },
  { valeur: 'guesthouse', libelle: "Maison d'hôtes" },
  { valeur: 'hostel', libelle: 'Auberge' },
]

const TRIS = [
  { valeur: '-created_at', libelle: 'Plus récents' },
  { valeur: '-avg_rating', libelle: 'Mieux notés' },
  { valeur: 'room_types__base_price_per_night', libelle: 'Prix croissant' },
  { valeur: '-room_types__base_price_per_night', libelle: 'Prix décroissant' },
]

function PannelauFiltres({ filtres, onChange, onReset, nbResultats }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      {/* Barre desktop */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filtres.ville}
            onChange={(e) => onChange('ville', e.target.value)}
            placeholder="Ville ou destination..."
            className="input pl-10 h-11"
          />
        </div>

        <select value={filtres.type} onChange={(e) => onChange('type', e.target.value)} className="input h-11 w-44">
          {TYPES.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filtres.prixMin}
            onChange={(e) => onChange('prixMin', e.target.value)}
            placeholder="Prix min"
            min="0"
            className="input h-11 w-28"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            value={filtres.prixMax}
            onChange={(e) => onChange('prixMax', e.target.value)}
            placeholder="Prix max"
            min="0"
            className="input h-11 w-28"
          />
        </div>

        <select value={filtres.tri} onChange={(e) => onChange('tri', e.target.value)} className="input h-11 w-44">
          {TRIS.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
        </select>

        {(filtres.ville || filtres.type || filtres.prixMin || filtres.prixMax) && (
          <button onClick={onReset} className="btn-ghost h-11 gap-1.5 text-red-600 hover:bg-red-50">
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Bouton filtres mobile */}
      <div className="lg:hidden flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">{nbResultats} résultat{nbResultats > 1 ? 's' : ''}</p>
        <button
          onClick={() => setOuvert(!ouvert)}
          className="btn-secondary gap-2 h-10"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {(filtres.ville || filtres.type || filtres.prixMin || filtres.prixMax) && (
            <span className="w-2 h-2 rounded-full bg-primary-600" />
          )}
        </button>
      </div>

      {/* Drawer filtres mobile */}
      {ouvert && (
        <div className="lg:hidden bg-white border border-gray-200 rounded-2xl p-4 space-y-4 animate-scale-in">
          <div>
            <label className="label-sm">Destination</label>
            <input type="text" value={filtres.ville} onChange={(e) => onChange('ville', e.target.value)} placeholder="Ville..." className="input" />
          </div>
          <div>
            <label className="label-sm">Type</label>
            <select value={filtres.type} onChange={(e) => onChange('type', e.target.value)} className="input">
              {TYPES.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Prix min (XOF)</label>
              <input type="number" value={filtres.prixMin} onChange={(e) => onChange('prixMin', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label-sm">Prix max (XOF)</label>
              <input type="number" value={filtres.prixMax} onChange={(e) => onChange('prixMax', e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label-sm">Trier par</label>
            <select value={filtres.tri} onChange={(e) => onChange('tri', e.target.value)} className="input">
              {TRIS.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOuvert(false)} className="btn-primary flex-1">Appliquer</button>
            <button onClick={() => { onReset(); setOuvert(false) }} className="btn-secondary">Réinitialiser</button>
          </div>
        </div>
      )}
    </>
  )
}

export function PageListeHebergements() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [hebergements, setHebergements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [total, setTotal] = useState(0)

  const [filtres, setFiltres] = useState({
    ville: searchParams.get('ville') || '',
    type: searchParams.get('type') || '',
    prixMin: searchParams.get('prix_min') || '',
    prixMax: searchParams.get('prix_max') || '',
    tri: searchParams.get('tri') || '-created_at',
  })

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    const p = new URLSearchParams()
    if (filtres.ville) p.set('city', filtres.ville)
    if (filtres.type) p.set('type', filtres.type)
    if (filtres.prixMin) p.set('price_min', filtres.prixMin)
    if (filtres.prixMax) p.set('price_max', filtres.prixMax)
    if (filtres.tri) p.set('ordering', filtres.tri)
    try {
      const data = await api.get(`/public/hebergements/?${p}`)
      setHebergements(data.results || data || [])
      setTotal(data.count || (data.results || data || []).length)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }, [filtres])

  useEffect(() => {
    const timer = setTimeout(charger, 400)
    return () => clearTimeout(timer)
  }, [charger])

  const handleChangeFiltres = (champ, val) => {
    setFiltres((p) => ({ ...p, [champ]: val }))
  }

  const handleReset = () => {
    setFiltres({ ville: '', type: '', prixMin: '', prixMax: '', tri: '-created_at' })
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="section py-4 space-y-3">
          <PannelauFiltres
            filtres={filtres}
            onChange={handleChangeFiltres}
            onReset={handleReset}
            nbResultats={total}
          />
        </div>
      </div>

      {/* Contenu */}
      <div className="section py-8">
        {/* Résultat count — desktop */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            {chargement ? 'Recherche...' : (
              <>
                <span className="font-semibold text-gray-900">{total}</span>
                {' '}hébergement{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                {filtres.ville && <> à <span className="font-semibold text-primary-600">{filtres.ville}</span></>}
              </>
            )}
          </p>
        </div>

        {chargement ? (
          <CartesSkeleton n={9} />
        ) : erreur ? (
          <ErreurPage message={erreur} onReessayer={charger} />
        ) : hebergements.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">
              Essayez de modifier vos critères de recherche ou explorez d'autres destinations.
            </p>
            <button onClick={handleReset} className="btn-primary">
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {hebergements.map((h, i) => (
              <CarteHebergement key={h.id} hebergement={h} prioritaire={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
