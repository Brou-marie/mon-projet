import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { MapPin, Star, Users, SlidersHorizontal, Loader } from 'lucide-react';

function useSearchEstablishments(params) {
  return useQuery(['search', params], async () => {
    const { data } = await api.get('/establishments/', { params });
    return data;
  });
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = searchParams.get('guests') || '1';
  const typeFilter = searchParams.get('establishment_type') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const params = {
    city,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    ...(typeFilter && { establishment_type: typeFilter }),
    ...(minPrice && { base_price_per_night__gte: minPrice }),
    ...(maxPrice && { base_price_per_night__lte: maxPrice }),
  };

  const { data, isLoading } = useSearchEstablishments(params);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Filters */}
        <aside className="lg:w-64">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline mb-4 w-full lg:hidden"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
          </button>

          <div className={`space-y-6 rounded-xl border bg-white p-4 shadow-sm ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div>
              <label className="text-sm font-medium text-gray-700">Type d'hébergement</label>
              <select
                className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={typeFilter}
                onChange={(e) => updateFilter('establishment_type', e.target.value)}
              >
                <option value="">Tous</option>
                <option value="hotel">Hôtel</option>
                <option value="residence">Résidence</option>
                <option value="villa">Villa</option>
                <option value="apartment">Appartement</option>
                <option value="guesthouse">Maison d'hôtes</option>
                <option value="hostel">Auberge</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Prix min / nuit (FCFA)</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-1/2 rounded-lg border-gray-300 text-sm"
                  value={minPrice}
                  onChange={(e) => updateFilter('min_price', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-1/2 rounded-lg border-gray-300 text-sm"
                  value={maxPrice}
                  onChange={(e) => updateFilter('max_price', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Dates</label>
              <div className="mt-1 space-y-2">
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 text-sm"
                  value={checkIn}
                  onChange={(e) => updateFilter('check_in', e.target.value)}
                />
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 text-sm"
                  value={checkOut}
                  onChange={(e) => updateFilter('check_out', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Voyageurs</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={guests}
                onChange={(e) => updateFilter('guests', e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              {city ? `Résultats à ${city}` : 'Tous les hébergements'}
            </h1>
            <span className="text-sm text-gray-500">
              {data?.results?.length ?? 0} résultat(s)
            </span>
          </div>

          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          )}

          {!isLoading && (!data?.results || data.results.length === 0) && (
            <div className="rounded-xl border bg-white p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucun hébergement trouvé</h3>
              <p className="mt-1 text-gray-500">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data?.results?.map((item) => (
              <Link
                key={item.id}
                to={`/establishments/${item.slug}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
                className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  {item.primary_image ? (
                    <img
                      src={item.primary_image.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Pas d'image
                    </div>
                  )}
                  {item.is_featured && (
                    <span className="absolute left-2 top-2 rounded bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">
                      Coup de cœur
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.establishment_type}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {item.avg_rating || 'Nouveau'}
                    </div>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                    {item.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.city_quarter}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {item.lowest_price ? `${Number(item.lowest_price).toLocaleString()} FCFA` : 'Sur demande'}
                      </span>
                      <span className="text-sm text-gray-500"> / nuit</span>
                    </div>
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      {item.cancellation_policy}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
