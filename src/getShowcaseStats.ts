import { Character } from "./types"
import { Relic } from "./types/relic"

export type BasicStatsObject = Record<string, number> & {
  ELEMENTAL_DMG: number
}

export type ShowcaseMetadata = {
  elementalDmgType: string
}

// export type Relic = {
//   set?: string
//   part?: string
//   main?: { stat?: string; value?: number }
//   substats?: Array<{ stat?: string; value?: number }>
//   augmentedStats?: Record<string, number>
//   [key: string]: unknown
// }

export type SingleRelicByPart = Record<string, Relic | null | undefined>

// export type Character = {
//   id?: string
//   form?: Record<string, unknown>
//   [key: string]: unknown
// }

type PageGlobals = {
  DB: {
    getMetadata?: () => { characters?: Record<string, any>; lightCones?: Record<string, any> }
  }
  Constants: {
    Stats: Record<string, string>
  }
  __hsrLightConeRanks?: Record<string, LightConeRankEntry>
}

const STAT_KEYS = [
  'HP%',
  'ATK%',
  'DEF%',
  'SPD%',
  'HP',
  'ATK',
  'DEF',
  'SPD',
  'CRIT Rate',
  'CRIT DMG',
  'Effect Hit Rate',
  'Effect RES',
  'Break Effect',
  'Energy Regeneration Rate',
  'Outgoing Healing Boost',
  'Physical DMG Boost',
  'Fire DMG Boost',
  'Ice DMG Boost',
  'Lightning DMG Boost',
  'Wind DMG Boost',
  'Quantum DMG Boost',
  'Imaginary DMG Boost',
] as const

type StatKey = typeof STAT_KEYS[number]
type StatMap = Record<StatKey, number>

type LightConeRankEntry = {
  properties?: Array<Array<{ type?: string; value?: number }>>
}

const PERCENT_STATS = new Set<string>([
  'HP%',
  'ATK%',
  'DEF%',
  'SPD%',
  'CRIT Rate',
  'CRIT DMG',
  'Effect Hit Rate',
  'Effect RES',
  'Break Effect',
  'Energy Regeneration Rate',
  'Outgoing Healing Boost',
  'Physical DMG Boost',
  'Fire DMG Boost',
  'Ice DMG Boost',
  'Lightning DMG Boost',
  'Wind DMG Boost',
  'Quantum DMG Boost',
  'Imaginary DMG Boost',
])

const ORNAMENT_SET_BONUSES: Record<string, Partial<StatMap>> = {
  'Space Sealing Station': { 'ATK%': 0.12 },
  'Fleet of the Ageless': { 'HP%': 0.12 },
  'Pan-Cosmic Commercial Enterprise': { 'Effect Hit Rate': 0.10 },
  'Belobog of the Architects': { 'DEF%': 0.15 },
  'Celestial Differentiator': { 'CRIT DMG': 0.16 },
  'Inert Salsotto': { 'CRIT Rate': 0.08 },
  'Talia: Kingdom of Banditry': { 'Break Effect': 0.16 },
  'Sprightly Vonwacq': { 'Energy Regeneration Rate': 0.05 },
  'Rutilant Arena': { 'CRIT Rate': 0.08 },
  'Broken Keel': { 'Effect RES': 0.10 },
  'Firmament Frontline: Glamoth': { 'ATK%': 0.12 },
  'Penacony, Land of the Dreams': { 'Energy Regeneration Rate': 0.05 },
  'Sigonia, the Unclaimed Desolation': { 'CRIT Rate': 0.04 },
  'Izumo Gensei and Takama Divine Realm': { 'ATK%': 0.12 },
  'Forge of the Kalpagni Lantern': { 'SPD%': 0.06 },
  'Lushaka, the Sunken Seas': { 'Energy Regeneration Rate': 0.05 },
  'The Wondrous BananAmusement Park': { 'CRIT DMG': 0.16 },
  "Bone Collection's Serene Demesne": { 'HP%': 0.12 },
  'Giant Tree of Rapt Brooding': { 'SPD%': 0.06 },
  'Revelry by the Sea': { 'ATK%': 0.12 },
  'Amphoreus, The Eternal Land': { 'CRIT Rate': 0.08 },
  'Tengoku@Livestream': { 'CRIT DMG': 0.16 },
}

