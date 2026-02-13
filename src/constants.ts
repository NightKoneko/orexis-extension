export const OREXIS_PAGE_KEY = 'OREXIS'

export const TEAMS_STORAGE_KEY = 'orexisTeamLoadouts'

export const DEFAULT_WS_URL = 'ws://127.0.0.1:945'

export const WS_URL_STORAGE_KEY = 'orexisWsUrl'

export const STORE_WAIT_TIMEOUT = 15_000

export const ELEMENT_WAIT_TIMEOUT = 10_000

export const LOADOUT_APPLY_DELAY = 200

export const BRIDGE_MESSAGE_TIMEOUT = 10_000

export const POST_DOM_SETTLE_DELAY = 500

export const MENU_SELECTORS = [
  '[class*="ant-menu-root"][class*="ant-menu-inline"]',
  '.ant-menu-root.ant-menu-inline',
  'ul[role="menu"]',
] as const

export const CONTENT_SELECTORS = [
  '[class*="ant-layout-content"] [class*="ant-flex"][style*="space-around"]',
  '#OPTIMIZER',
  '[class*="ant-layout-content"] > div',
  '.ant-layout-content > div',
  'main > div',
] as const

export const SUBMENU_SELECTOR = '[class*="ant-menu-submenu"]'

export function deriveAssetBasePath(): string {
  const pathname = window.location?.pathname ?? ''
  const match = pathname.match(/^(\/[^/]+)/)
  if (match) return `${match[1]}/assets`
  return '/assets'
}

export const SLOT_ORDER = ['Head', 'Hands', 'Body', 'Feet', 'PlanarSphere', 'LinkRope'] as const

export const RELIC_CARD_WIDTH = 198
export const RELIC_CARD_HEIGHT = 278
export const TEAM_PANEL_MIN_WIDTH = RELIC_CARD_WIDTH * 6 + 8 * 5 + 48

export const SLOT_DISPLAY_NAMES: Record<number, string> = {
  0: 'Head',
  1: 'Hands',
  2: 'Body',
  3: 'Feet',
  4: 'Planar Sphere',
  5: 'Link Rope',
}

export const GRADE_COLORS: Record<number, string> = {
  5: '#efb679',
  4: '#cc52f1',
  3: '#58beed',
  2: '#63e8a2',
}

export const READABLE_STATS: Record<string, string> = {
  'HP%': 'HP %',
  'HP': 'HP',
  'ATK%': 'ATK %',
  'ATK': 'ATK',
  'DEF%': 'DEF %',
  'DEF': 'DEF',
  'SPD%': 'SPD %',
  'SPD': 'SPD',
  'CRIT Rate': 'CRIT Rate',
  'CRIT DMG': 'CRIT DMG',
  'Effect Hit Rate': 'Effect HIT',
  'Effect RES': 'Effect RES',
  'Break Effect': 'Break Effect',
  'Energy Regeneration Rate': 'Energy Regen',
  'Outgoing Healing Boost': 'Healing Boost',
  'Physical DMG Boost': 'Physical DMG',
  'Fire DMG Boost': 'Fire DMG',
  'Ice DMG Boost': 'Ice DMG',
  'Lightning DMG Boost': 'Lightning DMG',
  'Wind DMG Boost': 'Wind DMG',
  'Quantum DMG Boost': 'Quantum DMG',
  'Imaginary DMG Boost': 'Imaginary DMG',
}
