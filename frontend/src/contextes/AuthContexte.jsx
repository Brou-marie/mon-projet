/**
 * Contexte d'authentification — fournit l'état de connexion à toute l'application.
 */
import React, { createContext, useContext, useState, useCallback } from 'react'
import { session, api } from '../services/api'

const AuthContexte = createContext(null)

export function ProviderAuth({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => session.getUtilisateur())
  const [chargement, setChargement] = useState(false)

  const connecter = useCallback(async (email, motDePasse) => {
    setChargement(true)
    try {
      const data = await api.post('/auth/login/', { email, password: motDePasse })
      session.sauvegarder({ access: data.access, refresh: data.refresh, user: data.user })
      setUtilisateur(data.user)
      return data.user
    } finally {
      setChargement(false)
    }
  }, [])

  const inscrire = useCallback(async (donnees) => {
    setChargement(true)
    try {
      const data = await api.post('/accounts/register/', donnees)
      session.sauvegarder({ access: data.access, refresh: data.refresh, user: data.user })
      setUtilisateur(data.user)
      return data.user
    } finally {
      setChargement(false)
    }
  }, [])

  const deconnecter = useCallback(async () => {
    try {
      const refresh = session.getRefresh()
      if (refresh) await api.post('/accounts/logout/', { refresh })
    } catch {
      // On déconnecte quand même côté client
    }
    session.effacer()
    setUtilisateur(null)
  }, [])

  const mettreAJourProfil = useCallback((user) => {
    session.mettreAJourUtilisateur(user)
    setUtilisateur(user)
  }, [])

  const estConnecte = Boolean(utilisateur)
  const estVoyageur = utilisateur?.role === 'guest'
  const estHebergeur = utilisateur?.role === 'host'
  const estAdmin = utilisateur?.role === 'superadmin' || utilisateur?.role === 'moderator'

  const accueilRole = () => {
    if (estHebergeur) return '/hebergeur/tableau-de-bord'
    if (estVoyageur) return '/voyageur/tableau-de-bord'
    if (estAdmin) return 'http://localhost:8000/admin/'
    return '/'
  }

  return (
    <AuthContexte.Provider value={{
      utilisateur,
      chargement,
      estConnecte,
      estVoyageur,
      estHebergeur,
      estAdmin,
      accueilRole,
      connecter,
      inscrire,
      deconnecter,
      mettreAJourProfil,
    }}>
      {children}
    </AuthContexte.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContexte)
  if (!ctx) throw new Error('useAuth doit être utilisé dans ProviderAuth')
  return ctx
}