const RELIC_SET_BONUSES: Record<string, { p2?: Partial<StatMap>; p4?: Partial<StatMap>; elementOnly?: StatKey }> = {
  'Passerby of Wandering Cloud': { p2: { 'Outgoing Healing Boost': 0.10 } },
  'Musketeer of Wild Wheat': { p2: { 'ATK%': 0.12 }, p4: { 'SPD%': 0.06 } },
  'Knight of Purity Palace': { p2: { 'DEF%': 0.15 } },
  'Hunter of Glacial Forest': { p2: { 'Ice DMG Boost': 0.10 }, elementOnly: 'Ice DMG Boost' },
  'Champion of Streetwise Boxing': { p2: { 'Physical DMG Boost': 0.10 }, elementOnly: 'Physical DMG Boost' },
  'Firesmith of Lava-Forging': { p2: { 'Fire DMG Boost': 0.10 }, elementOnly: 'Fire DMG Boost' },
  'Genius of Brilliant Stars': { p2: { 'Quantum DMG Boost': 0.10 }, elementOnly: 'Quantum DMG Boost' },
  'Band of Sizzling Thunder': { p2: { 'Lightning DMG Boost': 0.10 }, elementOnly: 'Lightning DMG Boost' },
  'Eagle of Twilight Line': { p2: { 'Wind DMG Boost': 0.10 }, elementOnly: 'Wind DMG Boost' },
  'Thief of Shooting Meteor': { p2: { 'Break Effect': 0.16 }, p4: { 'Break Effect': 0.16 } },
  'Wastelander of Banditry Desert': { p2: { 'Imaginary DMG Boost': 0.10 }, elementOnly: 'Imaginary DMG Boost' },
  'Longevous Disciple': { p2: { 'HP%': 0.12 } },
  'Messenger Traversing Hackerspace': { p2: { 'SPD%': 0.06 } },
  'Prisoner in Deep Confinement': { p2: { 'ATK%': 0.12 } },
  'Pioneer Diver of Dead Waters': { p4: { 'CRIT Rate': 0.04 } },
  'Watchmaker, Master of Dream Machinations': { p2: { 'Break Effect': 0.16 } },
  'Iron Cavalry Against the Scourge': { p2: { 'Break Effect': 0.16 } },
  'The Wind-Soaring Valorous': { p2: { 'ATK%': 0.12 }, p4: { 'CRIT Rate': 0.06 } },
  "Sacerdos' Relived Ordeal": { p2: { 'SPD%': 0.06 } },
  'Scholar Lost in Erudition': { p2: { 'CRIT Rate': 0.08 } },
  'Hero of Triumphant Song': { p2: { 'ATK%': 0.12 } },
  'Poet of Mourning Collapse': { p2: { 'Quantum DMG Boost': 0.10 }, p4: { 'SPD%': -0.08 }, elementOnly: 'Quantum DMG Boost' },
  'Warrior Goddess of Sun and Thunder': { p2: { 'SPD%': 0.06 } },
  'Wavestrider Captain': { p2: { 'CRIT DMG': 0.16 } },
  'World-Remaking Deliverer': { p2: { 'CRIT Rate': 0.08 } },
}

function getGlobals(): PageGlobals {
  const globals = window as unknown as PageGlobals
  if (!globals?.DB?.getMetadata || !globals?.Constants?.Stats) {
    throw new Error('Missing page globals. Ensure getShowcaseStats runs in page context with DB and Constants available.')
  }
  return globals
}

function createZeroStats(): StatMap {
  return STAT_KEYS.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {} as StatMap)
}

function addStat(target: StatMap, stat: string, value: number) {
  if (!STAT_KEYS.includes(stat as StatKey)) return
  const key = stat as StatKey
  target[key] += value
}

function isPercentStat(stat: string): boolean {
  return PERCENT_STATS.has(stat)
}

function normalizeRelicValue(stat: string, value: number): number {
  return isPercentStat(stat) ? value / 100 : value
}

function applyBonus(target: StatMap, bonus?: Partial<StatMap>) {
  if (!bonus) return
  for (const [key, value] of Object.entries(bonus)) {
    if (value == null) continue
    if (!STAT_KEYS.includes(key as StatKey)) continue
    target[key as StatKey] += value
  }
}

function resolveSuperimposition(
  superimpositions: Record<number, Record<string, number>> | undefined,
  level: number,
): Record<string, number> | undefined {
  if (!superimpositions) return undefined
  if (superimpositions[level]) return superimpositions[level]
  if (level >= 0 && superimpositions[level + 1]) return superimpositions[level + 1]
  return undefined
}

function resolveSuperimpositionProperties(
  properties: Array<Array<{ type?: string; value?: number }>> | undefined,
  level: number,
): Array<{ type?: string; value?: number }> | undefined {
  if (!properties) return undefined
  if (properties[level - 1]) return properties[level - 1]
  if (properties[level]) return properties[level]
  return undefined
}

