import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react'

export function PiedDePage() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="section py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Marque */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
            
              NoamHome
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              La plateforme de référence pour réserver des hébergements premium en Côte d'Ivoire.
              Hôtels, résidences, villas et appartements.
            </p>
            <div className="flex flex-col gap-2.5 text-sm">
              <a href="mailto:Noam@gmail.ci" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-primary-500" /> noamhome@gmail.ci
              </a>
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-500" /> +225 07 00 00 00 00
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" /> Abidjan, Côte d'Ivoire
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/hebergements', label: 'Hébergements' },
                { to: '/connexion', label: 'Connexion' },
                { to: '/inscription', label: "S'inscrire" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Paiements */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Paiements acceptés</h3>
            <div className="space-y-3">
              {/* Wave CI */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 100 30" className="w-12 h-6 flex-shrink-0">
                  <rect width="100" height="30" fill="#1DC8FF" rx="4"/>
                  <text x="50" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Wave</text>
                </svg>
                <span className="text-sm">Wave CI</span>
              </div>
              
              {/* Orange Money */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 431 115" className="w-12 h-4 flex-shrink-0">
                  <path fill="#FF7900" d="M90.154 11.052H24.335c-3.542 0-6.94 1.413-9.445 3.929a13.44 13.44 0 0 0-3.913 9.484c0 3.558 1.408 6.969 3.913 9.485a13.332 13.332 0 0 0 9.445 3.929h33.596L3.886 92.097a13.442 13.442 0 0 0-3.914 9.486c0 3.558 1.408 6.97 3.914 9.486a13.33 13.33 0 0 0 9.447 3.929c3.543 0 6.941-1.413 9.447-3.929l53.994-54.225v33.683c0 3.558 1.408 6.97 3.913 9.485a13.328 13.328 0 0 0 9.445 3.929c3.543 0 6.941-1.413 9.446-3.929a13.44 13.44 0 0 0 3.912-9.485V24.465c0-3.553-1.404-6.962-3.904-9.477a13.337 13.337 0 0 0-9.432-3.936Z" transform="translate(.028 -.086) scale(0.2)"/>
                  <path fill="#FF7900" d="M130.236 103.948h65.79c3.542 0 6.94-1.413 9.445-3.929a13.44 13.44 0 0 0 3.913-9.484c0-3.558-1.408-6.969-3.913-9.485a13.328 13.328 0 0 0-9.445-3.929h-33.545l53.994-54.218a13.438 13.438 0 0 0 3.833-9.459 13.441 13.441 0 0 0-3.91-9.428 13.331 13.331 0 0 0-9.387-3.93 13.327 13.327 0 0 0-9.422 3.845l-53.995 54.225V24.465c0-3.557-1.407-6.969-3.913-9.484a13.326 13.326 0 0 0-9.445-3.929 13.329 13.329 0 0 0-9.446 3.929 13.44 13.44 0 0 0-3.912 9.484v66.062a13.48 13.48 0 0 0 1.014 5.136 13.412 13.412 0 0 0 2.896 4.354 13.343 13.343 0 0 0 9.448 3.931Z" transform="translate(.028 -.086) scale(0.2)"/>
                </svg>
                <span className="text-sm">Orange Money</span>
              </div>
              
              {/* MTN Money */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 200 200" className="w-6 h-6 flex-shrink-0">
                  <rect x="9.75" y="9.73" fill="#FFCB05" width="180.52" height="180.52"/>
                  <path fill="#00678F" d="M184.62,99.47c0,19.27-37.88,34.89-84.6,34.89c-46.73,0-84.61-15.62-84.61-34.89s37.88-34.88,84.61-34.88C146.74,64.59,184.62,80.2,184.62,99.47"/>
                  <polygon fill="#FFFFFF" points="45.81,116.69 54.56,81.8 68.54,81.8 68.54,102.12 77.73,81.8 92.16,81.8 83.42,116.69 74.23,116.69 79.47,94.17 68.54,116.69 61.12,116.69 61.12,94.17 55.42,116.69"/>
                  <polygon fill="#ED1D24" points="94.99,117.13 96.3,112.27 106.36,112.27 105.04,117.13"/>
                  <polygon fill="#FFFFFF" points="117.5,116.69 126.24,81.8 136.3,81.8 140.68,100.36 145.48,81.8 154.66,81.8 145.92,116.69 136.3,116.69 131.49,97.7 126.68,116.69"/>
                  <polygon fill="#FFCB05" points="94.99,81.8 92.8,90.64 101.99,90.64 97.04,109.81 107.09,109.81 112.05,90.64 121.23,90.64 123.41,81.8"/>
                </svg>
                <span className="text-sm">MTN Money</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} NoamHome. Tous droits réservés.
          </p>
          <div className="flex gap-5 text-xs">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Politique de confidentialité</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Conditions d'utilisation</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
