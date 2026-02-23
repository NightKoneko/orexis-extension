import type { Character, Relic, OptimizerState, OptimizerStore } from './types'
import { deriveAssetBasePath } from './constants'

export function getStore(): OptimizerStore | null {
  return window.store ?? null
}

export function getStoreState(): (OptimizerState & { activeKey: string; setActiveKey: (k: string) => void }) | null {
  try {
    return window.store?.getState?.() ?? null
  } catch {
    return null
  }
}

export function getDB() {
  return window.DB ?? null
}

export function getDBMetadata() {
  try {
    return window.DB?.getMetadata?.() ?? null
  } catch {
    return null
  }
}

export function getAllCharacterMeta(): Record<string, Record<string, unknown>> {
  try {
    const db = getDBMetadata()?.characters
    if (db && Object.keys(db).length > 0) return db as Record<string, Record<string, unknown>>
  } catch { /* ignore */ }
  try {
    const store = getStoreState()?.metadata?.characters
    if (store) return store as Record<string, Record<string, unknown>>
  } catch { /* ignore */ }
  return {}
}

export function getCharacterMeta(characterId: string): Record<string, unknown> | null {
  const all = getAllCharacterMeta()
  return (all[characterId] as Record<string, unknown>) ?? null
}

export function getLightConeMeta(lightConeId: string): Record<string, unknown> | null {
  if (!lightConeId) return null
  try {
    const db = getDBMetadata()?.lightCones
    if (db && db[lightConeId]) return db[lightConeId] as Record<string, unknown>
  } catch { /* ignore */ }
  try {
    const store = (getStoreState()?.metadata as Record<string, unknown> | undefined)?.lightCones as Record<string, unknown> | undefined
    if (store && store[lightConeId]) return store[lightConeId] as Record<string, unknown>
  } catch { /* ignore */ }
  return null
}

export function getAssets() {
  return window.Assets ?? null
}

export function buildAssetUrl(path: string): string {
  return new URL(`${deriveAssetBasePath()}${path}`, window.location.origin).href
}

export function getBlankUrl(): string {
  return getAssets()?.getBlank?.() ?? buildAssetUrl('/misc/blank.webp')
}

export function getCharacterAvatarUrl(characterId: string): string {
  return getAssets()?.getCharacterAvatarById?.(characterId)
    ?? buildAssetUrl(`/icon/avatar/${characterId}.webp`)
}

export function getPathIconUrl(path: string): string {
  return buildAssetUrl(`/icon/path/${path}.webp`)
}

export function getElementIconUrl(element: string): string {
  return buildAssetUrl(`/icon/element/${element}.webp`)
}

export function getSetImageUrl(set: string, part: string): string {
  const assets = getAssets()
  if (assets?.getSetImage) return assets.getSetImage(set, part)

  const setId = resolveSetId(set)
  if (!setId) return getBlankUrl()
  const suffix = getPartSuffix(part)
  return buildAssetUrl(`/icon/relic/${setId}${suffix}.webp`)
}

