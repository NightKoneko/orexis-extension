// Types for the Fribbels optimizer window globals
import type { Relic } from './relic'

export interface Character {
  id: string
  name?: string
  builds?: Build[]
  equipped?: Record<string, string>
  form?: {
    characterId?: string
    [key: string]: unknown
  }
}

export interface Build {
  name: string
  relicIds?: string[]
  build?: string[]
  score?: { score: string; rating: string }
  [key: string]: unknown
}

export function getBuildRelicIds(build: Build | null | undefined): string[] {
  if (!build) return []
  return (build.relicIds ?? build.build ?? []).filter(Boolean)
}

export interface Team {
  id: string
  name: string
  members: TeamMember[]
}

export interface TeamMember {
  characterId: string
  buildName?: string
  buildIndex?: number
  enabled?: boolean
}

export interface OptimizerState {
  characters?: Character[]
  relics?: Relic[]
  relicsById?: Partial<Record<string, Relic>>
  teams?: Team[]
  globalThemeConfig?: Record<string, unknown>
  metadata?: {
    characters?: Record<string, { id: string; name?: string; displayName?: string }>
  }
}

export interface OptimizerStore {
  <T>(selector: (state: OptimizerState & { activeKey: string }) => T): T
  (): OptimizerState & { activeKey: string }
  getState: () => OptimizerState & { activeKey: string; setActiveKey: (key: string) => void }
  setState: (state: Partial<OptimizerState>) => void
  subscribe: (listener: (state: { activeKey: string }) => void) => () => void
}

declare global {
  interface Window {
    store?: OptimizerStore
    DB?: {
      getCharacters: () => Character[]
      getCharacterById: (id: string) => Character | undefined
      getRelics: () => Relic[]
      getRelicById: (id: string | undefined) => Relic | undefined
      getRelicsById: () => Partial<Record<string, Relic>>
      getMetadata?: () => { characters?: Record<string, { name?: string; longName?: string }> }
      setCharacters: (characters: Character[]) => void
      setCharacter: (character: Character) => void
      saveCharacterBuild: (name: string, characterId: string, score: { score: string; rating: string }) => { error?: string } | void
      deleteCharacterBuild: (characterId: string, name: string) => void
      clearCharacterBuilds: (characterId: string) => void
      [key: string]: unknown
    }
    Assets?: {
      getCharacterAvatarById: (id: string) => string
      getSetImage: (set: string, part?: string) => string
      getStatIcon: (stat: string) => string
      getBlank: () => string
      [key: string]: unknown
    }
    i18next?: {
      t: (key: string, options?: object) => string
      getFixedT: (lng: string | null, ns: string) => (key: string) => string
      resolvedLanguage?: string
    }
    __hsrLightConeRanks?: Record<string, {
      properties?: Array<Array<{ type?: string; value?: number }>>
    }>
    SaveState?: {
      save: () => void
      load: (notify?: boolean, force?: boolean) => void
    }
  }
}

export {}
