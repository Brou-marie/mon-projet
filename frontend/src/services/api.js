/**
 * Service API — gestion centralisée des requêtes vers le backend Django.
 * Gère le JWT, le rafraîchissement automatique de token et les erreurs.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── Erreur API personnalisée ────────────────────────────────────────────────

export class ErreurApi extends Error {
  constructor(message, statut, details = null) {
    super(message)
    this.name = 'ErreurApi'
    this.statut = statut
    this.details = details
  }
}

// ─── Helpers session (localStorage) ─────────────────────────────────────────

export const session = {
  getToken: () => localStorage.getItem('access_token'),
  getRefresh: () => localStorage.getItem('refresh_token'),
  getUtilisateur: () => {
    try {
      const data = localStorage.getItem('utilisateur')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },
  sauvegarder: ({ access, refresh, user }) => {
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    if (user) localStorage.setItem('utilisateur', JSON.stringify(user))
  },
  mettreAJourUtilisateur: (user) => {
    localStorage.setItem('utilisateur', JSON.stringify(user))
  },
  effacer: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('utilisateur')
  },
  estConnecte: () => Boolean(localStorage.getItem('access_token')),
}

// ─── Rafraîchissement du token ───────────────────────────────────────────────

async function rafraichirToken() {
  const refresh = session.getRefresh()
  if (!refresh) throw new ErreurApi('Session expirée.', 401)

  const reponse = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  const data = await reponse.json()

  if (!reponse.ok) {
    session.effacer()
    throw new ErreurApi('Session expirée. Veuillez vous reconnecter.', 401)
  }

  session.sauvegarder({ access: data.access, refresh: data.refresh })
  return data.access
}

// ─── Requête principale ───────────────────────────────────────────────────────

export async function requete(chemin, options = {}, retry = true) {
  const headers = new Headers(options.headers || {})
  const token = session.getToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const corps = options.body instanceof FormData
    ? options.body
    : options.body
      ? JSON.stringify(options.body)
      : undefined

  const reponse = await fetch(`${API_BASE}${chemin}`, {
    ...options,
    headers,
    body: corps,
  })

  // Token expiré → on rafraîchit et on réessaie une fois
  if (reponse.status === 401 && retry) {
    await rafraichirToken()
    return requete(chemin, options, false)
  }

  let data = null
  const texte = await reponse.text()
  if (texte) {
    try { data = JSON.parse(texte) } catch { data = texte }
  }

  if (!reponse.ok) {
    const message = typeof data === 'string'
      ? data
      : data?.detail || data?.non_field_errors?.[0] || 'Une erreur est survenue.'
    throw new ErreurApi(message, reponse.status, data)
  }

  return data
}

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

export const api = {
  get: (chemin) => requete(chemin, { method: 'GET' }),
  post: (chemin, corps) => requete(chemin, { method: 'POST', body: corps }),
  put: (chemin, corps) => requete(chemin, { method: 'PUT', body: corps }),
  patch: (chemin, corps) => requete(chemin, { method: 'PATCH', body: corps }),
  delete: (chemin) => requete(chemin, { method: 'DELETE' }),
  postFormData: (chemin, formData) => requete(chemin, { method: 'POST', body: formData }),
}
