import React from 'react'
import { Loader2 } from 'lucide-react'

export function Spinner({ taille = 'md', className = '' }) {
  const tailles = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-14 h-14' }
  return (
    <Loader2
      className={`animate-spin text-primary-600 ${tailles[taille]} ${className}`}
      aria-label="Chargement"
    />
  )
}

export function PageChargement() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Spinner taille="xl" />
        <p className="mt-4 text-gray-400 text-sm font-medium">Chargement...</p>
      </div>
    </div>
  )
}

export function SectionChargement({ message = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Spinner taille="lg" />
      <p className="mt-4 text-gray-400 text-sm">{message}</p>
    </div>
  )
}

export function CartesSkeleton({ n = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
          <div className="skeleton h-52 rounded-none" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-5 w-1/2 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
