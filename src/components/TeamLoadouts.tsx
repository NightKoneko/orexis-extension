import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Flex, Button, Input, Typography, Tag, Checkbox, message, theme, Select, Divider, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, TeamOutlined, SendOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { Team, Relic, OptimizerState } from '../types'
import { getBuildRelicIds } from '../types'
import { TEAMS_STORAGE_KEY, LOADOUT_APPLY_DELAY, SLOT_ORDER } from '../constants'
import {
  getOptimizerState,
  resolveCharacterName,
  findCharacterById,
  getCharacterAvatarUrl,
  getAllCharacterMeta,
  getRelicById,
  getBlankUrl,
  getPathIconUrl,
  getElementIconUrl,
} from '../site-api'
import { applyLoadout } from '../utils/bridge'
import { getRelicUid, getRelicImageUrl, sortRelicsBySlot, getSlotIndex } from '../utils/relics'
import { RelicCard } from './RelicCard'
import { BuildEditor } from './BuildEditor'

const { Text, Title } = Typography

const PATHS = ['Abundance', 'Destruction', 'Erudition', 'Harmony', 'Hunt', 'Nihility', 'Preservation', 'Remembrance'] as const
const ELEMENTS = ['Physical', 'Fire', 'Ice', 'Lightning', 'Wind', 'Quantum', 'Imaginary'] as const

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function setsEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

function FilterIcon({ src, active, onClick, title, size = 26 }: {
  src: string
  active: boolean
  onClick: () => void
  title: string
  size?: number
}) {
  const { token } = theme.useToken()
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        width: size + 6,
        height: size + 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        cursor: 'pointer',
        background: active ? token.colorPrimaryBg : 'transparent',
        border: active ? `1px solid ${token.colorPrimaryBorder}` : '1px solid transparent',
        opacity: active ? 1 : 0.45,
        transition: 'all 0.2s',
      }}
    >
      <img src={src} alt={title} style={{ width: size, height: size }} />
    </div>
  )
}

interface TeamWithNames extends Team {
  memberNames: string[]
}

function loadSavedTeams(): Team[] {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
}

