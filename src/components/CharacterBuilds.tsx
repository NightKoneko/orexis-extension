import { useState, useEffect, useCallback, useMemo } from 'react'
import { Flex, Button, Input, Typography, Tag, message, theme, Divider, Empty, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import type { Character, Build, Relic, OptimizerState } from '../types'
import { getBuildRelicIds } from '../types'
import {
  getOptimizerState,
  resolveCharacterName,
  getCharacterAvatarUrl,
  getRelicById,
  getAllCharacterMeta,
  getPathIconUrl,
  getElementIconUrl,
  getBlankUrl,
} from '../site-api'
import { applyLoadout } from '../utils/bridge'
import { sortRelicsBySlot, getSlotIndex, getRelicUid } from '../utils/relics'
import { SLOT_ORDER } from '../constants'
import { BuildEditor } from './BuildEditor'
import { RelicCard } from './RelicCard'

const { Text } = Typography

const PATHS = ['Abundance', 'Destruction', 'Erudition', 'Harmony', 'Hunt', 'Nihility', 'Preservation', 'Remembrance'] as const
const ELEMENTS = ['Physical', 'Fire', 'Ice', 'Lightning', 'Wind', 'Quantum', 'Imaginary'] as const

const cardShadow = 'rgba(0,0,0,0.25) 0px 0.0625em 0.0625em, rgba(0,0,0,0.25) 0px 0.125em 0.5em, rgba(255,255,255,0.15) 0px 0px 0px 1px inset'

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

interface CharacterBuildsProps {
  externalSelectedCharacterId?: string | null
  onSelectCharacterId?: (characterId: string) => void
}

export function CharacterBuilds({ externalSelectedCharacterId, onSelectCharacterId }: CharacterBuildsProps) {
  const { token } = theme.useToken()
  const [state, setState] = useState<OptimizerState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [pathFilters, setPathFilters] = useState<Set<string>>(new Set())
  const [elementFilters, setElementFilters] = useState<Set<string>>(new Set())
  const [buildEditorOpen, setBuildEditorOpen] = useState(false)
  const [editingBuildIndex, setEditingBuildIndex] = useState(-1)
  const [buildEditorSlot, setBuildEditorSlot] = useState<number | undefined>(undefined)
  const [buildEditorRelicId, setBuildEditorRelicId] = useState<string | undefined>(undefined)
    useEffect(() => {
      if (externalSelectedCharacterId) {
        setSelectedCharacterId(externalSelectedCharacterId)
      }
    }, [externalSelectedCharacterId])

  const [buildSearch, setBuildSearch] = useState('')
  const [buildSetFilter, setBuildSetFilter] = useState<string | null>(null)
  const [collapsedBuilds, setCollapsedBuilds] = useState<Set<number>>(new Set())

  const refreshState = useCallback(() => {
    setState(getOptimizerState())
  }, [])

  useEffect(() => {
    refreshState()
  }, [refreshState])

  const characterMetaMap = useMemo(() => getAllCharacterMeta(), [state])

  const characters = useMemo(() => {
    return (state?.characters ?? [])
      .filter(Boolean)
      .sort((a, b) => {
        const aName = resolveCharacterName(state, a)
        const bName = resolveCharacterName(state, b)
        return aName.localeCompare(bName)
      })
  }, [state])

  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      const meta = characterMetaMap[char.id]
      if (searchQuery) {
        const name = resolveCharacterName(state, char).toLowerCase()
        if (!name.includes(searchQuery.toLowerCase())) return false
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
  }, [characters, searchQuery, pathFilters, elementFilters, characterMetaMap, state])

  useEffect(() => {
    if (!selectedCharacterId && filteredCharacters.length > 0) {
      setSelectedCharacterId(filteredCharacters[0].id)
      onSelectCharacterId?.(filteredCharacters[0].id)
    }
  }, [filteredCharacters, selectedCharacterId])

  const selectedCharacter = useMemo(() => {
    return state?.characters?.find(c => c.id === selectedCharacterId) ?? null
  }, [state, selectedCharacterId])

  const togglePathFilter = (path: string) => {
    setPathFilters(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const toggleElementFilter = (element: string) => {
    setElementFilters(prev => {
      const next = new Set(prev)
      if (next.has(element)) next.delete(element)
      else next.add(element)
      return next
    })
  }

  const openBuildEditor = (buildIndex: number = -1, slot?: number, relicId?: string) => {
    if (!selectedCharacterId) return
    setEditingBuildIndex(buildIndex)
    setBuildEditorSlot(slot)
    setBuildEditorRelicId(relicId)
    setBuildEditorOpen(true)
  }
  const handleCopyEquipped = (character: Character) => {
    try {
      const relicIds = SLOT_ORDER.map(slot => character.equipped?.[slot]).filter(Boolean) as string[]
      if (relicIds.length === 0) {
        message.warning('No equipped relics to copy')
        return
      }
      const newBuildNameBase = 'Equipped Copy'
      const existingNames = new Set((character.builds ?? []).map(b => b.name))
      let name = newBuildNameBase
      let i = 2
      while (existingNames.has(name)) {
        name = `${newBuildNameBase} ${i}`
        i += 1
      }

      const newBuild: Build = {
        name,
        build: relicIds,
        relicIds,
      }

      const db = window.DB
      if (db?.setCharacter) {
        const dbChar = db.getCharacterById?.(character.id)
        if (dbChar) {
          db.setCharacter({ ...dbChar, builds: [...(dbChar.builds ?? []), newBuild] })
          window.SaveState?.save()
          refreshState()
          message.success(`Created build "${name}"`)
          return
        }
      }

      const raw = localStorage.getItem('state')
      if (!raw) return
      const newState = JSON.parse(raw) as OptimizerState
      const targetChar = newState.characters?.find(c => c.id === character.id)
      if (!targetChar) return
      targetChar.builds = [...(targetChar.builds ?? []), newBuild]
      localStorage.setItem('state', JSON.stringify(newState))
      refreshState()
      message.success(`Created build "${name}"`)
    } catch {
      message.error('Failed to copy equipped build')
    }
  }

  const renderRelicSlots = (
    relics: Relic[],
    onRelicClick: (relic: Relic) => void,
  ) => {
    const bySlot = new Map<number, Relic>()
    relics.forEach(relic => {
      const slot = getSlotIndex(relic.part)
      if (slot >= 0) bySlot.set(slot, relic)
    })
    return SLOT_ORDER.map((_, index) => {
      const relic = bySlot.get(index)
      if (relic) {
        return (
          <RelicCard
            key={`slot-${index}-${getRelicUid(relic)}`}
            relic={relic}
            compact
            onClick={() => onRelicClick(relic)}
          />
        )
      }

      return (
        <div
          key={`slot-${index}-empty`}
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
    })
  }

  const closeBuildEditor = () => {
    setBuildEditorOpen(false)
    setEditingBuildIndex(-1)
    setBuildEditorSlot(undefined)
    setBuildEditorRelicId(undefined)
    refreshState()
  }

  const handleEquip = async (character: Character, build: Build, buildIndex: number) => {
    const relicIds = getBuildRelicIds(build)
    if (!relicIds.length) {
      message.error('No relic IDs found for this build')
      return
    }

    const loadout = {
      avatar_id: Number(character.id),
      name: `${resolveCharacterName(state, character)} - ${build.name || `Build ${buildIndex + 1}`}`,
      relic_uids: relicIds.map(Number),
    }

    try {
      const response = await applyLoadout(loadout)
      if (response?.ok) {
        message.success('Loadout equipped successfully')
      } else {
        message.error(response?.error || 'Failed to equip loadout')
      }
    } catch {
      message.error('Extension communication failed')
    }
  }

  const handleDeleteBuild = (character: Character, buildIndex: number) => {
    try {
      const db = window.DB
      if (db?.deleteCharacterBuild && character.builds?.[buildIndex]) {
        const buildName = character.builds[buildIndex].name
        db.deleteCharacterBuild(character.id, buildName)
        window.SaveState?.save()
        refreshState()
        message.success('Build deleted')
        return
      }

      const raw = localStorage.getItem('state')
      if (!raw) return
      const newState = JSON.parse(raw) as OptimizerState
      const targetChar = newState.characters?.find(c => c.id === character.id)
      if (!targetChar?.builds) return
      targetChar.builds.splice(buildIndex, 1)
      localStorage.setItem('state', JSON.stringify(newState))
      refreshState()
      message.success('Build deleted')
    } catch {
      message.error('Failed to delete build')
    }
  }

  const getCharacterRelics = (character: Character, build?: Build | null): Relic[] => {
    const relicIds = build ? getBuildRelicIds(build) : []
    const finalIds = relicIds.length > 0 ? relicIds : Object.values(character.equipped ?? {}).filter(Boolean)
    return sortRelicsBySlot(
      finalIds.map(id => getRelicById(id)).filter((r): r is Relic => r != null)
    )
  }

  const selectedCharName = selectedCharacter ? resolveCharacterName(state, selectedCharacter) : ''
  const builds = selectedCharacter?.builds ?? []

  const buildMeta = useMemo(() => {
    return builds.map((build) => {
      const relicIds = getBuildRelicIds(build)
      const relics = sortRelicsBySlot(
        relicIds.map(id => getRelicById(id)).filter((r): r is Relic => r != null)
      )
      const setNames = Array.from(new Set(relics.map(r => r.set).filter(Boolean) as string[]))
      return { relicIds, relics, setNames }
    })
  }, [builds])

  const buildSetOptions = useMemo(() => {
    const sets = new Set<string>()
    buildMeta.forEach(meta => meta.setNames.forEach(s => sets.add(s)))
    return Array.from(sets).sort().map(s => ({ label: s, value: s }))
  }, [buildMeta])

  const filteredBuildIndexes = useMemo(() => {
    return builds
      .map((build, index) => ({ build, index }))
      .filter(({ build, index }) => {
        if (buildSearch) {
          const name = (build.name || `Build ${index + 1}`).toLowerCase()
          if (!name.includes(buildSearch.toLowerCase())) return false
        }
        if (buildSetFilter) {
          if (!buildMeta[index]?.setNames.includes(buildSetFilter)) return false
        }
        return true
      })
      .map(({ index }) => index)
  }, [builds, buildSearch, buildSetFilter, buildMeta])

  const toggleBuildCollapsed = (index: number) => {
    setCollapsedBuilds(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <>
      <Flex gap={16} align="start">
        <Flex vertical gap={8} style={{ width: 280 }}>
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: '100%' }}
          />

          <Flex gap={2} wrap="wrap" justify="center">
            {PATHS.map(path => (
              <FilterIcon
                key={path}
                src={getPathIconUrl(path)}
                active={pathFilters.has(path)}
                onClick={() => togglePathFilter(path)}
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
                onClick={() => toggleElementFilter(element)}
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
              {filteredCharacters.map(character => {
                const charName = resolveCharacterName(state, character)
                const meta = characterMetaMap[character.id]
                const charPath = meta?.path as string | undefined
                const charElement = meta?.element as string | undefined
                const isSelected = character.id === selectedCharacterId
                const buildCount = character.builds?.length ?? 0

                return (
                  <div
                    key={character.id}
                    onClick={() => {
                      setSelectedCharacterId(character.id)
                      onSelectCharacterId?.(character.id)
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
                        src={getCharacterAvatarUrl(character.id)}
                        alt={charName}
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
                          {charName}
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
                              {buildCount} build{buildCount !== 1 ? 's' : ''}
                            </Tag>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                  </div>
                )
              })}
            </Flex>
          </div>
        </Flex>

        <div
          style={{
            flex: 1,
            borderRadius: 6,
            background: token.colorBgContainer,
            boxShadow: cardShadow,
            padding: 16,
          }}
        >
          {!selectedCharacter && (
            <Flex justify="center" align="center" style={{ height: '100%' }}>
              <Empty description="Select a character" />
            </Flex>
          )}

          {selectedCharacter && (
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={12}>
                  <img
                    src={getCharacterAvatarUrl(selectedCharacter.id)}
                    alt={selectedCharName}
                    style={{ width: 48, height: 48, borderRadius: '50%' }}
                  />
                  <div>
                    <Text strong style={{ fontSize: 18 }}>{selectedCharName}</Text>
                    <br />
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      {builds.length} build{builds.length !== 1 ? 's' : ''}
                    </Text>
                  </div>
                </Flex>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openBuildEditor(-1)}
                >
                  New Build
                </Button>
              </Flex>

              <Divider style={{ margin: '4px 0' }} />

              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 14 }}>
                    Currently Equipped
                  </Text>
                  <Flex gap={8}>
                    <Button size="small" onClick={() => openBuildEditor(-1)}>
                      Edit Equipped
                    </Button>
                    <Button size="small" onClick={() => handleCopyEquipped(selectedCharacter)}>
                      Copy Equipped
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => {
                        const equippedIds = SLOT_ORDER.map(slot => selectedCharacter.equipped?.[slot]).filter(Boolean) as string[]
                        if (!equippedIds.length) {
                          message.warning('No equipped relics to send')
                          return
                        }
                        handleEquip(selectedCharacter, { name: 'Equipped', relicIds: equippedIds }, -1)
                      }}
                    >
                      Equip
                    </Button>
                  </Flex>
                </Flex>
                <Flex wrap="wrap" gap={8}>
                  {renderRelicSlots(
                    getCharacterRelics(selectedCharacter),
                    (relic) => {
                      const slot = getSlotIndex(relic.part)
                      openBuildEditor(-1, slot >= 0 ? slot : undefined, getRelicUid(relic))
                    },
                  )}
                </Flex>
              </div>

              {builds.length > 0 && (
                <>
                  <Divider style={{ margin: '4px 0' }} />
                  <Flex justify="space-between" align="center">
                    <Text strong style={{ fontSize: 14 }}>Saved Builds</Text>
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      {filteredBuildIndexes.length} / {builds.length}
                    </Text>
                  </Flex>
                  <Flex gap={8} align="center" wrap="wrap" style={{ marginTop: 8 }}>
                    <Input
                      placeholder="Search builds..."
                      value={buildSearch}
                      onChange={e => setBuildSearch(e.target.value)}
                      allowClear
                      style={{ width: 200 }}
                    />
                    <Select
                      placeholder="Filter by set"
                      allowClear
                      value={buildSetFilter ?? undefined}
                      options={buildSetOptions}
                      onChange={value => setBuildSetFilter(value ?? null)}
                      style={{ width: 220 }}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Flex>
                </>
              )}

              {filteredBuildIndexes.map((index) => {
                const build = builds[index]
                const { relicIds, relics } = buildMeta[index]
                const isCollapsed = collapsedBuilds.has(index)

                return (
                  <div
                    key={index}
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      background: token.colorFillQuaternary,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <Flex align="center" gap={8}>
                        <Button
                          type="text"
                          size="small"
                          icon={isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
                          onClick={() => toggleBuildCollapsed(index)}
                        />
                        <Text strong style={{ fontSize: 14 }}>
                          {build.name || `Build ${index + 1}`}
                        </Text>
                        <Tag
                          style={{
                            margin: 0,
                            background: token.colorFillQuaternary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                          }}
                        >
                          {relicIds.length} relic{relicIds.length !== 1 ? 's' : ''}
                        </Tag>
                        {build.score && (
                          <Tag color="blue" style={{ margin: 0 }}>
                            {build.score.rating} {build.score.score}
                          </Tag>
                        )}
                      </Flex>
                      <Flex gap={6}>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openBuildEditor(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={() => handleEquip(selectedCharacter, build, index)}
                        >
                          Equip
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteBuild(selectedCharacter, index)}
                        />
                      </Flex>
                    </Flex>

                    {!isCollapsed && (
                      <Flex wrap="wrap" gap={8}>
                        {renderRelicSlots(
                          relics,
                          (relic) => {
                            const slot = getSlotIndex(relic.part)
                            openBuildEditor(index, slot >= 0 ? slot : undefined, getRelicUid(relic))
                          },
                        )}
                      </Flex>
                    )}
                  </div>
                )
              })}

              {builds.length === 0 && (
                <Flex
                  justify="center"
                  align="center"
                  style={{
                    padding: 32,
                    borderRadius: 6,
                    background: token.colorFillQuaternary,
                    border: `1px dashed ${token.colorBorderSecondary}`,
                  }}
                >
                  <Text style={{ color: token.colorTextTertiary, fontSize: 13 }}>
                    No saved builds, click "New Build" to create one
                  </Text>
                </Flex>
              )}
            </Flex>
          )}
        </div>
      </Flex>

      {selectedCharacterId && (
        <BuildEditor
          open={buildEditorOpen}
          onClose={closeBuildEditor}
          characterId={selectedCharacterId}
          buildIndex={editingBuildIndex}
          initialSlot={buildEditorSlot}
          initialRelicId={buildEditorRelicId}
        />
      )}
    </>
  )
}
