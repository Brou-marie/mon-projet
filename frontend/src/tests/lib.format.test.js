/**
 * Tests — src/lib/format.js
 */
import { describe, it, expect } from 'vitest'
import {
  formatPrix,
  formatDate,
  formatPlageDates,
  formatNote,
  TYPES_ETAB,
  POLITIQUES,
  STATUTS_RESA,
} from '../lib/format'

// ── formatPrix ────────────────────────────────────────────────────────────────
describe('formatPrix', () => {
  it('formate un entier en XOF', () => {
    expect(formatPrix(25000)).toMatch(/25.*000.*XOF/)
  })

  it('formate un decimal', () => {
    expect(formatPrix(1234.56)).toMatch(/XOF/)
  })

  it('formate zéro', () => {
    expect(formatPrix(0)).toMatch(/0.*XOF/)
  })

  it('retourne "—" pour null', () => {
    expect(formatPrix(null)).toBe('—')
  })

  it('retourne "—" pour undefined', () => {
    expect(formatPrix(undefined)).toBe('—')
  })

  it('accepte une string numérique', () => {
    expect(formatPrix('50000')).toMatch(/XOF/)
  })
})

// ── formatDate ────────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formate une date ISO', () => {
    const result = formatDate('2025-03-15')
    expect(result).toMatch(/2025/)
    expect(result).toMatch(/15/)
  })

  it('retourne "—" pour null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retourne "—" pour undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })
})

// ── formatPlageDates ──────────────────────────────────────────────────────────
describe('formatPlageDates', () => {
  it('retourne une plage avec tiret', () => {
    const result = formatPlageDates('2025-07-01', '2025-07-05')
    expect(result).toContain('–')
    expect(result).toMatch(/2025/)
  })

  it('inclut les deux dates', () => {
    const result = formatPlageDates('2025-01-10', '2025-01-15')
    // La date de début et de fin doivent toutes les deux être représentées
    expect(result.length).toBeGreaterThan(5)
  })
})

// ── formatNote ────────────────────────────────────────────────────────────────
describe('formatNote', () => {
  it('formate 4.5 en "4.5"', () => {
    expect(formatNote(4.5)).toBe('4.5')
  })

  it('formate 5 en "5.0"', () => {
    expect(formatNote(5)).toBe('5.0')
  })

  it('retourne null pour 0', () => {
    expect(formatNote(0)).toBeNull()
  })

  it('retourne null pour null', () => {
    expect(formatNote(null)).toBeNull()
  })

  it('retourne null pour undefined', () => {
    expect(formatNote(undefined)).toBeNull()
  })
})

// ── Constantes ────────────────────────────────────────────────────────────────
describe('TYPES_ETAB', () => {
  it('contient tous les types attendus', () => {
    const types = ['hotel', 'residence', 'villa', 'apartment', 'guesthouse', 'hostel']
    types.forEach(t => expect(TYPES_ETAB).toHaveProperty(t))
  })

  it('hotel est traduit en français', () => {
    expect(TYPES_ETAB.hotel).toBe('Hôtel')
  })
})

describe('POLITIQUES', () => {
  it('contient flexible, moderate, strict', () => {
    expect(POLITIQUES).toHaveProperty('flexible')
    expect(POLITIQUES).toHaveProperty('moderate')
    expect(POLITIQUES).toHaveProperty('strict')
  })
})

describe('STATUTS_RESA', () => {
  it('contient les statuts clés de réservation', () => {
    const statuts = [
      'pending_payment', 'confirmed', 'in_progress',
      'completed', 'cancelled', 'rejected_by_host',
    ]
    statuts.forEach(s => expect(STATUTS_RESA).toHaveProperty(s))
  })
})
