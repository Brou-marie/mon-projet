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
              <span className="bg-primary-600 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black">NH</span>
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
              {[
                { label: 'Wave CI', color: 'bg-blue-600' },
                { label: 'Orange Money', color: 'bg-orange-500' },
                { label: 'MTN Money', color: 'bg-yellow-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-5 rounded ${color} flex-shrink-0`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
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
