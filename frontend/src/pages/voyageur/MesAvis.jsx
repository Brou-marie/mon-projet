/**
 * Avis laissés par le voyageur.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { SectionChargement } from '../../composants/ui/Chargement'
import { ErreurPage } from '../../composants/ui/Alerte'

export function PageMesAvis() {
  const [avis, setAvis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    api.get('/client/reviews/')
      .then((d) => setAvis(d.results || d || []))
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <SectionChargement />
  if (erreur) return <ErreurPage message={erreur} />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mes avis</h1>

      {avis.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun avis</h2>
          <p className="text-gray-400">Vous n'avez pas encore laissé d'avis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avis.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {a.establishment?.name || 'Établissement'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold text-sm">{a.rating_overall}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{a.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
