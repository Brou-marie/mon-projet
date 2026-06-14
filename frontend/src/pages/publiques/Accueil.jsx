import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Calendar, Users, Star, Shield,
  CreditCard, MessageCircle, ArrowRight, ChevronRight,
  Home, Building2, Palmtree, Warehouse, Hotel,
} from 'lucide-react'
import { api } from '../../services/api'
import { CarteHebergement } from '../../composants/ui/CarteHebergement'
import { CartesSkeleton } from '../../composants/ui/Chargement'
import { IMAGE_HERO, getImageDestination } from '../../lib/images'
import { formatPrix } from '../../lib/format'

// ── Barre de recherche hero ────────────────────────────────────────────────

function BarreRecherche() {
  const [ville, setVille] = useState('')
  const [arrivee, setArrivee] = useState('')
  const [depart, setDepart] = useState('')
  const [voyageurs, setVoyageurs] = useState(1)
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (ville) p.set('ville', ville)
    if (arrivee) p.set('arrivee', arrivee)
    if (depart) p.set('depart', depart)
    if (voyageurs > 1) p.set('voyageurs', voyageurs)
    navigate(`/hebergements?${p.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
      {/* Destination */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent focus-within:border-primary-300 focus-within:bg-gray-50">
        <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Destination</p>
          <input
            type="text"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Où voulez-vous aller ?"
            className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

      {/* Arrivée */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent focus-within:border-primary-300 focus-within:bg-gray-50 md:w-40">
        <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Arrivée</p>
          <input
            type="date"
            value={arrivee}
            min={today}
            onChange={(e) => setArrivee(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent outline-none w-full"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

      {/* Départ */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent focus-within:border-primary-300 focus-within:bg-gray-50 md:w-40">
        <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Départ</p>
          <input
            type="date"
            value={depart}
            min={arrivee || today}
            onChange={(e) => setDepart(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent outline-none w-full"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 self-stretch my-2" />

      {/* Voyageurs */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent focus-within:border-primary-300 focus-within:bg-gray-50 md:w-36">
        <Users className="w-5 h-5 text-primary-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-0.5">Voyageurs</p>
          <input
            type="number"
            value={voyageurs}
            min={1}
            max={20}
            onChange={(e) => setVoyageurs(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent outline-none w-16"
          />
        </div>
      </div>

      {/* Bouton */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg min-w-fit"
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline">Rechercher</span>
      </button>
    </form>
  )
}

// ── Filtres par type ──────────────────────────────────────────────────────

const TYPES_FILTRE = [
  { val: '',           libelle: 'Tout',       Icone: Home },
  { val: 'hotel',      libelle: 'Hôtels',     Icone: Hotel },
  { val: 'apartment',  libelle: 'Appartements', Icone: Building2 },
  { val: 'villa',      libelle: 'Villas',     Icone: Palmtree },
  { val: 'residence',  libelle: 'Résidences', Icone: Warehouse },
]

function FiltresType({ actif, onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {TYPES_FILTRE.map(({ val, libelle, Icone }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0
            ${actif === val
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
        >
          <Icone className="w-4 h-4" />
          {libelle}
        </button>
      ))}
    </div>
  )
}

// ── Carte destination ─────────────────────────────────────────────────────

function CarteDestination({ dest, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-200 hover:shadow-xl transition-all duration-300"
    >
      <img
        src={getImageDestination(dest.city)}
        alt={dest.city}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80' }}
        loading="lazy"
      />
      <div className="absolute inset-0 hero-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
        <p className="text-white font-bold text-lg leading-tight">{dest.city}</p>
        <p className="text-white/80 text-sm mt-0.5">
          {dest.count} hébergement{dest.count > 1 ? 's' : ''}
        </p>
        {dest.avg_price && (
          <p className="text-primary-300 text-xs mt-1 font-medium">
            À partir de {formatPrix(dest.avg_price)}
          </p>
        )}
      </div>
    </button>
  )
}

// ── Avantages ─────────────────────────────────────────────────────────────

const AVANTAGES = [
  {
    Icone: Shield,
    titre: 'Réservation sécurisée',
    desc: 'Vos données et paiements sont protégés par un chiffrement de bout en bout.',
    couleur: 'text-emerald-600 bg-emerald-50',
  },
  {
    Icone: CreditCard,
    titre: 'Paiement local',
    desc: 'Wave, Orange Money, MTN Money — payez avec ce que vous avez déjà.',
    couleur: 'text-blue-600 bg-blue-50',
  },
  {
    Icone: Star,
    titre: 'Avis vérifiés',
    desc: 'Seuls les voyageurs ayant séjourné peuvent laisser un avis. 100% authentiques.',
    couleur: 'text-amber-600 bg-amber-50',
  },
  {
    Icone: MessageCircle,
    titre: 'Support réactif',
    desc: "Notre équipe est disponible pour vous aider à chaque étape de votre séjour.",
    couleur: 'text-violet-600 bg-violet-50',
  },
]

// ── Page principale ───────────────────────────────────────────────────────

export function PageAccueil() {
  const [vedettes, setVedettes] = useState([])
  const [destinations, setDestinations] = useState([])
  const [chargementV, setChargementV] = useState(true)
  const [chargementD, setChargementD] = useState(true)
  const [typeActif, setTypeActif] = useState('')
  const [hebergementsFiltres, setHebergementsFiltres] = useState([])
  const [chargementF, setChargementF] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/public/hebergements/vedettes/')
      .then((d) => setVedettes(d.results || d || []))
      .catch(() => {})
      .finally(() => setChargementV(false))

    api.get('/public/destinations/populaires/')
      .then((d) => setDestinations(d.results || d || []))
      .catch(() => {})
      .finally(() => setChargementD(false))
  }, [])

  useEffect(() => {
    if (typeActif === '') {
      setHebergementsFiltres([])
      return
    }
    setChargementF(true)
    api.get(`/public/hebergements/?type=${typeActif}&ordering=-avg_rating`)
      .then((d) => setHebergementsFiltres(d.results || d || []))
      .catch(() => {})
      .finally(() => setChargementF(false))
  }, [typeActif])

  const hebergementsAffiches = typeActif ? hebergementsFiltres : vedettes
  const chargement = typeActif ? chargementF : chargementV

  return (
    <div className="bg-white">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Image de fond */}
        <div className="absolute inset-0">
          <img
            src={IMAGE_HERO}
            alt="Côte d'Ivoire"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
        </div>

        {/* Contenu hero */}
        <div className="relative section py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Trouvez votre séjour
              <span className="block text-primary-400">parfait en Côte d'Ivoire</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-10 max-w-2xl leading-relaxed">
              Hôtels, résidences, villas et appartements sélectionnés pour leur qualité.
              Réservez en quelques clics, payez par Wave ou Orange Money.
            </p>

            {/* Barre de recherche */}
            <BarreRecherche />

            {/* Stats rapides */}
            <div className="flex flex-wrap gap-6 mt-8">
              {[
                { val: '500+', label: 'Hébergements' },
                { val: '10K+', label: 'Voyageurs satisfaits' },
                { val: '4.8/5', label: 'Note moyenne' },
              ].map((s) => (
                <div key={s.label} className="text-white">
                  <p className="text-2xl font-bold">{s.val}</p>
                  <p className="text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Hébergements ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {typeActif ? 'Hébergements filtrés' : 'Hébergements en vedette'}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Les meilleures adresses sélectionnées pour vous
              </p>
            </div>
            <button
              onClick={() => navigate('/hebergements')}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm group"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Filtres type */}
          <div className="mb-8">
            <FiltresType actif={typeActif} onChange={setTypeActif} />
          </div>

          {/* Grille */}
          {chargement ? (
            <CartesSkeleton n={6} />
          ) : hebergementsAffiches.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Aucun hébergement disponible pour ce filtre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {hebergementsAffiches.slice(0, 6).map((h, i) => (
                <CarteHebergement key={h.id} hebergement={h} prioritaire={i < 3} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/hebergements')}
              className="btn-secondary btn-lg gap-2"
            >
              Voir tous les hébergements
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Destinations populaires ──────────────────────────────────────── */}
      {!chargementD && destinations.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="section">
            <div className="mb-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Destinations populaires
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">
                Explorez les villes les plus demandées par nos voyageurs
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
              {destinations.slice(0, 4).map((dest) => (
                <CarteDestination
                  key={dest.city}
                  dest={dest}
                  onClick={() => navigate(`/hebergements?ville=${encodeURIComponent(dest.city)}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pourquoi NoamHome ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="section">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Pourquoi choisir NoamHome ?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Une plateforme pensée pour les voyageurs et hébergeurs ivoiriens
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AVANTAGES.map(({ Icone, titre, desc, couleur }) => (
              <div key={titre} className="card hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${couleur} group-hover:scale-110 transition-transform`}>
                  <Icone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Hébergeur ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-emerald-700">
        <div className="section text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous avez un hébergement à louer ?
          </h2>
          <p className="text-primary-100 text-base mb-8 max-w-xl mx-auto">
            Rejoignez des centaines d'hébergeurs et commencez à générer des revenus dès aujourd'hui.
            Inscription gratuite, paiement rapide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/inscription')}
              className="bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
            >
              Devenir hébergeur
            </button>
            <button
              onClick={() => navigate('/hebergements')}
              className="border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Explorer les hébergements
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
