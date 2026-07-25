/**
 * Tests — src/lib/images.js
 */
import { describe, it, expect } from 'vitest'
import {
  getImageHebergement,
  getImageChambre,
  getImageDestination,
  IMAGES_HEBERGEMENT,
  IMAGES_CHAMBRE,
} from '../lib/images'

// ── getImageHebergement ───────────────────────────────────────────────────────
describe('getImageHebergement', () => {
  it('retourne une URL pour un type connu (hotel)', () => {
    const url = getImageHebergement('hotel')
    expect(url).toMatch(/^https:\/\//)
  })

  it('retourne une URL pour villa', () => {
    expect(getImageHebergement('villa')).toMatch(/^https:\/\//)
  })

  it('fallback sur hotel pour un type inconnu', () => {
    const url = getImageHebergement('unknown_type')
    expect(IMAGES_HEBERGEMENT.hotel).toContain(url)
  })

  it('cycle sur les images via index', () => {
    const liste = IMAGES_HEBERGEMENT.hotel
    expect(getImageHebergement('hotel', 0)).toBe(liste[0])
    expect(getImageHebergement('hotel', liste.length)).toBe(liste[0]) // cycle
  })
})

// ── getImageChambre ───────────────────────────────────────────────────────────
describe('getImageChambre', () => {
  it('retourne l\'image suite pour "suite"', () => {
    expect(getImageChambre('Suite Présidentielle')).toBe(IMAGES_CHAMBRE.suite)
  })

  it('retourne l\'image deluxe pour "deluxe"', () => {
    expect(getImageChambre('Chambre Deluxe')).toBe(IMAGES_CHAMBRE.deluxe)
  })

  it('retourne l\'image twin pour "twin"', () => {
    expect(getImageChambre('Twin Room')).toBe(IMAGES_CHAMBRE.twin)
  })

  it('retourne l\'image studio pour "studio"', () => {
    expect(getImageChambre('Studio Moderne')).toBe(IMAGES_CHAMBRE.studio)
  })

  it('retourne l\'image familiale pour "famil"', () => {
    expect(getImageChambre('Chambre Familiale')).toBe(IMAGES_CHAMBRE.familiale)
  })

  it('retourne standard par défaut', () => {
    expect(getImageChambre('Chambre Ordinaire')).toBe(IMAGES_CHAMBRE.standard)
  })

  it('retourne standard pour chaîne vide', () => {
    expect(getImageChambre('')).toBe(IMAGES_CHAMBRE.standard)
  })

  it('est insensible à la casse', () => {
    expect(getImageChambre('SUITE ROYALE')).toBe(IMAGES_CHAMBRE.suite)
  })
})

// ── getImageDestination ───────────────────────────────────────────────────────
describe('getImageDestination', () => {
  it('retourne une URL pour Abidjan', () => {
    const url = getImageDestination('Abidjan')
    expect(url).toBeTruthy()
  })

  it('retourne l\'image par défaut pour une ville inconnue', () => {
    const url = getImageDestination('VilleInexistante')
    expect(url).toMatch(/^https:\/\//)
  })
})
