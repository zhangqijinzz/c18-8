import { describe, expect, it } from 'vitest'
import { clampTokenValues, contrastRatio, normalizeColor, validateTokens } from '../domain/brandRules'
import { INITIAL_TOKENS } from '../models/brandMirrorModels'

describe('brand token rules', () => {
  it('calculates a readable contrast ratio', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#F15A47', '#24324A')).toBeGreaterThan(3)
  })

  it('clamps extreme values to the supported design scale', () => {
    const clamped = clampTokenValues({ ...INITIAL_TOKENS, typeScale: [1, 80, 14, 20, 28, 40], radiusScale: [-4, 12, 18, 50], spacingScale: [0, 8, 12, 20, 99] })
    expect(clamped.typeScale).toEqual([10, 72, 14, 20, 28, 40])
    expect(clamped.radiusScale).toEqual([0, 12, 18, 40])
    expect(clamped.spacingScale).toEqual([2, 8, 12, 20, 64])
  })

  it('rejects invalid colors and unsupported scale lengths', () => {
    expect(validateTokens({ ...INITIAL_TOKENS, primary: 'red' })).toContain('HEX')
    expect(validateTokens({ ...INITIAL_TOKENS, typeScale: [12] })).toContain('数量')
  })

  it('normalizes valid HEX input and returns null instead of a fallback color for garbage', () => {
    expect(normalizeColor('2a6bff')).toBe('#2A6BFF')
    expect(normalizeColor('  #2a6bff ')).toBe('#2A6BFF')
    // 非法文本不能被静默替换成默认主色红，也不能与原值拼接
    expect(normalizeColor('not-a-color')).toBeNull()
    expect(normalizeColor('#F15A47-not-a-color')).toBeNull()
    expect(normalizeColor('#123')).toBeNull()
    expect(normalizeColor('#GGGGGG')).toBeNull()
  })
})
