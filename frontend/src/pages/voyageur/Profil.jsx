/**
 * Profil du voyageur — modification des informations personnelles.
 */
import React, { useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../contextes/AuthContexte'
import { Alerte } from '../../composants/ui/Alerte'
import { Spinner } from '../../composants/ui/Chargement'

export function PageProfilVoyageur() {
  const { utilisateur, mettreAJourProfil } = useAuth()
  const [form, setForm] = useState({
    first_name: utilisateur?.first_name || '',
    last_name: utilisateur?.last_name || '',
    phone: utilisateur?.phone || '',
  })
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (champ, val) => setForm((p) => ({ ...p, [champ]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChargement(true)
    setMessage(null)
    try {
      const data = await api.patch('/accounts/me/', form)
      mettreAJourProfil(data)
      setMessage({ type: 'succes', texte: 'Profil mis à jour avec succès.' })
    } catch (err) {
      setMessage({ type: 'erreur', texte: err.message })
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {message && (
        <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />
      )}

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
            {utilisateur?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {utilisateur?.first_name} {utilisateur?.last_name}
            </p>
            <p className="text-sm text-gray-500">{utilisateur?.email}</p>
            <span className="badge-bleu mt-1 inline-block">Voyageur</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Nom</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={utilisateur?.email || ''}
              disabled
              className="input bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="input"
              placeholder="+225 07 XX XX XX XX"
            />
          </div>
          <button type="submit" disabled={chargement} className="btn-primary w-full py-3">
            {chargement ? <Spinner taille="sm" className="border-white border-t-transparent" /> : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  )
}
