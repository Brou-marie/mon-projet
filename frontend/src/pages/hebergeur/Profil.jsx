/**
 * Profil de l'hébergeur — informations personnelles et bancaires.
 */
import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../contextes/AuthContexte'
import { Alerte } from '../../composants/ui/Alerte'
import { SectionChargement } from '../../composants/ui/Chargement'

export function PageProfilHebergeur() {
  const { utilisateur, mettreAJourProfil } = useAuth()
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [message, setMessage] = useState(null)

  const [formUser, setFormUser] = useState({
    first_name: utilisateur?.first_name || '',
    last_name: utilisateur?.last_name || '',
    phone: utilisateur?.phone || '',
  })

  const [formProfil, setFormProfil] = useState({
    company_name: '',
    address: '',
    description: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
  })

  useEffect(() => {
    api.get('/accounts/profile/host/')
      .then((d) => {
        setProfil(d)
        setFormProfil({
          company_name: d.company_name || '',
          address: d.address || '',
          description: d.description || '',
          bank_account_name: d.bank_account_name || '',
          bank_account_number: d.bank_account_number || '',
          bank_name: d.bank_name || '',
        })
      })
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSauvegarde(true)
    setMessage(null)
    try {
      const [userData] = await Promise.all([
        api.patch('/accounts/me/', formUser),
        api.patch('/accounts/profile/host/', formProfil),
      ])
      mettreAJourProfil(userData)
      setMessage({ type: 'succes', texte: 'Profil mis à jour.' })
    } catch (err) {
      setMessage({ type: 'erreur', texte: err.message })
    } finally {
      setSauvegarde(false)
    }
  }

  if (chargement) return <SectionChargement />

  const STATUTS_VERIF = {
    pending: { libelle: 'En attente de vérification', classe: 'badge-jaune' },
    under_review: { libelle: 'En cours de vérification', classe: 'badge-bleu' },
    verified: { libelle: 'Vérifié ✓', classe: 'badge-vert' },
    rejected: { libelle: 'Rejeté', classe: 'badge-rouge' },
  }
  const statutVerif = profil?.verification_status
  const badgeVerif = STATUTS_VERIF[statutVerif] || { libelle: statutVerif, classe: 'badge-gris' }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil hébergeur</h1>
        {profil && <span className={badgeVerif.classe}>{badgeVerif.libelle}</span>}
      </div>

      {message && <Alerte type={message.type} message={message.texte} onFermer={() => setMessage(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input type="text" value={formUser.first_name} onChange={(e) => setFormUser((p) => ({ ...p, first_name: e.target.value }))} required className="input" />
              </div>
              <div>
                <label className="label">Nom</label>
                <input type="text" value={formUser.last_name} onChange={(e) => setFormUser((p) => ({ ...p, last_name: e.target.value }))} required className="input" />
              </div>
            </div>
            <div>
              <label className="label">Email (non modifiable)</label>
              <input type="email" value={utilisateur?.email || ''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input type="tel" value={formUser.phone} onChange={(e) => setFormUser((p) => ({ ...p, phone: e.target.value }))} className="input" />
            </div>
          </div>
        </div>

        {/* Informations hébergeur */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Informations de l'entreprise</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Nom de l'entreprise (optionnel)</label>
              <input type="text" value={formProfil.company_name} onChange={(e) => setFormProfil((p) => ({ ...p, company_name: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Adresse</label>
              <input type="text" value={formProfil.address} onChange={(e) => setFormProfil((p) => ({ ...p, address: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={formProfil.description} onChange={(e) => setFormProfil((p) => ({ ...p, description: e.target.value }))} rows={3} className="input" />
            </div>
          </div>
        </div>

        {/* Informations bancaires */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Informations bancaires</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Nom du titulaire du compte</label>
              <input type="text" value={formProfil.bank_account_name} onChange={(e) => setFormProfil((p) => ({ ...p, bank_account_name: e.target.value }))} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Numéro de compte</label>
                <input type="text" value={formProfil.bank_account_number} onChange={(e) => setFormProfil((p) => ({ ...p, bank_account_number: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Banque</label>
                <input type="text" value={formProfil.bank_name} onChange={(e) => setFormProfil((p) => ({ ...p, bank_name: e.target.value }))} className="input" />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={sauvegarde} className="btn-primary w-full py-3">
          {sauvegarde ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  )
}
