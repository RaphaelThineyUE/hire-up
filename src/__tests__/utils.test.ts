import { describe, it, expect } from 'vitest'
import { deriveMatchLabel, scoreColor } from '../lib/utils'

describe('deriveMatchLabel', () => {
  it('returns null for null score', () => {
    expect(deriveMatchLabel(null)).toBeNull()
  })
  it('returns low for 0-39', () => {
    expect(deriveMatchLabel(0)).toBe('low')
    expect(deriveMatchLabel(39)).toBe('low')
  })
  it('returns medium for 40-69', () => {
    expect(deriveMatchLabel(40)).toBe('medium')
    expect(deriveMatchLabel(69)).toBe('medium')
  })
  it('returns high for 70-100', () => {
    expect(deriveMatchLabel(70)).toBe('high')
    expect(deriveMatchLabel(100)).toBe('high')
  })
})

describe('scoreColor', () => {
  it('returns danger for low', () => expect(scoreColor('low')).toBe('var(--danger)'))
  it('returns warning for medium', () => expect(scoreColor('medium')).toBe('var(--warning)'))
  it('returns success for high', () => expect(scoreColor('high')).toBe('var(--success)'))
  it('returns fg-3 for null', () => expect(scoreColor(null)).toBe('var(--fg-3)'))
})
