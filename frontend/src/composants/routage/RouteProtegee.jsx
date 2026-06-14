/**
 * Guards de routes — contrôle d'accès par authentification et rôle.
 *
 * Règles :
 * - RoutePubliqueSeul  : connexion/inscription → redirige si déjà connecté
 * - RoutePrivee        : redirige vers /connexion si non connecté
 * - RouteRole          : vérifie le rôle, redirige sinon
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contextes/AuthContexte'

// ─────────────────────────────────────────────────────────────────────────────
// Pages publiques UNIQUEMENT pour non-connectés (connexion, inscription)
// ─────────────────────────────────────────────────────────────────────────────
export function RoutePubliqueSeul({ children }) {
  const { estConnecte, estAdmin, accueilRole } = useAuth()

  if (!estConnecte) return children

  // Admin → Django Unfold (redirection côté navigateur)
  if (estAdmin) {
    window.location.replace('http://localhost:8000/admin/')
    return null
  }

  // Voyageur ou hébergeur → leur espace
  return <Navigate to={accueilRole()} replace />
}

// ─────────────────────────────────────────────────────────────────────────────
// Page nécessite d'être connecté (sans vérification de rôle)
// ─────────────────────────────────────────────────────────────────────────────
export function RoutePrivee({ children }) {
  const { estConnecte } = useAuth()
  const location = useLocation()

  if (!estConnecte) {
    return <Navigate to="/connexion" state={{ depuis: location.pathname }} replace />
  }
  return children
}

// ─────────────────────────────────────────────────────────────────────────────
// Page nécessite un rôle précis
// Exemples : RouteRole role="guest"   → voyageurs uniquement
//            RouteRole role="host"    → hébergeurs uniquement
//            RouteRole role={["superadmin","moderator"]} → admins
// ─────────────────────────────────────────────────────────────────────────────
export function RouteRole({ role, children }) {
  const { utilisateur, estConnecte, estAdmin, accueilRole } = useAuth()
  const location = useLocation()

  // Non connecté → /connexion avec mémorisation de l'URL
  if (!estConnecte) {
    return <Navigate to="/connexion" state={{ depuis: location.pathname }} replace />
  }

  // Admin qui tente d'accéder aux espaces React → Django Unfold
  if (estAdmin) {
    window.location.replace('http://localhost:8000/admin/')
    return null
  }

  // Vérification du rôle
  const rolesAutorises = Array.isArray(role) ? role : [role]
  if (!rolesAutorises.includes(utilisateur?.role)) {
    // Redirige vers l'espace correct de l'utilisateur (pas une 404)
    return <Navigate to={accueilRole()} replace />
  }

  return children
}
