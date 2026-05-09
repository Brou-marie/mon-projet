import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

export default function PiedDePage() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Marque */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-noam-600 to-noam-500">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-noam-600">Noam</span>
                <span className="text-gray-900">Home</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              La plateforme de référence pour réserver des hôtels et résidences
              en Côte d'Ivoire et en Afrique de l'Ouest.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Navigation</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { to: '/recherche', label: 'Trouver un hébergement' },
                { to: '/inscription', label: 'Devenir hôte' },
                { to: '/connexion', label: 'Se connecter' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-500 hover:text-noam-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-noam-500 shrink-0" />
                support@noamhome.ci
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-noam-500 shrink-0" />
                +225 07 XX XX XX XX
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-noam-500 shrink-0" />
                Abidjan, Côte d'Ivoire
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} NoamHome. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-400">
            Paiement sécurisé · Wave · Orange Money · MTN · Moov
          </p>
        </div>
      </div>
    </footer>
  );
}
