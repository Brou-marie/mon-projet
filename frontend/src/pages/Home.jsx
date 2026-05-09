import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Calendar } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.destination) params.set('city', search.destination);
    if (search.checkIn) params.set('check_in', search.checkIn);
    if (search.checkOut) params.set('check_out', search.checkOut);
    params.set('guests', search.guests);
    navigate(`/search?${params.toString()}`);
  };

  const trending = [
    { city: 'Abidjan', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80' },
    { city: 'Bouaké', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=80' },
    { city: 'Yamoussoukro', image: 'https://images.unsplash.com/photo-1534234828563-02511c98653f?auto=format&fit=crop&w=400&q=80' },
    { city: 'San-Pédro', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-primary-700 to-primary-600 pb-20 pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Réservez votre séjour en Côte d'Ivoire
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-100">
              Hôtels, résidences et villas. Paiement Mobile Money & Wave. Confirmation instantanée.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-4xl rounded-xl bg-white p-4 shadow-lg">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700">Destination</label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ville ou quartier"
                    className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={search.destination}
                    onChange={(e) => setSearch({ ...search, destination: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Arrivée</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={search.checkIn}
                    onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Départ</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={search.checkOut}
                    onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700">Voyageurs</label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                      value={search.guests}
                      onChange={(e) => setSearch({ ...search, guests: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary h-[38px] w-[38px] rounded-lg p-0">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900">Destinations tendance</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((dest) => (
            <div
              key={dest.city}
              onClick={() => navigate(`/search?city=${dest.city}`)}
              className="group cursor-pointer overflow-hidden rounded-xl shadow-md transition hover:shadow-lg"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.city}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{dest.city}</h3>
                <p className="text-sm text-gray-500">Découvrir les hébergements</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Pourquoi Reservation ?</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Paiement local</h3>
              <p className="mt-2 text-gray-500">Wave, Orange Money, MTN & Moov. Payez comme vous le faites au quotidien.</p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Confirmation immédiate</h3>
              <p className="mt-2 text-gray-500">Réservez en quelques clics et recevez votre confirmation en temps réel.</p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Hôtels + Résidences</h3>
              <p className="mt-2 text-gray-500">Trouvez l'hébergement idéal, du studio à la villa avec piscine.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
