import React from 'react'
import { Circle } from 'lucide-react'

const STATUTS = {
  // Réservations
  pending_payment:       { libelle: 'En attente de paiement', classe: 'badge-jaune' },
  paid:                  { libelle: 'Payée',                  classe: 'badge-bleu' },
  pending_host_validation: { libelle: 'Validation hébergeur', classe: 'badge-jaune' },
  confirmed:             { libelle: 'Confirmée',              classe: 'badge-vert' },
  in_progress:           { libelle: 'En cours',               classe: 'badge-bleu' },
  completed:             { libelle: 'Terminée',               classe: 'badge-vert' },
  cancelled:             { libelle: 'Annulée',                classe: 'badge-rouge' },
  cancelled_refunded:    { libelle: 'Annulée & remboursée',   classe: 'badge-gris' },
  rejected_by_host:      { libelle: 'Refusée',                classe: 'badge-rouge' },
  dispute:               { libelle: 'Litige',                 classe: 'badge-rouge' },
  no_show:               { libelle: 'Non présenté',           classe: 'badge-rouge' },
  // Établissements
  pending:               { libelle: 'En attente',             classe: 'badge-jaune' },
  active:                { libelle: 'Actif',                  classe: 'badge-vert' },
  suspended:             { libelle: 'Suspendu',               classe: 'badge-rouge' },
  rejected:              { libelle: 'Rejeté',                 classe: 'badge-rouge' },
  // Litiges
  open:                  { libelle: 'Ouvert',                 classe: 'badge-rouge' },
  in_review:             { libelle: 'En cours',               classe: 'badge-jaune' },
  resolved:              { libelle: 'Résolu',                 classe: 'badge-vert' },
  closed:                { libelle: 'Fermé',                  classe: 'badge-gris' },
  // Vérification
  under_review:          { libelle: 'En vérification',        classe: 'badge-bleu' },
  verified:              { libelle: 'Vérifié',                classe: 'badge-vert' },
}

export function BadgeStatut({ statut, texte }) {
  const cfg = STATUTS[statut] || { libelle: texte || statut, classe: 'badge-gris' }
  return <span className={cfg.classe}>{cfg.libelle}</span>
}
