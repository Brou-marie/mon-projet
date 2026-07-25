/**
 * Tests — src/services/api.js
 * Couvre : ErreurApi, session, requete(), api.*
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErreurApi, session, requete, api } from '../services/api'

// ── ErreurApi ─────────────────────────────────────────────────────────────────
describe('ErreurApi', () => {
  it('est une instance d\'Error', () => {
    const e = new ErreurApi('Message', 400)
    expect(e).toBeInstanceOf(Error)
  })

  it('a le bon nom', () => {
    expect(new ErreurApi('x', 400).name).toBe('ErreurApi')
  })

  it('expose statut et details', () => {
    const details = { field: 'email', error: 'invalide' }
    const e = new ErreurApi('msg', 422, details)
    expect(e.statut).toBe(422)
    expect(e.details).toEqual(details)
  })

  it('message correct', () => {
    expect(new ErreurApi('Pas trouvé', 404).message).toBe('Pas trouvé')
  })
})

// ── session ───────────────────────────────────────────────────────────────────
describe('session', () => {
  it('getToken retourne null quand vide', () => {
    expect(session.getToken()).toBeNull()
  })

  it('sauvegarder puis getToken', () => {
    session.sauvegarder({ access: 'tok123' })
    expect(session.getToken()).toBe('tok123')
  })

  it('sauvegarder puis getRefresh', () => {
    session.sauvegarder({ refresh: 'ref456' })
    expect(session.getRefresh()).toBe('ref456')
  })

  it('sauvegarder puis getUtilisateur', () => {
    const user = { id: 1, email: 'a@b.com', role: 'guest' }
    session.sauvegarder({ user })
    expect(session.getUtilisateur()).toEqual(user)
  })

  it('estConnecte retourne false si pas de token', () => {
    expect(session.estConnecte()).toBe(false)
  })

  it('estConnecte retourne true après sauvegarder', () => {
    session.sauvegarder({ access: 'tok' })
    expect(session.estConnecte()).toBe(true)
  })

  it('effacer supprime tout', () => {
    session.sauvegarder({ access: 'tok', refresh: 'ref', user: { id: 1 } })
    session.effacer()
    expect(session.getToken()).toBeNull()
    expect(session.getRefresh()).toBeNull()
    expect(session.getUtilisateur()).toBeNull()
    expect(session.estConnecte()).toBe(false)
  })

  it('mettreAJourUtilisateur met à jour sans effacer les tokens', () => {
    session.sauvegarder({ access: 'tok', user: { id: 1, email: 'old@b.com' } })
    session.mettreAJourUtilisateur({ id: 1, email: 'new@b.com' })
    expect(session.getToken()).toBe('tok')
    expect(session.getUtilisateur()?.email).toBe('new@b.com')
  })

  it('getUtilisateur retourne null si JSON corrompu', () => {
    localStorage.setItem('utilisateur', 'not-json{{{')
    expect(session.getUtilisateur()).toBeNull()
  })
})

// ── requete ───────────────────────────────────────────────────────────────────
describe('requete', () => {
  const mockFetch = (status, body) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      text: () => Promise.resolve(JSON.stringify(body)),
    })
  }

  it('retourne les données en cas de succès (200)', async () => {
    mockFetch(200, { id: 1, name: 'Test' })
    const data = await requete('/test/', { method: 'GET' })
    expect(data).toEqual({ id: 1, name: 'Test' })
  })

  it('ajoute Authorization si token présent', async () => {
    session.sauvegarder({ access: 'montoken' })
    mockFetch(200, {})
    await requete('/test/', { method: 'GET' })
    const call = globalThis.fetch.mock.calls[0]
    const headers = call[1].headers
    expect(headers.get('Authorization')).toBe('Bearer montoken')
  })

  it('n\'ajoute pas Authorization si pas de token', async () => {
    mockFetch(200, {})
    await requete('/test/', { method: 'GET' })
    const call = globalThis.fetch.mock.calls[0]
    const headers = call[1].headers
    expect(headers.get('Authorization')).toBeNull()
  })

  it('lève ErreurApi en cas d\'erreur 400 avec detail', async () => {
    mockFetch(400, { detail: 'Données invalides.' })
    await expect(requete('/test/', { method: 'POST', body: {} }))
      .rejects.toMatchObject({ name: 'ErreurApi', statut: 400, message: 'Données invalides.' })
  })

  it('lève ErreurApi avec non_field_errors', async () => {
    mockFetch(400, { non_field_errors: ['Email requis.'] })
    await expect(requete('/test/', { method: 'POST', body: {} }))
      .rejects.toMatchObject({ message: 'Email requis.' })
  })

  it('lève ErreurApi avec message générique si pas de detail', async () => {
    mockFetch(500, {})
    await expect(requete('/fail/', { method: 'GET' }))
      .rejects.toMatchObject({ statut: 500, message: 'Une erreur est survenue.' })
  })

  it('serialise le body en JSON si pas FormData', async () => {
    mockFetch(201, { ok: true })
    await requete('/create/', { method: 'POST', body: { name: 'NoamHome' } })
    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].body).toBe(JSON.stringify({ name: 'NoamHome' }))
    expect(call[1].headers.get('Content-Type')).toBe('application/json')
  })

  it('ne serialise pas FormData', async () => {
    mockFetch(201, { ok: true })
    const fd = new FormData()
    fd.append('file', new Blob(['test']), 'test.txt')
    await requete('/upload/', { method: 'POST', body: fd })
    const call = globalThis.fetch.mock.calls[0]
    expect(call[1].body).toBeInstanceOf(FormData)
  })

  it('retourne null pour réponse vide', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      text: () => Promise.resolve(''),
    })
    const data = await requete('/delete/', { method: 'DELETE' })
    expect(data).toBeNull()
  })
})

// ── api.* helpers ─────────────────────────────────────────────────────────────
describe('api helpers', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
    })
  })

  it('api.get appelle GET', async () => {
    await api.get('/hebergements/')
    expect(fetch.mock.calls[0][1].method).toBe('GET')
  })

  it('api.post appelle POST', async () => {
    await api.post('/bookings/', { room: 1 })
    expect(fetch.mock.calls[0][1].method).toBe('POST')
  })

  it('api.put appelle PUT', async () => {
    await api.put('/profile/', { name: 'Test' })
    expect(fetch.mock.calls[0][1].method).toBe('PUT')
  })

  it('api.patch appelle PATCH', async () => {
    await api.patch('/profile/', { name: 'Patch' })
    expect(fetch.mock.calls[0][1].method).toBe('PATCH')
  })

  it('api.delete appelle DELETE', async () => {
    await api.delete('/booking/1/')
    expect(fetch.mock.calls[0][1].method).toBe('DELETE')
  })
})
