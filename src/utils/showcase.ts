import type { Relic } from '../types'
import type { SingleRelicByPart } from '../getShowcaseStats'

export const ELEMENT_TO_DMG_TYPE: Record<string, string> = {
  Physical: 'Physical DMG Boost',
  Fire: 'Fire DMG Boost',
  Ice: 'Ice DMG Boost',
  Lightning: 'Lightning DMG Boost',
  Wind: 'Wind DMG Boost',
  Quantum: 'Quantum DMG Boost',
  Imaginary: 'Imaginary DMG Boost',
}

export const SHOWCASE_STAT_KEYS = [
  'HP',
  'ATK',
  'DEF',
  'SPD',
  'CRIT Rate',
  'CRIT DMG',
  'Effect Hit Rate',
  'Effect RES',
  'Break Effect',
] as const

const SHOWCASE_PERCENT_STATS = new Set<string>([
  'CRIT Rate',
  'CRIT DMG',
  'Effect Hit Rate',
  'Effect RES',
  'Break Effect',
])

export function formatShowcaseStat(stat: string, value: number): string {
  if (SHOWCASE_PERCENT_STATS.has(stat)) {
    return `${(value * 100).toFixed(2)}%`
  }
  if (stat === 'SPD') {
    return value.toFixed(1)
  }
  return Math.round(value).toString()
}

export function buildRelicsByPart(relics: Relic[]): SingleRelicByPart {
  const byPart: SingleRelicByPart = {
    Head: null,
    Hands: null,
    Body: null,
    Feet: null,
    PlanarSphere: null,
    LinkRope: null,
  }

  for (const relic of relics) {
    if (!relic?.part) continue
    if (relic.part in byPart) {
      byPart[relic.part] = relic
    }
  }

  return byPart
}