function getNextTeamName(): string {
  const teams = loadSavedTeams()
  const usedNumbers = new Set<number>()
  for (const team of teams) {
    const match = team.name.match(/team\s*#?\s*(\d+)/i)
    if (match) usedNumbers.add(Number(match[1]))
  }
  let n = 1
  while (usedNumbers.has(n)) n += 1
  return `Team ${n}`
}

function getTeamsWithNames(state: OptimizerState | null): TeamWithNames[] {
  const teams = loadSavedTeams()
  return teams.map(team => ({
    ...team,
    memberNames: team.members.map(m => {
      const char = findCharacterById(state, m.characterId)
      return resolveCharacterName(state, char ?? m.characterId)
    }),
  }))
}

interface TeamLoadoutsProps {
  onOpenCharacterBuilds?: (characterId: string) => void
}

export function TeamLoadouts({ onOpenCharacterBuilds }: TeamLoadoutsProps) {
  const { token } = theme.useToken()
  const [state, setState] = useState<OptimizerState | null>(null)
  const [teams, setTeams] = useState<TeamWithNames[]>([])
  const [draftTeam, setDraftTeam] = useState<TeamWithNames | null>(null)
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set())
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editSelectedCharacters, setEditSelectedCharacters] = useState<Set<string>>(new Set())
  const [editMemberOrder, setEditMemberOrder] = useState<string[]>([])
  const [memberBuildSelections, setMemberBuildSelections] = useState<Record<string, Record<string, number>>>({})
  const [memberEnabledSelections, setMemberEnabledSelections] = useState<Record<string, Record<string, boolean>>>({})
  const [isEditingMembers, setIsEditingMembers] = useState(false)
  const [characterSearch, setCharacterSearch] = useState('')
  const [pathFilters, setPathFilters] = useState<Set<string>>(new Set())
  const [elementFilters, setElementFilters] = useState<Set<string>>(new Set())
  const [buildEditorOpen, setBuildEditorOpen] = useState(false)
  const [buildEditorCharacterId, setBuildEditorCharacterId] = useState<string | null>(null)
  const [buildEditorBuildIndex, setBuildEditorBuildIndex] = useState(-1)
  const [buildEditorSlot, setBuildEditorSlot] = useState<number | undefined>(undefined)
  const [buildEditorRelicId, setBuildEditorRelicId] = useState<string | undefined>(undefined)

  const refreshState = useCallback(() => {
    const optimizerState = getOptimizerState()
    setState(optimizerState)
    setTeams(getTeamsWithNames(optimizerState))
  }, [])

  useEffect(() => {
    refreshState()
  }, [refreshState])


  useEffect(() => {
    const allTeams = draftTeam ? [draftTeam, ...teams] : teams
    if (!allTeams.length) return
    if (activeTeamId && allTeams.some(t => t.id === activeTeamId)) return
    setActiveTeamId(allTeams[0].id)
  }, [teams, draftTeam, activeTeamId])

  useEffect(() => {
    if (!activeTeamId) return
    const allTeams = draftTeam ? [draftTeam, ...teams] : teams
    const team = allTeams.find(t => t.id === activeTeamId)
    if (!team || team.members.length === 0) return
    if (activeCharacterId && team.members.some(m => m.characterId === activeCharacterId)) return
    setActiveCharacterId(team.members[0].characterId)
  }, [activeTeamId, teams, draftTeam, activeCharacterId])


  useEffect(() => {
    if (!isEditingMembers) return
    const allTeams = draftTeam ? [draftTeam, ...teams] : teams
    const team = allTeams.find(t => t.id === activeTeamId)
    if (!team) return
    const nextSelected = new Set(team.members.map(m => m.characterId))
    const nextOrder = team.members.map(m => m.characterId)
    setEditSelectedCharacters(prev => (setsEqual(prev, nextSelected) ? prev : nextSelected))
    setEditMemberOrder(prev => (arraysEqual(prev, nextOrder) ? prev : nextOrder))
  }, [isEditingMembers, teams, draftTeam, activeTeamId])

  useEffect(() => {
    if (!draftTeam) return
    if (activeTeamId !== draftTeam.id) return
    setIsEditingMembers(true)
    const nextSelected = new Set(draftTeam.members.map(m => m.characterId))
    const nextOrder = draftTeam.members.map(m => m.characterId)
    setEditSelectedCharacters(prev => (setsEqual(prev, nextSelected) ? prev : nextSelected))
    setEditMemberOrder(prev => (arraysEqual(prev, nextOrder) ? prev : nextOrder))
  }, [draftTeam, activeTeamId])

  useEffect(() => {
    if (!draftTeam) return
    if (activeTeamId !== draftTeam.id) return
    const ordered = editMemberOrder.length ? editMemberOrder : Array.from(editSelectedCharacters)
    const members = ordered.map(id => ({
      characterId: id,
      buildIndex: 0,
      enabled: true,
    }))
    const memberNames = members.map(m => {
      const char = findCharacterById(state, m.characterId)
      return resolveCharacterName(state, char ?? m.characterId)
    })
    setDraftTeam(prev => {
      if (!prev) return prev
      if (arraysEqual(prev.members.map(m => m.characterId), ordered)
        && arraysEqual(prev.memberNames, memberNames)) {
        return prev
      }
      return { ...prev, members, memberNames }
    })
  }, [draftTeam, activeTeamId, editSelectedCharacters, editMemberOrder, state])

  const characters = (state?.characters ?? [])
    .filter(Boolean)
    .sort((a, b) => {
      const aName = resolveCharacterName(state, a)
      const bName = resolveCharacterName(state, b)
      return aName.localeCompare(bName)
    })

  const characterMetaMap = useMemo(() => getAllCharacterMeta(), [state])

  const allTeams = draftTeam ? [draftTeam, ...teams] : teams

  const filteredTeams = allTeams.filter(team => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return team.name.toLowerCase().includes(query) ||
           team.memberNames.some(n => n.toLowerCase().includes(query))
  })

  const filteredCharacters = characters.filter(char => {
    const meta = characterMetaMap[char.id]
    if (characterSearch) {
      const name = resolveCharacterName(state, char).toLowerCase()
      if (!name.includes(characterSearch.toLowerCase())) return false
    }
    if (pathFilters.size > 0) {
      const charPath = meta?.path as string | undefined
      if (!charPath || !pathFilters.has(charPath)) return false
    }
    if (elementFilters.size > 0) {
      const charElement = meta?.element as string | undefined
      if (!charElement || !elementFilters.has(charElement)) return false
    }
    return true
  })

  const activeTeam = allTeams.find(t => t.id === activeTeamId) ?? null

  const getEquippedRelicIds = (character: { equipped?: Record<string, string> }) => {
    const equipped = character.equipped ?? {}
    return Object.values(equipped).filter(Boolean)
  }

  const getMemberBuildIndex = (teamId: string, member: { characterId: string; buildIndex?: number }) => {
    const byTeam = memberBuildSelections[teamId]
    if (byTeam && typeof byTeam[member.characterId] === 'number') return byTeam[member.characterId]
    if (typeof member.buildIndex === 'number') return member.buildIndex
    return 0
  }

  const getMemberEnabled = (teamId: string, member: { characterId: string; enabled?: boolean }) => {
    const byTeam = memberEnabledSelections[teamId]
    if (byTeam && typeof byTeam[member.characterId] === 'boolean') return byTeam[member.characterId]
    if (typeof member.enabled === 'boolean') return member.enabled
    return true
  }

  const setMemberBuildIndex = (teamId: string, characterId: string, buildIndex: number) => {
    setMemberBuildSelections(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] ?? {}),
        [characterId]: buildIndex,
      },
    }))
  }

  const setMemberEnabled = (teamId: string, characterId: string, enabled: boolean) => {
    setMemberEnabledSelections(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] ?? {}),
        [characterId]: enabled,
      },
    }))
  }

  const updateTeamMembers = (teamId: string, memberIds: string[]) => {
    const currentTeams = loadSavedTeams()
    const updated = currentTeams.map(t => {
      if (t.id !== teamId) return t
      const existingById = new Map(t.members.map(m => [m.characterId, m]))
      const newMembers = memberIds.map(id => ({
        characterId: id,
        buildIndex: existingById.get(id)?.buildIndex ?? 0,
        enabled: existingById.get(id)?.enabled ?? true,
      }))
      return { ...t, members: newMembers }
    })
    saveTeams(updated)
    refreshState()
  }

  const getTeamConflictInfo = (team: TeamWithNames) => {
    const relicToMembers: Record<string, string[]> = {}

    for (const member of team.members) {
      const character = findCharacterById(state, member.characterId)
      if (!character) continue

      const enabled = getMemberEnabled(team.id, member)
      if (!enabled) continue

      const buildIndex = getMemberBuildIndex(team.id, member)
      const build = character.builds?.[buildIndex]
      const relicIds = getBuildRelicIds(build)
      const finalRelicIds = relicIds.length ? relicIds : getEquippedRelicIds(character)

      for (const relicId of finalRelicIds) {
        if (!relicToMembers[relicId]) relicToMembers[relicId] = []
        relicToMembers[relicId].push(member.characterId)
      }
    }

    const conflicts = Object.entries(relicToMembers)
      .filter(([, members]) => members.length > 1)

    const conflictedMembers = new Set<string>()
    conflicts.forEach(([, members]) => members.forEach(m => conflictedMembers.add(m)))

    const conflictMap = Object.fromEntries(conflicts)

    return {
      conflictCount: conflicts.length,
      conflictedMembers,
      conflictMap,
    }
  }

  const handleTeamSelect = (teamId: string, checked: boolean) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(teamId)
      } else {
        next.delete(teamId)
      }
      return next
    })
  }

  const toggleEditCharacter = (characterId: string) => {
    setEditSelectedCharacters(prev => {
      const next = new Set(prev)
      if (next.has(characterId)) next.delete(characterId)
      else next.add(characterId)
      return next
    })
    setEditMemberOrder(prev => {
      if (prev.includes(characterId)) return prev.filter(id => id !== characterId)
      return [...prev, characterId]
    })
  }

  const moveMember = (characterId: string, direction: 'up' | 'down') => {
    setEditMemberOrder(prev => {
      const index = prev.indexOf(characterId)
      if (index === -1) return prev
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[targetIndex]
      next[targetIndex] = next[index]
      next[index] = temp
      return next
    })
  }

  const handleNewTeamDraft = () => {
    const draftId = `draft_${Date.now()}`
    const name = getNextTeamName()
    const newDraft: TeamWithNames = {
      id: draftId,
      name,
      members: [],
      memberNames: [],
    }
    setDraftTeam(newDraft)
    setActiveTeamId(draftId)
    setIsEditingMembers(true)
    setEditSelectedCharacters(new Set())
    setEditMemberOrder([])
  }

  const handleSaveDraftTeam = () => {
    if (!draftTeam) return
    if (editSelectedCharacters.size === 0) {
      message.warning('Select at least one character')
      return
    }
    const currentTeams = loadSavedTeams()
    const orderedMembers = editMemberOrder.length
      ? editMemberOrder
      : Array.from(editSelectedCharacters)
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: draftTeam.name.trim() || getNextTeamName(),
      members: orderedMembers.map(id => ({ characterId: id, buildIndex: 0, enabled: true })),
    }
    currentTeams.push(newTeam)
    saveTeams(currentTeams)
    setDraftTeam(null)
    setIsEditingMembers(false)
    refreshState()
    message.success(`Team "${newTeam.name}" created`)
  }

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (teamId.startsWith('draft_')) {
      setDraftTeam(null)
      if (activeTeamId === teamId) setActiveTeamId(null)
      return
    }
    if (!confirm(`Delete team "${teamName}"?`)) return
    
    const currentTeams = loadSavedTeams().filter(t => t.id !== teamId)
    saveTeams(currentTeams)
    setSelectedTeamIds(prev => {
      const next = new Set(prev)
      next.delete(teamId)
      return next
    })
    refreshState()
    message.success('Team deleted')
  }

  const handleApplyTeams = async () => {
    if (selectedTeamIds.size === 0) return

    const selectedTeams = allTeams.filter(t => selectedTeamIds.has(t.id) && !t.id.startsWith('draft_'))
    
    for (const team of selectedTeams) {
      const conflictInfo = getTeamConflictInfo(team)
      if (conflictInfo.conflictCount > 0) {
        message.warning(`Team "${team.name}" has relic conflicts (${conflictInfo.conflictCount})`)
      }
      for (const member of team.members) {
        const character = findCharacterById(state, member.characterId)
        if (!character) continue

        const enabled = getMemberEnabled(team.id, member)
        if (!enabled) continue

        const buildIndex = getMemberBuildIndex(team.id, member)
        const build = character.builds?.[buildIndex]
        const relicIds = getBuildRelicIds(build)
        const finalRelicIds = relicIds.length ? relicIds : getEquippedRelicIds(character)
        
        if (finalRelicIds.length === 0) {
          message.warning(`No build or equipped relics found for ${resolveCharacterName(state, character)}`)
          continue
        }

        const loadout = {
          avatar_id: Number(character.id),
          name: `${resolveCharacterName(state, character)} - ${build?.name ?? 'Equipped'}`,
          relic_uids: finalRelicIds.map(Number),
        }

        try {
          await applyLoadout(loadout)
          await new Promise(r => setTimeout(r, LOADOUT_APPLY_DELAY))
        } catch {
          message.error('Extension communication failed')
        }
      }
    }

    message.success(`Applied ${selectedTeamIds.size} team(s)`)
  }

  const activeConflict = activeTeam
    ? getTeamConflictInfo(activeTeam)
    : { conflictCount: 0, conflictedMembers: new Set<string>(), conflictMap: {} as Record<string, string[]> }

  const activeMembers = useMemo(() => {
    if (!activeTeam) return [] as { characterId: string; buildIndex?: number; enabled?: boolean }[]
    const isReordering = isEditingMembers || activeTeam.id.startsWith('draft_')
    if (!isReordering) return activeTeam.members
    const memberMap = new Map(activeTeam.members.map(m => [m.characterId, m]))
    return editMemberOrder
      .map(id => memberMap.get(id))
      .filter((m): m is { characterId: string; buildIndex?: number; enabled?: boolean } => !!m)
  }, [activeTeam, isEditingMembers, editMemberOrder])

  const closeBuildEditor = () => {
    setBuildEditorOpen(false)
    setBuildEditorCharacterId(null)
    setBuildEditorBuildIndex(-1)
    setBuildEditorSlot(undefined)
    setBuildEditorRelicId(undefined)
    refreshState()
  }

  const canEditMembers = !!activeTeam && (isEditingMembers || activeTeam.id.startsWith('draft_'))

  return (
    <>
    <Flex gap={16} align="start">
      <Flex vertical gap={8} style={{ width: 280 }}>
        <Input
          placeholder="Search characters..."
          value={characterSearch}
          onChange={e => setCharacterSearch(e.target.value)}
          allowClear
          style={{ width: '100%' }}
        />

        <Flex gap={2} wrap="wrap" justify="center">
          {PATHS.map(path => (
            <FilterIcon
              key={path}
              src={getPathIconUrl(path)}
              active={pathFilters.has(path)}
              onClick={() => setPathFilters(prev => {
                const next = new Set(prev)
                if (next.has(path)) next.delete(path)
                else next.add(path)
                return next
              })}
              title={path}
            />
          ))}
        </Flex>
        <Flex gap={2} wrap="wrap" justify="center">
          {ELEMENTS.map(element => (
            <FilterIcon
              key={element}
              src={getElementIconUrl(element)}
              active={elementFilters.has(element)}
              onClick={() => setElementFilters(prev => {
                const next = new Set(prev)
                if (next.has(element)) next.delete(element)
                else next.add(element)
                return next
              })}
              title={element}
            />
          ))}
        </Flex>

        <Divider style={{ margin: '4px 0' }} />

        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''}
        </Text>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', marginRight: -4, paddingRight: 4 }}>
          <Flex vertical gap={4}>
            {filteredCharacters.map(char => {
              const isSelected = editSelectedCharacters.has(char.id)
              const meta = characterMetaMap[char.id]
              const charPath = meta?.path as string | undefined
              const charElement = meta?.element as string | undefined
              const buildCount = char.builds?.length ?? 0

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    if (canEditMembers) {
                      toggleEditCharacter(char.id)
                    } else {
                      setActiveCharacterId(char.id)
                    }
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: isSelected ? token.colorPrimaryBg : 'transparent',
                    border: isSelected ? `1px solid ${token.colorPrimaryBorder}` : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Flex align="center" gap={8}>
                    <img
                      src={getCharacterAvatarUrl(char.id)}
                      alt={resolveCharacterName(state, char)}
                      style={{ width: 36, height: 36, borderRadius: '50%' }}
                    />
                    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {resolveCharacterName(state, char)}
                      </Text>
                      <Flex align="center" gap={4}>
                        {charPath && (
                          <img src={getPathIconUrl(charPath)} style={{ width: 14, height: 14 }} alt="" />
                        )}
                        {charElement && (
                          <img src={getElementIconUrl(charElement)} style={{ width: 14, height: 14 }} alt="" />
                        )}
                        {buildCount > 0 && (
                          <Tag
                            style={{
                              margin: 0,
                              fontSize: 10,
                              lineHeight: '16px',
                              padding: '0 4px',
                              background: token.colorFillQuaternary,
                              border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                          >
                            {buildCount}
                          </Tag>
                        )}
                      </Flex>
                    </Flex>
                    {canEditMembers && isSelected && (
                      <Tag color="blue" style={{ margin: 0 }}>Selected</Tag>
                    )}
                  </Flex>
                </div>
              )
            })}
          </Flex>
        </div>
      </Flex>

      <Card
        style={{
          flex: 1,
          borderRadius: 6,
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex vertical gap={12}>
          <Flex vertical gap={8}>
            <Text strong>Teams</Text>
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Flex gap={8} wrap="wrap">
              <Button
                icon={<PlusOutlined />}
                onClick={handleNewTeamDraft}
              >
                New Team
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleApplyTeams}
                disabled={selectedTeamIds.size === 0}
              >
                Apply Selected ({selectedTeamIds.size})
              </Button>
            </Flex>
          </Flex>

          <Flex vertical gap={8}>
            {filteredTeams.length === 0 && teams.length > 0 && (
              <Flex justify="center" style={{ padding: 24 }}>
                <Text style={{ color: token.colorTextSecondary }}>
                  No teams match "{searchQuery}"
                </Text>
              </Flex>
            )}

            {teams.length === 0 && (
              <Flex vertical align="center" style={{ padding: 24 }} gap={10}>
                <TeamOutlined style={{ fontSize: 36, color: token.colorTextTertiary }} />
                <Title level={5} style={{ margin: 0 }}>No Team Loadouts</Title>
                <Text style={{ color: token.colorTextSecondary, textAlign: 'center' }}>
                  Create a team to quickly apply<br />multiple character loadouts at once
                </Text>
              </Flex>
            )}

            {filteredTeams.map(team => {
              const isSelected = selectedTeamIds.has(team.id)
              const isActive = activeTeamId === team.id
              const isDraft = team.id.startsWith('draft_')
              return (
                <div
                  key={team.id}
                  onClick={() => setActiveTeamId(team.id)}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    background: isActive ? token.colorPrimaryBg : token.colorBgContainer,
                    border: isActive ? `1px solid ${token.colorPrimaryBorder}` : `1px solid ${token.colorBorderSecondary}`,
                    cursor: 'pointer',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                    <Flex align="center" gap={8}>
                      <Checkbox
                        checked={isSelected}
                        disabled={isDraft}
                        onChange={e => { e.stopPropagation(); handleTeamSelect(team.id, e.target.checked) }}
                      />
                      <Text strong>{team.name}</Text>
                      {isDraft && (
                        <Tag style={{ margin: 0 }} color="warning">Draft</Tag>
                      )}
                    </Flex>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={e => { e.stopPropagation(); handleDeleteTeam(team.id, team.name) }}
                    />
                  </Flex>
                  <Flex wrap="wrap" gap={6}>
                    {team.members.map((member, i) => {
                      const character = findCharacterById(state, member.characterId)
                      const avatar = getCharacterAvatarUrl(member.characterId)
                      const name = resolveCharacterName(state, character ?? member.characterId)
                      const isEnabled = getMemberEnabled(team.id, member)
                      return (
                        <img
                          key={`${member.characterId}-${i}`}
                          src={avatar}
                          title={name}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: isEnabled ? `2px solid ${token.colorPrimary}` : `2px solid ${token.colorBorderSecondary}`,
                            background: token.colorFillQuaternary,
                            opacity: isEnabled ? 1 : 0.5,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setMemberEnabled(team.id, member.characterId, !isEnabled)
                          }}
                        />
                      )
                    })}
                  </Flex>
                </div>
              )
            })}
          </Flex>

          <Divider style={{ margin: '4px 0' }} />

          {!activeTeam && (
            <Flex vertical align="center" justify="center" style={{ height: 240 }} gap={8}>
              <Text style={{ color: token.colorTextSecondary }}>Select a team to view details</Text>
            </Flex>
          )}

          {activeTeam && (
            <Flex vertical gap={12}>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={8}>
                <Title level={4} style={{ margin: 0 }}>{activeTeam.name}</Title>
                {activeConflict.conflictCount > 0 && (
                  <Tag color="error">Conflicts: {activeConflict.conflictCount}</Tag>
                )}
              </Flex>
              <Flex gap={8}>
                {!activeTeam.id.startsWith('draft_') && (
                  <Button
                    onClick={() => setIsEditingMembers((x) => !x)}
                  >
                    {isEditingMembers ? 'Done' : 'Edit Members'}
                  </Button>
                )}
              </Flex>
            </Flex>

            {activeConflict.conflictCount > 0 && (
              <Text style={{ color: token.colorError }}>
                Some selected builds share the same relics, toggle or change builds to resolve conflicts
              </Text>
            )}

            <Divider style={{ margin: '4px 0' }} />

            {(isEditingMembers || activeTeam.id.startsWith('draft_')) && (
              <Card
                style={{
                  borderRadius: 6,
                  background: token.colorFillQuaternary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                {activeTeam.id.startsWith('draft_') && (
                  <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
                    <Input
                      placeholder="Team name"
                      value={draftTeam?.name ?? ''}
                      onChange={e => setDraftTeam(prev => prev ? { ...prev, name: e.target.value } : prev)}
                      style={{ width: 220 }}
                    />
                    <Button
                      type="primary"
                      onClick={handleSaveDraftTeam}
                      disabled={editSelectedCharacters.size === 0}
                    >
                      Save Team
                    </Button>
                  </Flex>
                )}
                <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
                  <Input
                    placeholder="Search characters..."
                    value={characterSearch}
                    onChange={e => setCharacterSearch(e.target.value)}
                  />
                  <Button
                    type="primary"
                    onClick={() => updateTeamMembers(activeTeam.id, editMemberOrder.length ? editMemberOrder : Array.from(editSelectedCharacters))}
                    disabled={editSelectedCharacters.size === 0 || activeTeam.id.startsWith('draft_')}
                  >
                    Save Members
                  </Button>
                </Flex>
                <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                  Use the character selector on the left to add or remove members
                </Text>
              </Card>
            )}

            <Flex vertical gap={10}>
              {activeMembers.map((member, memberIndex) => {
                const character = findCharacterById(state, member.characterId)
                if (!character) return null

                const enabled = getMemberEnabled(activeTeam.id, member)
                const buildIndex = getMemberBuildIndex(activeTeam.id, member)
                const builds = character.builds ?? []
                const avatar = getCharacterAvatarUrl(member.characterId)
                const charName = resolveCharacterName(state, character)
                const isConflicted = activeConflict.conflictedMembers.has(member.characterId)

                const build = builds[buildIndex]
                const relicIds = getBuildRelicIds(build)
                const finalRelicIds = relicIds.length ? relicIds : getEquippedRelicIds(character)
                const relics = sortRelicsBySlot(finalRelicIds.map(id => getRelicById(id)).filter((r): r is Relic => r != null))
                const isActiveChar = activeCharacterId === member.characterId
                const setCounts: Record<string, number> = {}
                relics.forEach(r => {
                  if (!r?.set) return
                  setCounts[r.set] = (setCounts[r.set] ?? 0) + 1
                })
                const setSummary = Object.entries(setCounts)
                  .filter(([, count]) => count >= 2)
                  .map(([set, count]) => `${count}pc ${set}`)
                  .join(' · ')
                const conflictOthers = new Set<string>()
                Object.entries(activeConflict.conflictMap).forEach(([, members]) => {
                  if (members.includes(member.characterId)) {
                    members.forEach(m => {
                      if (m !== member.characterId) conflictOthers.add(m)
                    })
                  }
                })

                return (
                  <Flex
                    key={member.characterId}
                    align="center"
                    justify="space-between"
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      background: isActiveChar ? token.colorPrimaryBg : token.colorFillQuaternary,
                      border: isActiveChar ? `1px solid ${token.colorPrimaryBorder}` : `1px solid ${token.colorBorderSecondary}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveCharacterId(member.characterId)}
                  >
                    <Flex align="center" gap={10} style={{ flex: 1 }}>
                      <Checkbox
                        checked={enabled}
                        onChange={e => setMemberEnabled(activeTeam.id, member.characterId, e.target.checked)}
                      />
                      <img
                        src={avatar}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${token.colorBorderSecondary}` }}
                      />
                      <Flex vertical>
                        <Flex align="center" gap={6}>
                          <Text strong>{charName}</Text>
                          {isConflicted && (
                            <Tooltip
                              title={
                                `Also equipped by: ${Array.from(conflictOthers)
                                  .map(id => resolveCharacterName(state, findCharacterById(state, id) ?? id))
                                  .join(', ')}`
                              }
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: token.colorError,
                                  display: 'inline-block',
                                }}
                              />
                            </Tooltip>
                          )}
                        </Flex>
                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                          {finalRelicIds.length} relics · {build?.name ?? 'Equipped'}
                        </Text>
                        {setSummary && (
                          <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                            {setSummary}
                          </Text>
                        )}
                        <Flex align="center" gap={4} style={{ marginTop: 4 }}>
                          {relics.map((relic, idx) => {
                            const relicId = getRelicUid(relic) ?? ''
                            const conflictMembers = activeConflict.conflictMap[relicId]
                            const isRelicConflicted = conflictMembers?.length > 1
                            return (
                              <Tooltip
                                key={`${member.characterId}-icon-${idx}`}
                                title={
                                  <div style={{ maxWidth: 220 }}>
                                    <RelicCard relic={relic} compact />
                                    <Text style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                                      {relic?.set ?? 'Unknown set'}
                                    </Text>
                                    {isRelicConflicted && (
                                      <Text style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                        Also equipped by: {conflictMembers
                                          .filter(id => id !== member.characterId)
                                          .map(id => resolveCharacterName(state, findCharacterById(state, id) ?? id))
                                          .join(', ')}
                                      </Text>
                                    )}
                                  </div>
                                }
                              >
                                <span style={{ position: 'relative', display: 'inline-block' }}>
                                  <img
                                    src={getRelicImageUrl(relic)}
                                    style={{ width: 20, height: 20, borderRadius: 3, border: `1px solid ${token.colorBorderSecondary}`, cursor: 'pointer' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const slot = getSlotIndex(relic.part)
                                      setBuildEditorCharacterId(member.characterId)
                                      setBuildEditorBuildIndex(builds.length ? buildIndex : -1)
                                      setBuildEditorSlot(slot >= 0 ? slot : undefined)
                                      setBuildEditorRelicId(getRelicUid(relic))
                                      setBuildEditorOpen(true)
                                    }}
                                  />
                                  {isRelicConflicted && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: token.colorError,
                                        border: `1px solid ${token.colorBgContainer}`,
                                      }}
                                    />
                                  )}
                                </span>
                              </Tooltip>
                            )
                          })}
                        </Flex>
                      </Flex>
                      {isConflicted && <Tag color="error">Conflict</Tag>}
                    </Flex>

                    <Flex align="center" gap={8}>
                      <Select
                        size="small"
                        value={builds.length ? buildIndex : -1}
                        style={{ width: 220 }}
                        options={builds.length
                          ? builds.map((b, i) => ({
                            label: b.name ? b.name : `Build ${i + 1}`,
                            value: i,
                          }))
                          : [{ label: 'Equipped', value: -1 }]}
                        onChange={(value) => setMemberBuildIndex(activeTeam.id, member.characterId, value)}
                      />
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          setBuildEditorCharacterId(member.characterId)
                          setBuildEditorBuildIndex(builds.length ? buildIndex : -1)
                          setBuildEditorSlot(undefined)
                          setBuildEditorRelicId(undefined)
                          setBuildEditorOpen(true)
                        }}
                      >
                        Edit Build
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenCharacterBuilds?.(member.characterId)
                        }}
                      >
                        View Builds
                      </Button>
                      {(isEditingMembers || activeTeam.id.startsWith('draft_')) && (
                        <>
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={memberIndex === 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              moveMember(member.characterId, 'up')
                            }}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={memberIndex === activeMembers.length - 1}
                            onClick={(e) => {
                              e.stopPropagation()
                              moveMember(member.characterId, 'down')
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleEditCharacter(member.characterId)
                            }}
                          />
                        </>
                      )}
                    </Flex>
                  </Flex>
                )
              })}

              <Divider style={{ margin: '4px 0' }} />

              <Flex vertical gap={8}>
                {activeCharacterId && (() => {
                  const member = activeTeam.members.find(m => m.characterId === activeCharacterId)
                  if (!member) return null
                  const character = findCharacterById(state, member.characterId)
                  if (!character) return null
                  const buildIndex = getMemberBuildIndex(activeTeam.id, member)
                  const builds = character.builds ?? []
                  const build = builds[buildIndex]
                  const relicIds = getBuildRelicIds(build)
                  const finalRelicIds = relicIds.length ? relicIds : getEquippedRelicIds(character)
                  const relics = sortRelicsBySlot(finalRelicIds.map(id => getRelicById(id)).filter((r): r is Relic => r != null))
                  const relicsBySlot = new Map<number, Relic>()
                  relics.forEach(relic => {
                    const slot = getSlotIndex(relic.part)
                    if (slot >= 0) relicsBySlot.set(slot, relic)
                  })

                  return (
                    <Flex key={`${member.characterId}-relics`} vertical gap={6}>
                      <Text strong>{resolveCharacterName(state, character)} Relics</Text>
                      <Flex wrap="wrap" gap={8}>
                        {SLOT_ORDER.map((slot, index) => {
                          const relic = relicsBySlot.get(index)
                          if (relic) {
                            return (
                              <RelicCard
                                key={`${member.characterId}-${index}`}
                                relic={relic}
                                compact
                                onSelect={() => {
                                  const slotIndex = getSlotIndex(relic.part)
                                  setBuildEditorCharacterId(member.characterId)
                                  setBuildEditorBuildIndex(builds.length ? buildIndex : -1)
                                  setBuildEditorSlot(slotIndex >= 0 ? slotIndex : undefined)
                                  setBuildEditorRelicId(getRelicUid(relic))
                                  setBuildEditorOpen(true)
                                }}
                              />
                            )
                          }

                          return (
                            <div
                              key={`${member.characterId}-empty-${slot}`}
                              style={{
                                width: 160,
                                minWidth: 160,
                                height: 220,
                                border: `1px dashed ${token.colorBorderSecondary}`,
                                borderRadius: token.borderRadius,
                                background: token.colorFillQuaternary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: token.colorTextTertiary,
                              }}
                            >
                              <img src={getBlankUrl()} alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                            </div>
                          )
                        })}
                      </Flex>
                    </Flex>
                  )
                })()}
              </Flex>
            </Flex>
          </Flex>
          )}
        </Flex>
      </Card>
    </Flex>

    {buildEditorCharacterId && (
      <BuildEditor
        open={buildEditorOpen}
        onClose={closeBuildEditor}
        characterId={buildEditorCharacterId}
        buildIndex={buildEditorBuildIndex}
        initialSlot={buildEditorSlot}
        initialRelicId={buildEditorRelicId}
      />
    )}
    </>
  )
}
