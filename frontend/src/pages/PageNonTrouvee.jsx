import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function PageNonTrouvee() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-8">
          <p className="text-[120px] font-black text-gray-100 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Home className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée.
          Retournez à l'accueil pour continuer votre navigation.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn-secondary gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <Link to="/" className="btn-primary gap-2">
            <Home className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
