import type { Relic } from '../types'
import { getSetImageUrl, getStatIconUrl as _getStatIconUrl } from '../site-api'

export { _getStatIconUrl as getStatIconUrl }
export { GRADE_COLORS } from '../constants'

export function getRelicImageUrl(relic: Relic): string {
  return getSetImageUrl(relic.set, relic.part)
}

// c
export function getRelicUid(relic: Relic): string | undefined {
  return relic.uid ?? relic.id
}

export function getSlotIndex(part: string): number {
  const lower = part.toLowerCase()
  if (lower.includes('head')) return 0
  if (lower.includes('hand')) return 1
  if (lower.includes('body') || lower.includes('chest')) return 2
  if (lower.includes('foot') || lower.includes('feet') || lower.includes('boots')) return 3
  if (lower.includes('sphere') || lower.includes('planar') || lower.includes('orb')) return 4
  if (lower.includes('rope') || lower.includes('link') || lower.includes('cable')) return 5
  return -1
}

export function formatStatValue(stat: string, value: number): string {
  if (value == null || Number.isNaN(value)) return ''

  const isPercent = /%|Rate|Boost|DMG|Effect/i.test(stat)
  if (isPercent) {
    const normalized = value <= 1 ? value * 100 : value
    return `${normalized.toFixed(normalized % 1 === 0 ? 0 : 1)}%`
  }
  return `${Math.round(value)}`
}


export function groupRelicsBySlot(relics: Relic[]): Relic[][] {
  const groups: Relic[][] = [[], [], [], [], [], []]

  for (const relic of relics) {
    const index = getSlotIndex(relic.part)
    if (index >= 0 && index <= 5) {
      groups[index].push(relic)
    }
  }

  for (const group of groups) {
    group.sort((a, b) => (b.enhance ?? 0) - (a.enhance ?? 0))
  }

  return groups
}

export function sortRelicsBySlot<T extends { part?: string }>(relics: T[]): T[] {
  return [...relics].sort((a, b) => {
    return getSlotIndex(a.part ?? '') - getSlotIndex(b.part ?? '')
  })
}
