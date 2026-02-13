import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { Modal, Input, Flex, Typography, Button, Select, message, theme } from 'antd'
import { RelicCard } from './RelicCard'
import type { Relic, Build, OptimizerState, Character } from '../types'
import { getBuildRelicIds } from '../types'
import { RELIC_CARD_HEIGHT, RELIC_CARD_WIDTH, SLOT_DISPLAY_NAMES, SLOT_ORDER } from '../constants'
import {
  getOptimizerState,
  resolveCharacterName,
  getBlankUrl,
} from '../site-api'
import { groupRelicsBySlot, getRelicUid, getRelicImageUrl } from '../utils/relics'

const { Text } = Typography

interface BuildEditorProps {
  open: boolean
  onClose: () => void
  characterId: string
  buildIndex?: number // -1
  initialSlot?: number
  initialRelicId?: string
}

export function BuildEditor({ open, onClose, characterId, buildIndex = -1, initialSlot, initialRelicId }: BuildEditorProps) {
  const { token } = theme.useToken()
  const [state, setState] = useState<OptimizerState | null>(null)
  const [buildName, setBuildName] = useState('New Build')
  const [selectedRelicIds, setSelectedRelicIds] = useState<(string | null)[]>([null, null, null, null, null, null])
  const [activeSlot, setActiveSlot] = useState(0)
  const [relicsBySlot, setRelicsBySlot] = useState<Relic[][]>([[], [], [], [], [], []])

  const [relicSearch, setRelicSearch] = useState('')
  const [setFilter, setSetFilter] = useState<string | null>(null)
  const [equippedFilter, setEquippedFilter] = useState<'all' | 'unequipped' | 'equipped'>('all')
  const [mainStatFilter, setMainStatFilter] = useState<string | null>(null)
  const [substatFilters, setSubstatFilters] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<'enhance-desc' | 'enhance-asc' | 'main-desc' | 'main-asc' | 'grade-desc'>('enhance-desc')
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })
  const [gridScrollTop, setGridScrollTop] = useState(0)

  const getEquippedRelicIds = useCallback((characterData: Character | undefined) => {
    if (!characterData?.equipped) return [null, null, null, null, null, null] as (string | null)[]
    return SLOT_ORDER.map(slot => characterData.equipped?.[slot] ?? null)
  }, [])

  useEffect(() => {
    if (open) {
      const optimizerState = getOptimizerState()
      setState(optimizerState)

      if (optimizerState?.relics) {
        setRelicsBySlot(groupRelicsBySlot(optimizerState.relics))
      }

      const character = optimizerState?.characters?.find(c => c.id === characterId)
      const slotToOpen = typeof initialSlot === 'number' ? initialSlot : 0
      let nextSelected: (string | null)[] = [null, null, null, null, null, null]

      if (buildIndex >= 0 && character?.builds && buildIndex < character.builds.length) {
        const build = character.builds[buildIndex]
        setBuildName(build.name || 'Build')
        const ids = getBuildRelicIds(build)
        nextSelected = ids.length >= 6 ? ids.slice(0, 6) : [...ids, ...Array(6 - ids.length).fill(null)]
      } else if (character) {
        setBuildName('Equipped')
        nextSelected = getEquippedRelicIds(character)
      } else {
        setBuildName('New Build')
      }

      if (initialRelicId && slotToOpen >= 0 && slotToOpen < nextSelected.length) {
        nextSelected[slotToOpen] = initialRelicId
      }

      setSelectedRelicIds(nextSelected)
      setActiveSlot(slotToOpen)
      setRelicSearch('')
      setSetFilter(null)
      setEquippedFilter('all')
      setMainStatFilter(null)
      setSubstatFilters([])
      setSortOption('enhance-desc')
    }
  }, [open, characterId, buildIndex, initialSlot, initialRelicId, getEquippedRelicIds])

  const character = state?.characters?.find(c => c.id === characterId)
  const characterName = resolveCharacterName(state, character ?? characterId)

  const relicMap = useMemo(() => {
    const map = new Map<string, Relic>()
    state?.relics?.forEach(r => {
      const uid = getRelicUid(r)
      if (uid) map.set(uid, r)
    })
    return map
  }, [state])

  const setOptions = useMemo(() => {
    const sets = new Set<string>()
    const slotRelics = relicsBySlot[activeSlot] ?? []
    slotRelics.forEach(r => {
      if (r.set) sets.add(r.set)
    })
    return Array.from(sets).sort().map(s => ({ label: s, value: s }))
  }, [relicsBySlot, activeSlot])

  const mainStatOptions = useMemo(() => {
    const stats = new Set<string>()
    const slotRelics = relicsBySlot[activeSlot] ?? []
    slotRelics.forEach(r => {
      if (r.main?.stat) stats.add(r.main.stat)
    })
    return Array.from(stats).sort().map(s => ({ label: s, value: s }))
  }, [relicsBySlot, activeSlot])

  const substatOptions = useMemo(() => {
    const stats = new Set<string>()
    const slotRelics = relicsBySlot[activeSlot] ?? []
    slotRelics.forEach(r => {
      r.substats?.forEach(s => {
        if (s?.stat) stats.add(s.stat)
      })
    })
    return Array.from(stats).sort().map(s => ({ label: s, value: s }))
  }, [relicsBySlot, activeSlot])

  const charNameMap = useMemo(() => {
    const map = new Map<string, string>()
    state?.characters?.forEach(c => {
      map.set(c.id, resolveCharacterName(state, c))
    })
    return map
  }, [state])

  const filteredRelics = useMemo(() => {
    let relics = relicsBySlot[activeSlot] ?? []

    if (relicSearch) {
      const query = relicSearch.toLowerCase()
      relics = relics.filter(r => {
        if (r.set?.toLowerCase().includes(query)) return true
        if (r.main?.stat?.toLowerCase().includes(query)) return true
        if (r.substats?.some(s => s.stat?.toLowerCase().includes(query))) return true
        if (r.equippedBy) {
          const name = charNameMap.get(r.equippedBy)?.toLowerCase() ?? ''
          if (name.includes(query)) return true
        }
        return false
      })
    }

    if (setFilter) {
      relics = relics.filter(r => r.set === setFilter)
    }

    if (equippedFilter === 'unequipped') {
      relics = relics.filter(r => !r.equippedBy)
    } else if (equippedFilter === 'equipped') {
      relics = relics.filter(r => !!r.equippedBy)
    }

    if (mainStatFilter) {
      relics = relics.filter(r => r.main?.stat === mainStatFilter)
    }

    if (substatFilters.length > 0) {
      relics = relics.filter(r => {
        const stats = new Set((r.substats ?? []).map(s => s.stat))
        return substatFilters.every(s => stats.has(s))
      })
    }

    const sorted = [...relics]
    if (sortOption === 'enhance-asc') {
      sorted.sort((a, b) => (a.enhance ?? 0) - (b.enhance ?? 0))
    } else if (sortOption === 'main-desc') {
      sorted.sort((a, b) => (b.main?.value ?? 0) - (a.main?.value ?? 0))
    } else if (sortOption === 'main-asc') {
      sorted.sort((a, b) => (a.main?.value ?? 0) - (b.main?.value ?? 0))
    } else if (sortOption === 'grade-desc') {
      sorted.sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0))
    } else {
      sorted.sort((a, b) => (b.enhance ?? 0) - (a.enhance ?? 0))
    }

    return sorted
  }, [relicsBySlot, activeSlot, relicSearch, setFilter, equippedFilter, charNameMap, mainStatFilter, substatFilters, sortOption])

  const handleSelectRelic = useCallback((relicUid: string | null) => {
    setSelectedRelicIds(prev => {
      const next = [...prev]
      next[activeSlot] = relicUid
      return next
    })
  }, [activeSlot])

  const handleSave = useCallback(() => {
    if (!state || !character) {
      message.error('Could not save build')
      return
    }

    const nonEmptyIds = selectedRelicIds.filter(Boolean)
    if (nonEmptyIds.length === 0) {
      message.warning('Select at least one relic')
      return
    }

    const db = window.DB
    if (db?.saveCharacterBuild && buildIndex < 0) {
    }

    const newState = JSON.parse(JSON.stringify(state)) as OptimizerState
    const targetChar = newState.characters?.find(c => c.id === characterId)
    if (!targetChar) {
      message.error('Character not found')
      return
    }

    if (buildIndex < 0) {
      const nextEquipped: Record<string, string> = {}
      SLOT_ORDER.forEach((slot, index) => {
        const relicId = selectedRelicIds[index]
        if (relicId) nextEquipped[slot] = relicId
      })
      targetChar.equipped = nextEquipped

      try {
        if (db?.setCharacter) {
          const dbChar = db.getCharacterById?.(characterId)
          if (dbChar) {
            db.setCharacter({ ...dbChar, equipped: nextEquipped })
            window.SaveState?.save()
            message.success('Updated equipped relics')
            onClose()
            return
          }
        }
        localStorage.setItem('state', JSON.stringify(newState))
        message.success('Updated equipped relics')
        onClose()
      } catch {
        message.error('Could not update equipped relics')
      }
      return
    }

    const builds = targetChar.builds ?? []
    const newBuild: Build = {
      name: buildName.trim() || 'New Build',
      build: selectedRelicIds.filter(Boolean) as string[],
      relicIds: selectedRelicIds.filter(Boolean) as string[],
    }

    if (buildIndex >= 0 && buildIndex < builds.length) {
      builds[buildIndex] = newBuild
    } else {
      builds.push(newBuild)
    }
    targetChar.builds = builds

    try {
      if (db?.setCharacter) {
        const dbChar = db.getCharacterById?.(characterId)
        if (dbChar) {
          db.setCharacter({ ...dbChar, builds })
          window.SaveState?.save()
          message.success(`Saved build "${newBuild.name}"`)
          onClose()
          return
        }
      }

      localStorage.setItem('state', JSON.stringify(newState))
      message.success(`Saved build "${newBuild.name}"`)
      onClose()
    } catch {
      message.error('Could not save build')
    }
  }, [state, character, characterId, buildIndex, buildName, selectedRelicIds, onClose])

  const currentSlotRelics = filteredRelics
  const selectedRelicId = selectedRelicIds[activeSlot]
  const CARD_WIDTH = RELIC_CARD_WIDTH
  const CARD_HEIGHT = RELIC_CARD_HEIGHT
  const CARD_GAP = 8
  const GRID_PADDING = 4
  const fallbackWidth = typeof window !== 'undefined'
    ? Math.max(300, window.innerWidth - 260)
    : 800
  const fallbackHeight = typeof window !== 'undefined'
    ? Math.max(200, Math.round(window.innerHeight * 0.55))
    : 500
  const effectiveWidth = gridSize.width || fallbackWidth
  const effectiveHeight = gridSize.height || fallbackHeight
  const currentSlotItems = useMemo(() => {
    return currentSlotRelics.map((relic, index) => {
      const uid = getRelicUid(relic) ?? null
      return {
        relic,
        uid,
        key: uid ?? `relic-${index}`,
      }
    })
  }, [currentSlotRelics])
  const gridItems = useMemo(() => {
    return [
      { type: 'clear' as const, key: 'clear-slot' },
      ...currentSlotItems.map(item => ({ type: 'relic' as const, ...item })),
    ]
  }, [currentSlotItems])
  const columnCount = useMemo(() => {
    if (effectiveWidth <= 0) return 1
    const available = effectiveWidth - GRID_PADDING * 2
    return Math.max(1, Math.floor((available + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
  }, [effectiveWidth])
  const rowCount = useMemo(() => {
    return Math.ceil(gridItems.length / columnCount)
  }, [gridItems.length, columnCount])
  const rowHeight = CARD_HEIGHT + CARD_GAP
  const totalGridHeight = rowCount * rowHeight
  const visibleRowCount = effectiveHeight > 0 ? Math.ceil(effectiveHeight / rowHeight) : 0
  const overscanRows = 2
  const startRow = Math.max(0, Math.floor(gridScrollTop / rowHeight) - overscanRows)
  const endRow = Math.min(rowCount - 1, startRow + visibleRowCount + overscanRows * 2)

  useLayoutEffect(() => {
    if (!open) return
    const element = gridRef.current
    if (!element) return

    let attempts = 0
    let retryId: number | undefined

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const parentWidth = element.parentElement?.clientWidth ?? 0
      const parentHeight = element.parentElement?.clientHeight ?? 0
      const width = rect.width || element.clientWidth || parentWidth || Math.max(300, window.innerWidth - 260)
      const height = rect.height || element.clientHeight || parentHeight || Math.max(200, Math.round(window.innerHeight * 0.55))

      setGridSize({ width, height })

      if ((width === 0 || height === 0) && attempts < 10) {
        attempts += 1
        retryId = window.setTimeout(updateSize, 50)
      }
    }

    const rafId = requestAnimationFrame(updateSize)
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(rafId)
      if (retryId) window.clearTimeout(retryId)
      observer.disconnect()
    }
  }, [open])

  const renderGridItem = useCallback((item: (typeof gridItems)[number]) => {
    if (item.type === 'clear') {
      return (
        <div
          key={item.key}
          onClick={() => handleSelectRelic(null)}
          style={{
            width: CARD_WIDTH,
            minWidth: CARD_WIDTH,
            height: CARD_HEIGHT,
            border: `2px dashed ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: token.colorTextSecondary,
            fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          Clear Slot
        </div>
      )
    }

    return (
      <RelicCard
        key={item.key}
        relic={item.relic}
        uid={item.uid}
        selected={item.uid === selectedRelicId}
        onSelect={handleSelectRelic}
        compact
      />
    )
  }, [handleSelectRelic, selectedRelicId, token])

  const virtualRows = useMemo(() => {
    if (effectiveWidth <= 0 || effectiveHeight <= 0) return null
    const rows: JSX.Element[] = []
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      const startIndex = rowIndex * columnCount
      const items = gridItems.slice(startIndex, startIndex + columnCount)
      rows.push(
        <div
          key={`row-${rowIndex}`}
          style={{
            position: 'absolute',
            top: rowIndex * rowHeight,
            left: 0,
            right: 0,
            height: rowHeight,
            display: 'flex',
            gap: CARD_GAP,
            paddingLeft: GRID_PADDING,
            paddingRight: GRID_PADDING,
          }}
        >
          {items.map(renderGridItem)}
        </div>
      )
    }
    return rows
  }, [CARD_GAP, GRID_PADDING, columnCount, effectiveHeight, effectiveWidth, endRow, gridItems, renderGridItem, rowHeight, startRow])

  return (
    <Modal
      title={`${characterName} — ${buildIndex >= 0 ? 'Edit Build' : 'Equipped Build'}`}
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      destroyOnClose
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>Save Build</Button>
        </Flex>
      }
    >
      <Flex vertical gap={16}>
        <Input
          placeholder="Build name"
          value={buildName}
          onChange={e => setBuildName(e.target.value)}
          style={{ maxWidth: 300 }}
        />

        <Flex gap={16}>
          <Flex vertical gap={8} style={{ minWidth: 150 }}>
            {[0, 1, 2, 3, 4, 5].map(slot => {
              const selectedRelic = selectedRelicIds[slot] ? relicMap.get(selectedRelicIds[slot]!) : null
              const isActive = slot === activeSlot

              return (
                <div
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: token.borderRadius,
                    cursor: 'pointer',
                    background: isActive ? token.colorPrimaryBg : token.colorBgContainer,
                    border: `1px solid ${isActive ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <Flex align="center" gap={8}>
                    <img
                      src={selectedRelic ? getRelicImageUrl(selectedRelic) : getBlankUrl()}
                      style={{ width: 40, height: 40, borderRadius: 4, opacity: selectedRelic ? 1 : 0.3 }}
                      alt=""
                    />
                    <div>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{SLOT_DISPLAY_NAMES[slot]}</Text>
                      <br />
                      <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                        {selectedRelic ? `+${selectedRelic.enhance}` : 'Not set'}
                      </Text>
                    </div>
                  </Flex>
                </div>
              )
            })}
          </Flex>

          <div style={{ flex: 1 }}>
            <Flex gap={8} align="center" style={{ marginBottom: 10 }} wrap="wrap">
              <Input
                placeholder="Search relics..."
                value={relicSearch}
                onChange={e => setRelicSearch(e.target.value)}
                allowClear
                style={{ width: 180 }}
              />
              <Select
                placeholder="Set"
                allowClear
                value={setFilter ?? undefined}
                options={setOptions}
                onChange={v => setSetFilter(v ?? null)}
                style={{ width: 240 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              <Select
                placeholder="Main stat"
                allowClear
                value={mainStatFilter ?? undefined}
                options={mainStatOptions}
                onChange={v => setMainStatFilter(v ?? null)}
                style={{ width: 200 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              <Select
                mode="multiple"
                placeholder="Substats"
                value={substatFilters}
                options={substatOptions}
                onChange={setSubstatFilters}
                style={{ width: 240 }}
                maxTagCount="responsive"
              />
              <Select
                value={equippedFilter}
                onChange={v => setEquippedFilter(v)}
                style={{ width: 140 }}
                options={[
                  { label: 'All relics', value: 'all' },
                  { label: 'Unequipped', value: 'unequipped' },
                  { label: 'Equipped', value: 'equipped' },
                ]}
              />
              <Select
                value={sortOption}
                onChange={v => setSortOption(v)}
                style={{ width: 160 }}
                options={[
                  { label: 'Enhance (High)', value: 'enhance-desc' },
                  { label: 'Enhance (Low)', value: 'enhance-asc' },
                  { label: 'Main Stat (High)', value: 'main-desc' },
                  { label: 'Main Stat (Low)', value: 'main-asc' },
                  { label: 'Rarity', value: 'grade-desc' },
                ]}
              />
              <Text style={{ fontSize: 12, color: token.colorTextSecondary, marginLeft: 'auto' }}>
                {currentSlotRelics.length} relics
              </Text>
            </Flex>

            <div
              ref={gridRef}
              onScroll={(event) => setGridScrollTop(event.currentTarget.scrollTop)}
              style={{ height: '55vh', overflowY: 'auto' }}
            >
              <div style={{ position: 'relative', height: totalGridHeight }}>
                {virtualRows}
              </div>
            </div>
          </div>
        </Flex>
      </Flex>
    </Modal>
  )
}
