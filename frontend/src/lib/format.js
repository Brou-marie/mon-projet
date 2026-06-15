/**
 * Utilitaires de formatage pour l'affichage.
 */

/** Formate un montant en XOF */
export function formatPrix(montant) {
  if (!montant && montant !== 0) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(montant)) + ' XOF'
}

/** Formate une date */
export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

/** Formate une plage de dates */
export function formatPlageDates(debut, fin) {
  const d = new Date(debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  const f = new Date(fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${d} – ${f}`
}

/** Formate une note */
export function formatNote(note) {
  if (!note || note == 0) return null
  return Number(note).toFixed(1)
}

/** Types d'établissements en français */
export const TYPES_ETAB = {
  hotel: 'Hôtel',
  residence: 'Résidence',
  villa: 'Villa',
  apartment: 'Appartement',
  guesthouse: "Maison d'hôtes",
  hostel: 'Auberge',
}

/** Politiques d'annulation */
export const POLITIQUES = {
  flexible: 'Flexible',
  moderate: 'Modérée',
  strict: 'Stricte',
}

/** Statuts de réservation */
export const STATUTS_RESA = {
  pending_payment: 'Paiement à effectuer',
  paid: 'Payée',
  pending_host_validation: "En attente de validation de l'hébergeur",
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  cancelled_refunded: 'Annulée & remboursée',
  rejected_by_host: "Refusée par l'hébergeur",
  dispute: 'Litige',
  no_show: 'Non présenté',
}
