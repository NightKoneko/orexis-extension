export interface SubstatRoll {
  stat: string
  value: number
  addedRolls?: number
}

export interface MainStat {
  stat: string
  value: number
}

export interface Relic {
  id?: string
  uid?: string
  set: string
  part: string
  grade: number
  enhance: number
  main: MainStat
  substats: SubstatRoll[]
  equippedBy?: string
  verified?: boolean
  initialRolls?: number
  augmentedStats: AugmentedStats, // optimiser + relicsGrid cv getter
}

export type AugmentedStats = Record<string, number> & {
  mainStat: string,
  mainValue: number,
}
