import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Users, Calendar, Star, ArrowRight } from 'lucide-react';

const DESTINATIONS = [
  { ville: 'Abidjan', image: 'https://images.unsplash.com/photo-1532302527199-0d4b4dfb7e2c?auto=format&fit=crop&w=600&q=80', nb: '120+' },
  { ville: 'Bouaké', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80', nb: '45+' },
  { ville: 'Yamoussoukro', image: 'https://images.unsplash.com/photo-1534234828563-02511c98653f?auto=format&fit=crop&w=600&q=80', nb: '30+' },
  { ville: 'San-Pédro', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80', nb: '25+' },
];

export default function Accueil() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState({
    destination: '', checkIn: '', checkOut: '', voyageurs: 1,
  });

  const handleRecherche = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (recherche.destination) params.set('city', recherche.destination);
    if (recherche.checkIn) params.set('check_in', recherche.checkIn);
    if (recherche.checkOut) params.set('check_out', recherche.checkOut);
    params.set('guests', recherche.voyageurs);
    navigate(`/recherche?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-noam pb-24 pt-16">
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trouvez votre hébergement
              <span className="block text-or-400">idéal en Afrique</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-noam-100">
              Hôtels, résidences et villas. Paiement Mobile Money & Wave.
              Confirmation instantanée.
            </p>
          </div>

          {/* Formulaire de recherche */}
          <form
            onSubmit={handleRecherche}
            className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-4 shadow-noam-lg"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="groupe-champ">
                <label className="label text-xs">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ville ou quartier"
                    className="champ pl-10"
                    value={recherche.destination}
                    onChange={(e) => setRecherche({ ...recherche, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="groupe-champ">
                <label className="label text-xs">Arrivée</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="champ pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    value={recherche.checkIn}
                    onChange={(e) => setRecherche({ ...recherche, checkIn: e.target.value })}
                  />
                </div>
              </div>
              <div className="groupe-champ">
                <label className="label text-xs">Départ</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    className="champ pl-10"
                    min={recherche.checkIn || new Date().toISOString().split('T')[0]}
                    value={recherche.checkOut}
                    onChange={(e) => setRecherche({ ...recherche, checkOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="groupe-champ flex-1">
                  <label className="label text-xs">Voyageurs</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="number" min={1}
                      className="champ pl-10"
                      value={recherche.voyageurs}
                      onChange={(e) => setRecherche({ ...recherche, voyageurs: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primaire h-[46px] w-[46px] rounded-xl p-0 shrink-0">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Destinations tendance */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Destinations tendance</h2>
            <p className="mt-1 text-sm text-gray-500">Les villes les plus recherchées</p>
          </div>
          <Link to="/recherche" className="flex items-center gap-1 text-sm font-semibold text-noam-600 hover:text-noam-700">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.ville}
              onClick={() => navigate(`/recherche?city=${dest.ville}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.ville}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-base font-bold">{dest.ville}</p>
                  <p className="text-xs text-white/80">{dest.nb} hébergements</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pourquoi NoamHome */}
      <section className="bg-gradient-to-br from-noam-50 to-white border-t border-noam-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Pourquoi choisir NoamHome ?</h2>
            <p className="mt-2 text-sm text-gray-500">Simple, rapide et sécurisé</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                emoji: '📱',
                titre: 'Paiement local',
                desc: 'Wave, Orange Money, MTN & Moov. Payez comme vous le faites au quotidien.',
              },
              {
                emoji: '⚡',
                titre: 'Confirmation immédiate',
                desc: 'Réservez en quelques clics et recevez votre confirmation en temps réel.',
              },
              {
                emoji: '🏨',
                titre: 'Large choix',
                desc: 'Du studio économique à la villa de luxe avec piscine. Pour tous les budgets.',
              },
            ].map((item) => (
              <div key={item.titre} className="carte p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-noam-50 text-3xl">
                  {item.emoji}
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{item.titre}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}