import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/clientApi';
import { MapPin, Star, SlidersHorizontal, Loader, X } from 'lucide-react';

function useRechercheHebergements(params) {
  return useQuery(['recherche', params], async () => {
    const { data } = await api.get('/establishments/', { params });
    return data;
  });
}

const TYPES = [
  { val: '', label: 'Tous les types' },
  { val: 'hotel', label: 'Hôtel' },
  { val: 'residence', label: 'Résidence' },
  { val: 'villa', label: 'Villa' },
  { val: 'apartment', label: 'Appartement' },
  { val: 'guesthouse', label: "Maison d'hôtes" },
  { val: 'hostel', label: 'Auberge' },
];

export default function ResultatsRecherche() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const ville = searchParams.get('city') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const voyageurs = searchParams.get('guests') || '1';
  const typeFiltre = searchParams.get('establishment_type') || '';
  const prixMin = searchParams.get('min_price') || '';
  const prixMax = searchParams.get('max_price') || '';

  const params = {
    city: ville,
    check_in: checkIn,
    check_out: checkOut,
    guests: voyageurs,
    ...(typeFiltre && { establishment_type: typeFiltre }),
    ...(prixMin && { base_price_per_night__gte: prixMin }),
    ...(prixMax && { base_price_per_night__lte: prixMax }),
  };

  const { data, isLoading } = useRechercheHebergements(params);

  const majFiltre = (cle, valeur) => {
    const next = new URLSearchParams(searchParams);
    if (valeur) next.set(cle, valeur);
    else next.delete(cle);
    setSearchParams(next);
  };

  const nbResultats = data?.results?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* Filtres */}
        <aside className="lg:w-72 shrink-0">
          <button
            onClick={() => setFiltresOuverts(!filtresOuverts)}
            className="btn-secondaire mb-3 w-full lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtresOuverts ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>

          <div className={`carte p-5 space-y-5 ${filtresOuverts ? 'block' : 'hidden lg:block'}`}>
            <h3 className="font-semibold text-gray-900">Filtres</h3>

            {/* Type */}
            <div className="groupe-champ">
              <label className="label">Type d'hébergement</label>
              <select
                className="select-champ"
                value={typeFiltre}
                onChange={(e) => majFiltre('establishment_type', e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t.val} value={t.val}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Prix */}
            <div className="groupe-champ">
              <label className="label">Prix / nuit (FCFA)</label>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Min"
                  className="champ w-1/2"
                  value={prixMin}
                  onChange={(e) => majFiltre('min_price', e.target.value)}
                />
                <input
                  type="number" placeholder="Max"
                  className="champ w-1/2"
                  value={prixMax}
                  onChange={(e) => majFiltre('max_price', e.target.value)}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="groupe-champ">
              <label className="label">Arrivée</label>
              <input type="date" className="champ"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => majFiltre('check_in', e.target.value)} />
            </div>
            <div className="groupe-champ">
              <label className="label">Départ</label>
              <input type="date" className="champ"
                value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => majFiltre('check_out', e.target.value)} />
            </div>

            {/* Voyageurs */}
            <div className="groupe-champ">
              <label className="label">Voyageurs</label>
              <input type="number" min={1} className="champ"
                value={voyageurs}
                onChange={(e) => majFiltre('guests', e.target.value)} />
            </div>

            {/* Réinitialiser */}
            {(typeFiltre || prixMin || prixMax) && (
              <button
                onClick={() => setSearchParams(new URLSearchParams({ city: ville, guests: voyageurs }))}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" /> Réinitialiser les filtres
              </button>
            )}
          </div>
        </aside>

        {/* Résultats */}
        <div className="flex-1 min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {ville ? `Hébergements à ${ville}` : 'Tous les hébergements'}
              </h1>
              {!isLoading && (
                <p className="text-sm text-gray-500">
                  {nbResultats} résultat{nbResultats > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-noam-600" />
            </div>
          )}

          {!isLoading && nbResultats === 0 && (
            <div className="carte p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucun hébergement trouvé</h3>
              <p className="mt-1 text-gray-500">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data?.results?.map((item) => (
              <Link
                key={item.id}
                to={`/hebergements/${item.slug}?check_in=${checkIn}&check_out=${checkOut}&guests=${voyageurs}`}
                className="group carte overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {item.primary_image ? (
                    <img
                      src={item.primary_image.image_url || item.primary_image.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                      Pas de photo
                    </div>
                  )}
                  {item.is_featured && (
                    <span className="absolute left-2 top-2 rounded-full bg-or-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                      ⭐ Coup de cœur
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-gris capitalize">{item.establishment_type}</span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <Star className="h-3.5 w-3.5 fill-or-400 text-or-400" />
                      {Number(item.avg_rating) > 0 ? item.avg_rating : 'Nouveau'}
                    </div>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-noam-600 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{item.city_quarter}</span>
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {item.lowest_price
                          ? `${Number(item.lowest_price).toLocaleString('fr-FR')} FCFA`
                          : 'Sur demande'}
                      </span>
                      <span className="text-xs text-gray-500"> /nuit</span>
                    </div>
                    <span className="badge badge-vert capitalize">{item.cancellation_policy}</span>
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
