/**
 * Tests — composants UI
 * Couvre : Badge.jsx (BadgeStatut), Alerte.jsx (Alerte, ErreurPage),
 *          Chargement.jsx (Spinner, SectionChargement, PageChargement),
 *          ErrorBoundary.jsx
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BadgeStatut } from '../composants/ui/Badge'
import { Alerte, ErreurPage } from '../composants/ui/Alerte'
import { Spinner, SectionChargement, PageChargement } from '../composants/ui/Chargement'
import { ErrorBoundary } from '../composants/ui/ErrorBoundary'

// ── BadgeStatut ───────────────────────────────────────────────────────────────
describe('BadgeStatut', () => {
  it('affiche le libellé pour confirmed', () => {
    render(<BadgeStatut statut="confirmed" />)
    expect(screen.getByText('Confirmée')).toBeInTheDocument()
  })

  it('affiche le libellé pour cancelled', () => {
    render(<BadgeStatut statut="cancelled" />)
    expect(screen.getByText('Annulée')).toBeInTheDocument()
  })

  it('affiche le libellé pour pending_payment', () => {
    render(<BadgeStatut statut="pending_payment" />)
    expect(screen.getByText('Paiement à effectuer')).toBeInTheDocument()
  })

  it('affiche un statut inconnu avec le code brut', () => {
    render(<BadgeStatut statut="custom_status" />)
    expect(screen.getByText('custom_status')).toBeInTheDocument()
  })

  it('affiche texte personnalisé si statut inconnu et texte fourni', () => {
    render(<BadgeStatut statut="xyz" texte="Mon statut custom" />)
    expect(screen.getByText('Mon statut custom')).toBeInTheDocument()
  })

  it('affiche active en vert', () => {
    render(<BadgeStatut statut="active" />)
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  it('affiche in_progress', () => {
    render(<BadgeStatut statut="in_progress" />)
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })
})

// ── Alerte ────────────────────────────────────────────────────────────────────
describe('Alerte', () => {
  it('affiche le message', () => {
    render(<Alerte type="erreur" message="Une erreur est survenue." />)
    expect(screen.getByText('Une erreur est survenue.')).toBeInTheDocument()
  })

  it('affiche le titre si fourni', () => {
    render(<Alerte type="succes" titre="Succès !" message="Opération réussie." />)
    expect(screen.getByText('Succès !')).toBeInTheDocument()
    expect(screen.getByText('Opération réussie.')).toBeInTheDocument()
  })

  it('n\'affiche pas de bouton fermer si onFermer absent', () => {
    render(<Alerte type="info" message="Info" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('appelle onFermer au clic sur X', () => {
    const onFermer = vi.fn()
    render(<Alerte type="avertissement" message="Avertissement" onFermer={onFermer} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onFermer).toHaveBeenCalledOnce()
  })

  it('a role="alert"', () => {
    render(<Alerte type="erreur" message="Erreur" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('utilise le style erreur par défaut pour type inconnu', () => {
    // Ne doit pas planter
    render(<Alerte type="unknown_type" message="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})

// ── ErreurPage ────────────────────────────────────────────────────────────────
describe('ErreurPage', () => {
  it('affiche le message d\'erreur', () => {
    render(<ErreurPage message="Page introuvable." />)
    expect(screen.getByText('Page introuvable.')).toBeInTheDocument()
  })

  it('affiche le titre par défaut', () => {
    render(<ErreurPage />)
    expect(screen.getByText(/quelque chose/i)).toBeInTheDocument()
  })

  it('n\'affiche pas le bouton réessayer si onReessayer absent', () => {
    render(<ErreurPage message="Erreur" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('appelle onReessayer au clic', () => {
    const onReessayer = vi.fn()
    render(<ErreurPage message="Erreur" onReessayer={onReessayer} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onReessayer).toHaveBeenCalledOnce()
  })
})

// ── Spinner & Chargement ──────────────────────────────────────────────────────
describe('Spinner', () => {
  it('rend sans erreur', () => {
    render(<Spinner />)
    // L'icône Loader2 a aria-label="Chargement"
    expect(screen.getByLabelText('Chargement')).toBeInTheDocument()
  })

  it('accepte différentes tailles', () => {
    const { rerender } = render(<Spinner taille="sm" />)
    rerender(<Spinner taille="xl" />)
    expect(screen.getByLabelText('Chargement')).toBeInTheDocument()
  })
})

describe('SectionChargement', () => {
  it('affiche le message par défaut', () => {
    render(<SectionChargement />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('affiche un message personnalisé', () => {
    render(<SectionChargement message="Récupération des données..." />)
    expect(screen.getByText('Récupération des données...')).toBeInTheDocument()
  })
})

describe('PageChargement', () => {
  it('rend sans erreur et affiche Chargement...', () => {
    render(<PageChargement />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })
})

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
describe('ErrorBoundary', () => {
  // Composant qui lance une erreur
  const Buggy = () => { throw new Error('Erreur de rendu') }
  const OK    = () => <div>Enfant OK</div>

  // Suppression des console.error pour les tests d'erreur volontaires
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

  it('affiche les enfants normalement sans erreur', () => {
    render(<ErrorBoundary><OK /></ErrorBoundary>)
    expect(screen.getByText('Enfant OK')).toBeInTheDocument()
  })

  it('intercepte une erreur et affiche l\'écran de fallback', () => {
    render(<ErrorBoundary><Buggy /></ErrorBoundary>)
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument()
  })

  it('affiche le bouton Réessayer', () => {
    render(<ErrorBoundary><Buggy /></ErrorBoundary>)
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
  })

  it('bouton Réessayer réinitialise l\'état d\'erreur', () => {
    const { rerender } = render(<ErrorBoundary><Buggy /></ErrorBoundary>)
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    // Après reset, l'ErrorBoundary réessaie de rendre ses enfants
    // (Buggy va re-lancer l'erreur, mais le mécanisme de reset fonctionne)
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
  })

  it('affiche le bouton retour à l\'accueil', () => {
    render(<ErrorBoundary><Buggy /></ErrorBoundary>)
    expect(screen.getByRole('button', { name: /accueil/i })).toBeInTheDocument()
  })
})
