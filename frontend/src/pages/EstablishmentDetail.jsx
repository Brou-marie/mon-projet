import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { MapPin, Star, Users, Wifi, Car, Wind, Waves, Coffee, Utensils, Dumbbell, Shield, Tv, Clapperboard, Droplets, Heart, ChevronLeft, ChevronRight, Check, Loader } from 'lucide-react';

const amenityIcons = {
  wifi: Wifi, parking: Car, pool: Waves, ac: Wind, breakfast: Coffee,
  restaurant: Utensils, gym: Dumbbell, security: Shield, tv: Tv,
  laundry: Droplets, bar: Clapperboard, kitchen: Utensils,
};

function useEstablishment(slug) {
  return useQuery(['establishment', slug], async () => {
    const { data } = await api.get(`/establishments/${slug}/`);
    return data;
  });
}

function useReviews(establishmentId) {
  return useQuery(['reviews', establishmentId], async () => {
    if (!establishmentId) return { results: [] };
    const { data } = await api.get('/reviews/', { params: { establishment: establishmentId } });
    return data;
  });
}

export default function EstablishmentDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = searchParams.get('guests') || '1';

  const { data: establishment, isLoading } = useEstablishment(slug);
  const { data: reviewsData } = useReviews(establishment?.id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!establishment) {
    return <div className="py-20 text-center text-gray-500">Hébergement non trouvé.</div>;
  }

  const images = establishment.images || [];
  const roomTypes = establishment.room_types || [];
  const reviews = reviewsData?.results || [];

  const handleBooking = (room) => {
    if (!checkIn || !checkOut) {
      alert('Veuillez sélectionner des dates de séjour.');
      return;
    }
    setSelectedRoom(room);
    navigate(`/booking/${establishment.slug}?room_type=${room.id}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{establishment.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {establishment.avg_rating || 'Nouveau'} ({reviews.length} avis)
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {establishment.address}, {establishment.city}
          </span>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        {images.slice(0, 5).map((img, idx) => (
          <div
            key={img.id}
            className={`relative overflow-hidden rounded-lg bg-gray-200 ${idx === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
          >
            <img
              src={img.image}
              alt={img.caption || establishment.name}
              className="h-full w-full object-cover"
              onClick={() => setActiveImage(idx)}
            />
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 flex h-80 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
            Aucune photo disponible
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900">Description</h2>
            <p className="mt-2 text-gray-600 leading-relaxed">{establishment.description}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Équipements</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {establishment.amenities?.map((a) => {
                const Icon = amenityIcons[a.category] || Check;
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon className="h-4 w-4 text-primary-600" />
                    {a.name}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">Chambres disponibles</h2>
            <div className="mt-4 space-y-4">
              {roomTypes.map((room) => (
                <div key={room.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-200 sm:w-48">
                      {room.primary_image ? (
                        <img src={room.primary_image.image} alt={room.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400 text-sm">Pas d'image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{room.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.capacity_adults} adulte(s)</span>
                        {room.size_sqm && <span>{room.size_sqm} m²</span>}
                        {room.bed_type && <span>{room.bed_type}</span>}
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">{Number(room.base_price_per_night).toLocaleString()} FCFA</span>
                          <span className="text-sm text-gray-500"> / nuit</span>
                        </div>
                        <button onClick={() => handleBooking(room)} className="btn-primary">
                          Réserver
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-xl font-bold text-gray-900">Avis ({reviews.length})</h2>
            <div className="mt-4 space-y-4">
              {reviews.length === 0 && <p className="text-gray-500">Aucun avis pour le moment.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-sm font-medium text-yellow-700">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {r.rating_overall}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{r.reviewer_name}</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right sticky card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Réserver votre séjour</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Arrivée</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                  value={checkIn}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Départ</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                  value={checkOut}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Voyageurs</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                  value={guests}
                  readOnly
                />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p className="flex items-center gap-1"><Heart className="h-3 w-3" /> Politique : {establishment.cancellation_policy}</p>
              <p className="mt-1 flex items-center gap-1"><Check className="h-3 w-3" /> Check-in : {establishment.check_in_time || '14:00'}</p>
              <p className="flex items-center gap-1"><Check className="h-3 w-3" /> Check-out : {establishment.check_out_time || '11:00'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