function getLightConeRanks(globals: PageGlobals): Record<string, LightConeRankEntry> | undefined {
  return globals.__hsrLightConeRanks
}

let warnedMissingLightConeRanks = false
const warnedMissingLightConeEntries = new Set<string>()

const LIGHT_CONE_PROP_TO_STAT: Record<string, StatKey | 'ELEMENTAL_DMG'> = {
  AttackAddedRatio: 'ATK%',
  DefenceAddedRatio: 'DEF%',
  HPAddedRatio: 'HP%',
  CriticalChanceBase: 'CRIT Rate',
  CriticalDamageBase: 'CRIT DMG',
  HealRatioBase: 'Outgoing Healing Boost',
  SPRatioBase: 'Energy Regeneration Rate',
  StatusProbabilityBase: 'Effect Hit Rate',
  StatusResistanceBase: 'Effect RES',
  BreakDamageAddedRatioBase: 'Break Effect',
  AllDamageTypeAddedRatio: 'ELEMENTAL_DMG',
}

function sumDirect(base: StatMap, lc: StatMap, relics: StatMap, sets: StatMap, stat: StatKey): number {
  return (base[stat] || 0) + (lc[stat] || 0) + (relics[stat] || 0) + (sets[stat] || 0)
}

export function getShowcaseStats(
  character: Character,
  displayRelics: SingleRelicByPart,
  showcaseMetadata: ShowcaseMetadata,
): BasicStatsObject {
  const globals = getGlobals()
  const metadata = globals.DB.getMetadata?.() || {}
  const form = character.form || {}
  const characterId = (form.characterId as string) || character.id || ''
  const lightConeId = (form.lightCone as string) || ''
  const lightConeSuperimposition = Math.max(1, Number(form.lightConeSuperimposition ?? 1) || 1)

  const characterMetadata = metadata.characters?.[characterId]
  const lightConeMetadata = metadata.lightCones?.[lightConeId]

  const baseStats = createZeroStats()
  const lcStats = createZeroStats()

  if (characterMetadata?.stats) {
    for (const [key, value] of Object.entries(characterMetadata.stats)) {
      if (typeof value === 'number') addStat(baseStats, key, value)
    }
  }

  if (lightConeMetadata?.stats) {
    for (const [key, value] of Object.entries(lightConeMetadata.stats)) {
      if (typeof value === 'number') addStat(lcStats, key, value)
    }
  }

  const pathMatches = !lightConeMetadata?.path || characterMetadata?.path === lightConeMetadata.path
  const lcSuper = pathMatches
    ? resolveSuperimposition(lightConeMetadata?.superimpositions, lightConeSuperimposition)
    : undefined
  if (lcSuper) {
    for (const [key, value] of Object.entries(lcSuper)) {
      if (typeof value === 'number') addStat(lcStats, key, value)
    }
  }

  const lightConeRanks = getLightConeRanks(globals)
  if (!lightConeRanks && !warnedMissingLightConeRanks) {
    warnedMissingLightConeRanks = true
    console.warn('[Orexis] Missing light cone ranks data; passive stats will be skipped.')
  }
  const lcRankEntry = lightConeRanks?.[lightConeId]
  if (lightConeRanks && lightConeId && !lcRankEntry && !warnedMissingLightConeEntries.has(lightConeId)) {
    warnedMissingLightConeEntries.add(lightConeId)
    console.warn(`[Orexis] No light cone rank entry for ${lightConeId}; passive stats may be incomplete.`)
  }
  const lcProps = resolveSuperimpositionProperties(lcRankEntry?.properties, lightConeSuperimposition)
  if (lcProps) {
    for (const prop of lcProps) {
      const statKey = prop?.type ? LIGHT_CONE_PROP_TO_STAT[prop.type] : undefined
      if (!statKey || typeof prop.value !== 'number') continue
      if (statKey === 'ELEMENTAL_DMG') {
        if (showcaseMetadata.elementalDmgType) {
          addStat(lcStats, showcaseMetadata.elementalDmgType, prop.value)
        }
        continue
      }
      addStat(lcStats, statKey, prop.value)
    }
  }

  const relicStats = createZeroStats()

  for (const relic of Object.values(displayRelics)) {
    if (!relic) continue

    if (relic.augmentedStats && typeof relic.augmentedStats === 'object') {
      for (const [key, value] of Object.entries(relic.augmentedStats)) {
        if (key === 'mainStat' || key === 'mainValue') continue
        if (typeof value !== 'number') continue
        addStat(relicStats, key, value)
      }
      continue
    }

    if (relic.main?.stat && typeof relic.main.value === 'number') {
      addStat(relicStats, relic.main.stat, normalizeRelicValue(relic.main.stat, relic.main.value))
    }

    if (Array.isArray(relic.substats)) {
      for (const substat of relic.substats) {
        if (!substat?.stat || typeof substat.value !== 'number') continue
        addStat(relicStats, substat.stat, normalizeRelicValue(substat.stat, substat.value))
      }
    }
  }

  const setBonusStats = createZeroStats()
  const relicSetCounts: Record<string, number> = {}

  for (const relic of [displayRelics.Head, displayRelics.Hands, displayRelics.Body, displayRelics.Feet]) {
    const setName = relic?.set
    if (!setName) continue
    relicSetCounts[setName] = (relicSetCounts[setName] || 0) + 1
  }

  for (const [setName, count] of Object.entries(relicSetCounts)) {
    const bonus = RELIC_SET_BONUSES[setName]
    if (!bonus) continue

    if (count >= 2) {
      if (!bonus.elementOnly || bonus.elementOnly === showcaseMetadata.elementalDmgType) {
        applyBonus(setBonusStats, bonus.p2)
      }
    }

    if (count >= 4) {
      applyBonus(setBonusStats, bonus.p4)
    }
  }

  const planarSet = displayRelics.PlanarSphere?.set
  const ropeSet = displayRelics.LinkRope?.set
  if (planarSet && ropeSet && planarSet === ropeSet) {
    applyBonus(setBonusStats, ORNAMENT_SET_BONUSES[planarSet])
  }

  const finalStats: BasicStatsObject = {
    ...createZeroStats(),
    ELEMENTAL_DMG: 0,
  }

  const baseHP = (baseStats.HP || 0) + (lcStats.HP || 0)
  const baseATK = (baseStats.ATK || 0) + (lcStats.ATK || 0)
  const baseDEF = (baseStats.DEF || 0) + (lcStats.DEF || 0)
  const baseSPD = (baseStats.SPD || 0) + (lcStats.SPD || 0)

  finalStats['HP%'] = sumDirect(baseStats, lcStats, relicStats, setBonusStats, 'HP%')
  finalStats['ATK%'] = sumDirect(baseStats, lcStats, relicStats, setBonusStats, 'ATK%')
  finalStats['DEF%'] = sumDirect(baseStats, lcStats, relicStats, setBonusStats, 'DEF%')
  finalStats['SPD%'] = sumDirect(baseStats, lcStats, relicStats, setBonusStats, 'SPD%')

  finalStats.HP = baseHP * (1 + finalStats['HP%']) + sumDirect(createZeroStats(), createZeroStats(), relicStats, setBonusStats, 'HP')
  finalStats.ATK = baseATK * (1 + finalStats['ATK%']) + sumDirect(createZeroStats(), createZeroStats(), relicStats, setBonusStats, 'ATK')
  finalStats.DEF = baseDEF * (1 + finalStats['DEF%']) + sumDirect(createZeroStats(), createZeroStats(), relicStats, setBonusStats, 'DEF')
  finalStats.SPD = baseSPD * (1 + finalStats['SPD%']) + sumDirect(createZeroStats(), createZeroStats(), relicStats, setBonusStats, 'SPD')

  for (const key of STAT_KEYS) {
    if (key === 'HP%' || key === 'ATK%' || key === 'DEF%' || key === 'SPD%') continue
    if (key === 'HP' || key === 'ATK' || key === 'DEF' || key === 'SPD') continue
    finalStats[key] = sumDirect(baseStats, lcStats, relicStats, setBonusStats, key)
  }

  finalStats.ELEMENTAL_DMG = finalStats[showcaseMetadata.elementalDmgType as StatKey] || 0
  if (STAT_KEYS.includes(showcaseMetadata.elementalDmgType as StatKey)) {
    finalStats[showcaseMetadata.elementalDmgType as StatKey] = finalStats.ELEMENTAL_DMG
  }

  return finalStats
}

// Example usage:
// getShowcaseStats(
//   { id: '1001', form: { characterId: '1001', lightCone: '20003', lightConeSuperimposition: 1 } },
//   {
//     Head: { set: 'Passerby of Wandering Cloud', main: { stat: 'HP', value: 705.6 }, substats: [] },
//     Hands: null,
//     Body: null,
//     Feet: null,
//     PlanarSphere: null,
//     LinkRope: null,
//   },
//   { elementalDmgType: 'Ice DMG Boost' },
// )