export function getLightConeIconUrl(lightConeId: string): string {
  if (!lightConeId) return getBlankUrl()

  const assets = getAssets() as Record<string, unknown> | null
  const directGetter = assets?.getLightConeIcon ?? assets?.getLightConeImage ?? assets?.getLightCone
  if (typeof directGetter === 'function') {
    return (directGetter as (id: string) => string)(lightConeId)
  }

  const meta = getLightConeMeta(lightConeId)
  const rawIcon = (meta?.icon ?? meta?.iconPath ?? meta?.image ?? meta?.imagePath ?? meta?.portrait ?? meta?.avatar) as string | undefined
  if (rawIcon) {
    if (/^https?:\/\//i.test(rawIcon)) return rawIcon
    const normalized = rawIcon.startsWith('/') ? rawIcon : `/${rawIcon}`
    return buildAssetUrl(normalized)
  }

  return buildAssetUrl(`/image/light_cone_portrait/${lightConeId}.webp`)
}

export function getStatIconUrl(stat: string): string {
  const assets = getAssets()
  if (assets?.getStatIcon) return assets.getStatIcon(stat)

  const icon = STAT_ICON_FILENAMES[stat] ?? 'IconMaxHP.webp'
  return buildAssetUrl(`/icon/property/${icon}`)
}

export function getI18n() {
  return window.i18next ?? null
}


export function resolveCharacterName(
  state: OptimizerState | null,
  characterOrId: Character | string | null,
): string {
  if (!characterOrId) return 'Unknown'

  const id = typeof characterOrId === 'string' ? characterOrId : characterOrId.id
  const directName = typeof characterOrId === 'object' ? characterOrId.name : undefined
  if (directName) return directName

  try {
    const meta = getStoreState()?.metadata?.characters?.[id]
    if (meta?.displayName) return meta.displayName
    if (meta?.name) return meta.name
  } catch { /* ignore */ }

  try {
    const dbMeta = getDBMetadata()?.characters?.[id]
    if (dbMeta?.name) return dbMeta.name
  } catch { /* ignore */ }

  try {
    const i18n = getI18n()
    if (i18n) {
      if (typeof i18n.getFixedT === 'function') {
        const t = i18n.getFixedT(null, 'gameData')
        const longName = t(`Characters.${id}.LongName`)
        if (longName && !longName.startsWith('Characters.')) return longName
        const name = t(`Characters.${id}.Name`)
        if (name && !name.startsWith('Characters.')) return name
      }
      if (typeof i18n.t === 'function') {
        const longName = i18n.t(`gameData:Characters.${id}.LongName`)
        if (longName && !longName.startsWith('gameData:')) return longName
        const name = i18n.t(`gameData:Characters.${id}.Name`)
        if (name && !name.startsWith('gameData:')) return name
      }
    }
  } catch { /* ignore */ }

  const match = state?.characters?.find(c => c.id === id)
  if (match?.name) return match.name

  return id
}

export function findCharacterById(
  state: OptimizerState | null,
  characterId: string,
): Character | undefined {
  return state?.characters?.find(c => c.id === characterId)
}

export function findCharacterByIdFromDB(characterId: string): Character | undefined {
  try {
    return getDB()?.getCharacterById?.(characterId)
  } catch { /* ignore */ }
  return undefined
}

export function getRelicById(relicId: string | undefined): Relic | undefined {
  if (!relicId) return undefined
  try {
    return getDB()?.getRelicById?.(relicId)
  } catch { /* ignore */ }
  try {
    return getStoreState()?.relicsById?.[relicId]
  } catch { /* ignore */ }
  return undefined
}

export function getOptimizerState(): OptimizerState | null {
  try {
    const storeState = getStoreState()
    const db = getDB()

    const characters = db?.getCharacters?.() ?? storeState?.characters ?? []
    const relics = db?.getRelics?.() ?? storeState?.relics ?? []
    const relicsById = storeState?.relicsById ?? {}

    return {
      characters,
      relics,
      relicsById,
      globalThemeConfig: storeState?.globalThemeConfig,
      metadata: storeState?.metadata,
      optimizerTabFocusCharacter: storeState?.optimizerTabFocusCharacter,
      optimizerBuild: storeState?.optimizerBuild ?? {}
    }
  } catch { /* ignore */ }

  // ? 
  try {
    const raw = localStorage.getItem('state')
    if (raw) return JSON.parse(raw) as OptimizerState
  } catch { /* ignore */ }

  return null
}

let _setIdCache: Record<string, string> | null = null

function resolveSetId(setName: string): string | null {
  if (/^\d+$/.test(setName)) return setName
  if (_setIdCache?.[setName]) return _setIdCache[setName]

  try {
    const meta = getDBMetadata()
    const sets = (meta as Record<string, unknown>)?.['relicSets'] as Record<string, { name?: string }> | undefined
    if (sets) {
      if (!_setIdCache) {
        _setIdCache = {}
        for (const [id, data] of Object.entries(sets)) {
          if (data?.name) _setIdCache[data.name] = id
        }
      }
      if (_setIdCache[setName]) return _setIdCache[setName]
    }
  } catch { /* ignore */ }

  return FALLBACK_SET_IDS[setName] ?? null
}

function getPartSuffix(part: string): string {
  const lower = part.toLowerCase()
  if (lower.includes('head')) return '_0'
  if (lower.includes('hand')) return '_1'
  if (lower.includes('body') || lower.includes('chest')) return '_2'
  if (lower.includes('foot') || lower.includes('feet') || lower.includes('boots')) return '_3'
  if (lower.includes('sphere') || lower.includes('planar') || lower.includes('orb')) return '_0'
  if (lower.includes('rope') || lower.includes('link') || lower.includes('cable')) return '_1'
  return ''
}

// prob unnecessary
const STAT_ICON_FILENAMES: Record<string, string> = {
  'HP': 'IconMaxHP.webp',
  'HP%': 'IconMaxHP.webp',
  'ATK': 'IconAttack.webp',
  'ATK%': 'IconAttack.webp',
  'DEF': 'IconDefence.webp',
  'DEF%': 'IconDefence.webp',
  'SPD': 'IconSpeed.webp',
  'CRIT Rate': 'IconCriticalChance.webp',
  'CRIT DMG': 'IconCriticalDamage.webp',
  'Effect Hit Rate': 'IconStatusProbability.webp',
  'Effect RES': 'IconStatusResistance.webp',
  'Break Effect': 'IconBreakUp.webp',
  'Energy Regeneration Rate': 'IconEnergyRecovery.webp',
  'Outgoing Healing Boost': 'IconHealRatio.webp',
  'Physical DMG Boost': 'IconPhysicalAddedRatio.webp',
  'Fire DMG Boost': 'IconFireAddedRatio.webp',
  'Ice DMG Boost': 'IconIceAddedRatio.webp',
  'Lightning DMG Boost': 'IconThunderAddedRatio.webp',
  'Wind DMG Boost': 'IconWindAddedRatio.webp',
  'Quantum DMG Boost': 'IconQuantumAddedRatio.webp',
  'Imaginary DMG Boost': 'IconImaginaryAddedRatio.webp',
}

const FALLBACK_SET_IDS: Record<string, string> = {
  'Passerby of Wandering Cloud': '101',
  'Musketeer of Wild Wheat': '102',
  'Knight of Purity Palace': '103',
  'Hunter of Glacial Forest': '104',
  'Champion of Streetwise Boxing': '105',
  'Guard of Wuthering Snow': '106',
  'Firesmith of Lava-Forging': '107',
  'Genius of Brilliant Stars': '108',
  'Band of Sizzling Thunder': '109',
  'Eagle of Twilight Line': '110',
  'Thief of Shooting Meteor': '111',
  'Wastelander of Banditry Desert': '112',
  'Longevous Disciple': '113',
  'Messenger Traversing Hackerspace': '114',
  'The Ashblazing Grand Duke': '115',
  'Prisoner in Deep Confinement': '116',
  'Pioneer Diver of Dead Waters': '117',
  'Watchmaker, Master of Dream Machinations': '118',
  'Iron Cavalry Against the Scourge': '119',
  'The Wind-Soaring Valorous': '120',
  "Sacerdos' Relived Ordeal": '121',
  'Scholar Lost in Erudition': '122',
  'Hero of Triumphant Song': '123',
  'Poet of Mourning Collapse': '124',
  'Warrior Goddess of Sun and Thunder': '125',
  'Wavestrider Captain': '126',
  'World Remaking Deliverer': '127',
  'Self-Enshrouded Recluse': '128',
  'Space Sealing Station': '301',
  'Fleet of the Ageless': '302',
  'Pan-Cosmic Commercial Enterprise': '303',
  'Belobog of the Architects': '304',
  'Celestial Differentiator': '305',
  'Inert Salsotto': '306',
  'Talia: Kingdom of Banditry': '307',
  'Sprightly Vonwacq': '308',
  'Rutilant Arena': '309',
  'Broken Keel': '310',
  'Firmament Frontline: Glamoth': '311',
  'Penacony, Land of the Dreams': '312',
  'Sigonia, the Unclaimed Desolation': '313',
  'Izumo Gensei and Takama Divine Realm': '314',
  'Duran, Dynasty of Running Wolves': '315',
  'Forge of the Kalpagni Lantern': '316',
  'Lushaka, the Sunken Seas': '317',
  'The Wondrous BananAmusement Park': '318',
  "Bone Collections' Serene Demesne": '319',
  'Giant Tree of Rapt Brooding': '320',
  'Arcadia of Woven Dreams': '321',
  'Revelry by the Sea': '322',
  'Amphoreus, the Eternal Land': '323',
  'Tengoku Livestream': '324',
}
