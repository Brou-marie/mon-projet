import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Star, Users, Wifi, Car, Wind, Waves, Coffee, Utensils,
  Dumbbell, Shield, Tv, Droplets, Heart, Check, Loader, ChevronLeft,
  ChevronRight, X, Calendar, Clock,
} from 'lucide-react';

const amenityIcons = {
  wifi: Wifi, parking: Car, pool: Waves, ac: Wind, breakfast: Coffee,
  restaurant: Utensils, gym: Dumbbell, security: Shield, tv: Tv,
  laundry: Droplets, bar: Coffee, kitchen: Utensils,
};

const STATUS_LABELS = {
  pending: { label: 'En attente de validation', color: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800' },
};

export default function EstablishmentDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lightbox, setLightbox] = useState(null); // index de l'image ouverte
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '1');

  const { data: establishment, isLoading, error } = useQuery(
    ['establishment', slug],
    async () => {
      const { data } = await api.get(`/establishments/${slug}/`);
      return data;
    },
    { retry: 1 }
  );

  const { data: reviewsData } = useQuery(
    ['reviews', establishment?.id],
    async () => {
      const { data } = await api.get('/reviews/', { params: { establishment: establishment.id } });
      return data;
    },
    { enabled: !!establishment?.id }
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <MapPin className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Hébergement non trouvé</h2>
        <p className="mt-2 text-gray-500">Cet hébergement n'existe pas ou n'est plus disponible.</p>
        <Link to="/search" className="btn-primary mt-6 inline-block">Voir tous les hébergements</Link>
      </div>
    );
  }

  const images = establishment.images || [];
  const roomTypes = establishment.room_types || [];
  const reviews = reviewsData?.results || [];
  const isOwner = user && establishment.host_name && user.role === 'host';

  const handleBooking = (room) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/establishments/${slug}` } } });
      return;
    }
    if (user.role === 'host') {
      alert('Les hébergeurs ne peuvent pas effectuer de réservations.');
      return;
    }
    if (!checkIn || !checkOut) {
      alert('Veuillez sélectionner vos dates de séjour.');
      return;
    }
    navigate(
      `/booking/${establishment.slug}?room_type=${room.id}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
    );
  };

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Statut visible uniquement pour le host propriétaire */}
      {user?.role === 'host' && establishment.status !== 'active' && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${STATUS_LABELS[establishment.status]?.color}`}>
          {STATUS_LABELS[establishment.status]?.label}
          {establishment.status === 'pending' && ' — Votre établissement est en cours de validation par notre équipe.'}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{establishment.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {Number(establishment.avg_rating) > 0 ? establishment.avg_rating : 'Nouveau'}
            {reviews.length > 0 && ` (${reviews.length} avis)`}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {establishment.address}, {establishment.city}
            {establishment.quarter && `, ${establishment.quarter}`}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
            {establishment.establishment_type}
          </span>
        </div>
      </div>

      {/* Galerie */}
      {images.length > 0 ? (
        <div className="mb-8 grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-80 sm:h-96">
          {images.slice(0, 5).map((img, idx) => (
            <div
              key={img.id}
              className={`relative cursor-pointer overflow-hidden bg-gray-200 ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
              onClick={() => setLightbox(idx)}
            >
              <img
                src={img.image_url || img.image}
                alt={img.caption || establishment.name}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
              {idx === 4 && images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold text-lg">
                  +{images.length - 5} photos
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8 flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
          Aucune photo disponible
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute left-4 text-white"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={images[lightbox]?.image_url || images[lightbox]?.image}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}
          >
            <ChevronRight className="h-10 w-10" />
          </button>
          <span className="absolute bottom-4 text-white text-sm">{lightbox + 1} / {images.length}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-xl font-bold text-gray-900">Description</h2>
            <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line">{establishment.description}</p>
          </section>

          {/* Infos pratiques */}
          <section className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
            <div className="text-center">
              <Clock className="mx-auto h-5 w-5 text-primary-600" />
              <p className="mt-1 text-xs text-gray-500">Check-in</p>
              <p className="text-sm font-semibold">{establishment.check_in_time || '14:00'}</p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto h-5 w-5 text-primary-600" />
              <p className="mt-1 text-xs text-gray-500">Check-out</p>
              <p className="text-sm font-semibold">{establishment.check_out_time || '11:00'}</p>
            </div>
            <div className="text-center">
              <Heart className="mx-auto h-5 w-5 text-primary-600" />
              <p className="mt-1 text-xs text-gray-500">Annulation</p>
              <p className="text-sm font-semibold capitalize">{establishment.cancellation_policy}</p>
            </div>
            <div className="text-center">
              <Star className="mx-auto h-5 w-5 text-yellow-400" />
              <p className="mt-1 text-xs text-gray-500">Note</p>
              <p className="text-sm font-semibold">
                {Number(establishment.avg_rating) > 0 ? establishment.avg_rating : '—'}
              </p>
            </div>
          </section>

          {/* Équipements */}
          {establishment.amenities?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900">Équipements</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {establishment.amenities.map((a) => {
                  const Icon = amenityIcons[a.category] || Check;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <Icon className="h-4 w-4 text-primary-600 shrink-0" />
                      {a.name}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Chambres */}
          <section>
            <h2 className="text-xl font-bold text-gray-900">Chambres disponibles</h2>
            {roomTypes.length === 0 && (
              <p className="mt-3 text-gray-500">Aucune chambre configurée pour le moment.</p>
            )}
            <div className="mt-4 space-y-4">
              {roomTypes.filter(r => r.is_active).map((room) => (
                <div key={room.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-36 w-full overflow-hidden rounded-lg bg-gray-100 sm:w-52 shrink-0">
                      {room.primary_image ? (
                        <img
                          src={room.primary_image.image_url || room.primary_image.image}
                          alt={room.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                          Pas d'image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      {room.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{room.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" /> {room.capacity_adults} adulte(s)
                          {room.capacity_children > 0 && `, ${room.capacity_children} enfant(s)`}
                        </span>
                        {room.size_sqm && <span>{room.size_sqm} m²</span>}
                        {room.bed_type && <span>{room.bed_type}</span>}
                      </div>
                      {room.amenities?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {room.amenities.slice(0, 4).map((a) => (
                            <span key={a.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {Number(room.base_price_per_night).toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-sm text-gray-500"> / nuit</span>
                          {nights > 0 && (
                            <p className="text-xs text-gray-400">
                              {nights} nuit(s) = {(Number(room.base_price_per_night) * nights).toLocaleString('fr-FR')} FCFA
                            </p>
                          )}
                        </div>
                        {user?.role !== 'host' && (
                          <button
                            onClick={() => handleBooking(room)}
                            className="btn-primary"
                          >
                            Réserver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Avis */}
          <section>
            <h2 className="text-xl font-bold text-gray-900">Avis ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-gray-500">Aucun avis pour le moment.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-sm font-medium text-yellow-700">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {r.rating_overall}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{r.reviewer_name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Colonne droite — widget de réservation (voyageurs uniquement) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-md">
            {user?.role === 'host' ? (
              <div className="text-center text-sm text-gray-500">
                <Shield className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                En tant qu'hébergeur, vous ne pouvez pas effectuer de réservations.
                <Link to="/host/dashboard" className="mt-3 block text-primary-600 font-medium hover:underline">
                  Aller à mon tableau de bord
                </Link>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Planifier votre séjour</h3>
                {establishment.lowest_price && (
                  <p className="mt-1 text-sm text-gray-500">
                    À partir de{' '}
                    <span className="font-bold text-gray-900">
                      {Number(establishment.lowest_price).toLocaleString('fr-FR')} FCFA
                    </span>
                    {' '}/nuit
                  </p>
                )}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Arrivée</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Départ</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Voyageurs</label>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                    />
                  </div>
                </div>
                {nights > 0 && (
                  <p className="mt-3 text-center text-sm text-primary-700 font-medium">
                    {nights} nuit(s) sélectionnée(s)
                  </p>
                )}
                {!user && (
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/establishments/${slug}` } }}
                    className="btn-primary mt-4 block w-full text-center"
                  >
                    Se connecter pour réserver
                  </Link>
                )}
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Check-in : {establishment.check_in_time || '14:00'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Check-out : {establishment.check_out_time || '11:00'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Annulation : {establishment.cancellation_policy}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
