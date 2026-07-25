/**
 * Tests — src/contextes/AuthContexte.jsx
 * Couvre : ProviderAuth, useAuth, connecter, inscrire, deconnecter,
 *          mettreAJourProfil, flags de rôle, accueilRole
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { ProviderAuth, useAuth } from '../contextes/AuthContexte'
import * as apiModule from '../services/api'

// Composant consommateur pour tester le contexte
function Consommateur() {
  const {
    utilisateur, chargement, estConnecte, estVoyageur,
    estHebergeur, estAdmin, accueilRole,
  } = useAuth()
  return (
    <div>
      <span data-testid="email">{utilisateur?.email ?? 'none'}</span>
      <span data-testid="role">{utilisateur?.role ?? 'none'}</span>
      <span data-testid="chargement">{chargement ? 'oui' : 'non'}</span>
      <span data-testid="connecte">{estConnecte ? 'oui' : 'non'}</span>
      <span data-testid="voyageur">{estVoyageur ? 'oui' : 'non'}</span>
      <span data-testid="hebergeur">{estHebergeur ? 'oui' : 'non'}</span>
      <span data-testid="admin">{estAdmin ? 'oui' : 'non'}</span>
      <span data-testid="accueil">{accueilRole()}</span>
    </div>
  )
}

// Composant qui appelle connecter
function BoutonConnecter({ email, mdp }) {
  const { connecter } = useAuth()
  return (
    <button onClick={() => connecter(email, mdp)}>Connecter</button>
  )
}

// Composant qui appelle inscrire
function BoutonInscrire({ donnees }) {
  const { inscrire } = useAuth()
  return (
    <button onClick={() => inscrire(donnees)}>Inscrire</button>
  )
}

// Composant qui appelle deconnecter
function BoutonDeconnecter() {
  const { deconnecter } = useAuth()
  return <button onClick={() => deconnecter()}>Deconnecter</button>
}

// Composant qui appelle mettreAJourProfil
function BoutonMaj({ user }) {
  const { mettreAJourProfil } = useAuth()
  return <button onClick={() => mettreAJourProfil(user)}>Mettre à jour</button>
}

// ── Setup commun ──────────────────────────────────────────────────────────────
const userVoyageur = { id: '1', email: 'client@test.ci', role: 'guest' }
const userHebergeur = { id: '2', email: 'hotel@test.ci', role: 'host' }
const userAdmin    = { id: '3', email: 'admin@test.ci', role: 'superadmin' }
const userModo     = { id: '4', email: 'modo@test.ci',  role: 'moderator' }

function renderAvecProvider(ui) {
  return render(<ProviderAuth>{ui}</ProviderAuth>)
}

// ── État initial ──────────────────────────────────────────────────────────────
describe('ProviderAuth — état initial', () => {
  it('non connecté par défaut', () => {
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('connecte').textContent).toBe('non')
    expect(screen.getByTestId('email').textContent).toBe('none')
  })

  it('chargement est false par défaut', () => {
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('chargement').textContent).toBe('non')
  })

  it('accueilRole retourne / quand non connecté', () => {
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('accueil').textContent).toBe('/')
  })

  it('lève une erreur si useAuth utilisé hors ProviderAuth', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consommateur />)).toThrow('useAuth doit être utilisé dans ProviderAuth')
  })
})

// ── Initialisation depuis localStorage ───────────────────────────────────────
describe('ProviderAuth — restauration depuis localStorage', () => {
  beforeEach(() => {
    localStorage.setItem('utilisateur', JSON.stringify(userVoyageur))
    localStorage.setItem('access_token', 'tok123')
  })

  it('restaure l\'utilisateur depuis localStorage', () => {
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('email').textContent).toBe('client@test.ci')
    expect(screen.getByTestId('connecte').textContent).toBe('oui')
  })

  it('estVoyageur true pour role guest', () => {
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('voyageur').textContent).toBe('oui')
    expect(screen.getByTestId('hebergeur').textContent).toBe('non')
    expect(screen.getByTestId('admin').textContent).toBe('non')
  })
})

// ── Flags de rôle ─────────────────────────────────────────────────────────────
describe('ProviderAuth — flags de rôle', () => {
  it('estHebergeur true pour role host', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userHebergeur))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('hebergeur').textContent).toBe('oui')
    expect(screen.getByTestId('voyageur').textContent).toBe('non')
  })

  it('estAdmin true pour superadmin', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userAdmin))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('admin').textContent).toBe('oui')
  })

  it('estAdmin true pour moderator', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userModo))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('admin').textContent).toBe('oui')
  })
})

// ── accueilRole ───────────────────────────────────────────────────────────────
describe('accueilRole', () => {
  it('retourne /hebergeur/tableau-de-bord pour host', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userHebergeur))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('accueil').textContent).toBe('/hebergeur/tableau-de-bord')
  })

  it('retourne /voyageur/tableau-de-bord pour guest', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userVoyageur))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('accueil').textContent).toBe('/voyageur/tableau-de-bord')
  })

  it('retourne l\'URL admin pour superadmin', () => {
    localStorage.setItem('utilisateur', JSON.stringify(userAdmin))
    renderAvecProvider(<Consommateur />)
    expect(screen.getByTestId('accueil').textContent).toContain('admin')
  })
})

// ── connecter ─────────────────────────────────────────────────────────────────
describe('connecter', () => {
  it('met à jour utilisateur après connexion réussie', async () => {
    vi.spyOn(apiModule.api, 'post').mockResolvedValue({
      access: 'newtoken',
      refresh: 'newrefresh',
      user: userVoyageur,
    })

    renderAvecProvider(
      <>
        <Consommateur />
        <BoutonConnecter email="client@test.ci" mdp="pass123" />
      </>
    )

    await act(async () => {
      screen.getByRole('button').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('email').textContent).toBe('client@test.ci')
      expect(screen.getByTestId('connecte').textContent).toBe('oui')
    })
  })

  it('propage l\'erreur API si connexion échoue', async () => {
    vi.spyOn(apiModule.api, 'post').mockRejectedValue(new Error('Identifiants incorrects.'))

    let erreurCapturee = null
    function TestErreur() {
      const { connecter } = useAuth()
      return (
        <button
          onClick={async () => {
            try { await connecter('x@x.ci', 'bad') }
            catch (e) { erreurCapturee = e.message }
          }}
        >
          Connecter
        </button>
      )
    }

    renderAvecProvider(<TestErreur />)
    await act(async () => { screen.getByRole('button').click() })
    expect(erreurCapturee).toBe('Identifiants incorrects.')
  })
})

// ── inscrire ──────────────────────────────────────────────────────────────────
describe('inscrire', () => {
  it('met à jour utilisateur après inscription réussie', async () => {
    vi.spyOn(apiModule.api, 'post').mockResolvedValue({
      access: 'tok',
      refresh: 'ref',
      user: userHebergeur,
    })

    renderAvecProvider(
      <>
        <Consommateur />
        <BoutonInscrire donnees={{ email: 'hotel@test.ci', role: 'host' }} />
      </>
    )

    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => {
      expect(screen.getByTestId('email').textContent).toBe('hotel@test.ci')
    })
  })
})

// ── deconnecter ───────────────────────────────────────────────────────────────
describe('deconnecter', () => {
  it('efface l\'utilisateur', async () => {
    localStorage.setItem('utilisateur', JSON.stringify(userVoyageur))
    localStorage.setItem('access_token', 'tok')
    localStorage.setItem('refresh_token', 'ref')

    vi.spyOn(apiModule.api, 'post').mockResolvedValue({})

    renderAvecProvider(
      <>
        <Consommateur />
        <BoutonDeconnecter />
      </>
    )

    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => {
      expect(screen.getByTestId('connecte').textContent).toBe('non')
      expect(screen.getByTestId('email').textContent).toBe('none')
    })
  })

  it('efface même si l\'API logout échoue', async () => {
    localStorage.setItem('utilisateur', JSON.stringify(userVoyageur))
    localStorage.setItem('access_token', 'tok')
    localStorage.setItem('refresh_token', 'ref')

    vi.spyOn(apiModule.api, 'post').mockRejectedValue(new Error('Réseau'))

    renderAvecProvider(
      <>
        <Consommateur />
        <BoutonDeconnecter />
      </>
    )

    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => {
      expect(screen.getByTestId('connecte').textContent).toBe('non')
    })
  })
})

// ── mettreAJourProfil ─────────────────────────────────────────────────────────
describe('mettreAJourProfil', () => {
  it('met à jour l\'email affiché', async () => {
    localStorage.setItem('utilisateur', JSON.stringify(userVoyageur))

    renderAvecProvider(
      <>
        <Consommateur />
        <BoutonMaj user={{ ...userVoyageur, email: 'nouveau@test.ci' }} />
      </>
    )

    await act(async () => { screen.getByRole('button').click() })

    await waitFor(() => {
      expect(screen.getByTestId('email').textContent).toBe('nouveau@test.ci')
    })
  })
})
