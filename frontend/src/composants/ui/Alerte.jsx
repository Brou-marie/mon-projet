import React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const STYLES = {
  succes:       { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', Icone: CheckCircle2, iconeClass: 'text-emerald-500' },
  erreur:       { bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     Icone: AlertCircle,  iconeClass: 'text-red-500' },
  avertissement:{ bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   Icone: AlertTriangle,iconeClass: 'text-amber-500' },
  info:         { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-800',    Icone: Info,         iconeClass: 'text-blue-500' },
}

export function Alerte({ type = 'erreur', titre, message, onFermer }) {
  const { bg, text, Icone, iconeClass } = STYLES[type] || STYLES.erreur
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bg} ${text}`} role="alert">
      <Icone className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconeClass}`} />
      <div className="flex-1 min-w-0">
        {titre && <p className="font-semibold text-sm">{titre}</p>}
        {message && <p className={`text-sm ${titre ? 'mt-0.5 opacity-90' : ''}`}>{message}</p>}
      </div>
      {onFermer && (
        <button onClick={onFermer} className={`p-0.5 rounded-lg hover:bg-black/10 transition-colors ${text}`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export function ErreurPage({ message = 'Une erreur est survenue.', onReessayer }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Quelque chose s'est mal passé</h2>
      <p className="text-gray-500 mb-6 max-w-sm text-sm leading-relaxed">{message}</p>
      {onReessayer && (
        <button onClick={onReessayer} className="btn-primary">
          Réessayer
        </button>
      )}
    </div>
  )
}
