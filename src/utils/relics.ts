import type { Relic } from '../types'
import { getI18n, getSetImageUrl, getStatIconUrl as _getStatIconUrl } from '../site-api'
import { READABLE_STATS } from '../constants'

export { _getStatIconUrl as getStatIconUrl }
export { GRADE_COLORS } from '../constants'

const FLAT_STATS = new Set(['HP', 'ATK', 'DEF', 'SPD'])

function getLocale(): Intl.LocalesArgument {
  const i18n = getI18n()
  const resolved = i18n?.resolvedLanguage
  if (!resolved) return undefined
  return resolved.replace('_', '-')
}

function localeNumber(value: number): string {
  return value.toLocaleString(getLocale(), { maximumFractionDigits: 0, minimumFractionDigits: 0, useGrouping: false })
}

function localeNumber_0(value: number): string {
  return value.toLocaleString(getLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1, useGrouping: false })
}

function truncate10ths(value: number): number {
  return Math.floor(value * 10) / 10
}

export function isFlatStat(stat: string): boolean {
  return FLAT_STATS.has(stat)
}

export function getReadableStatName(stat: string): string {
  const i18n = getI18n()
  if (i18n?.t) {
    const common = i18n.t(`common:ReadableStats.${stat}`)
    if (common && !common.includes('ReadableStats.')) return common

    const raw = i18n.t(`ReadableStats.${stat}`)
    if (raw && !raw.includes('ReadableStats.')) return raw
  }

  return READABLE_STATS[stat] ?? stat
}

export function getRelicImageUrl(relic: Relic): string {
  return getSetImageUrl(relic.set, relic.part)
}

// c
export function getRelicUid(relic: Relic): string | undefined {
  return relic.uid ?? relic.id
}

export function renderSubstatNumber(stat: string, value: number, verified?: boolean): string {
  if (stat === 'SPD') {
    return verified
      ? localeNumber_0(truncate10ths(value))
      : localeNumber(Math.floor(value))
  }

  return isFlatStat(stat)
    ? localeNumber(Math.floor(value))
    : localeNumber_0(truncate10ths(value))
}

export function renderMainStatNumber(stat: string, value: number): string {
  return isFlatStat(stat)
    ? localeNumber(Math.floor(value))
    : localeNumber_0(truncate10ths(value))
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
