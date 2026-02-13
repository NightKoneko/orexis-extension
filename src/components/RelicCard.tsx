import { memo } from 'react'
import { Card, Divider, Flex, Tooltip, theme } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import type { Relic } from '../types'
import {
  GRADE_COLORS,
  getReadableStatName,
  getRelicImageUrl,
  getStatIconUrl,
  isFlatStat,
  renderMainStatNumber,
  renderSubstatNumber,
} from '../utils'
import { RELIC_CARD_HEIGHT, RELIC_CARD_WIDTH } from '../constants'
import { getBlankUrl, getCharacterAvatarUrl, getI18n } from '../site-api'

const RollArrow = () => (
  <span style={{ marginRight: -5, opacity: 0.75 }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24">
      <g transform="translate(24 1) scale(-1 1)">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" d="M8 12L15 5M8 12L15 19" />
      </g>
    </svg>
  </span>
)

const CircleIcon = ({ color }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="7" cy="7" r="7" fill={color || 'transparent'} />
  </svg>
)

function getVerifiedTooltipText(): string | null {
  const i18n = getI18n()
  if (!i18n?.t) return null
  const translated = i18n.t('VerifiedRelicHoverText')
  if (translated && !translated.includes('VerifiedRelicHoverText')) return translated
  return null
}

function renderGradeIcon(relic: Relic) {
  const color = GRADE_COLORS[relic.grade] ?? GRADE_COLORS[5]
  if (relic.verified) {
    const tooltip = getVerifiedTooltipText()
    const icon = <CheckCircleFilled style={{ fontSize: '14px', color }} />
    return tooltip ? <Tooltip mouseEnterDelay={0.4} title={tooltip}>{icon}</Tooltip> : icon
  }

  return <CircleIcon color={color} />
}

const StatRow = ({ 
  stat,
  value,
  isMain = false,
  addedRolls = 0,
  iconStyle,
  verified,
}: { 
  stat?: string
  value?: number
  isMain?: boolean
  addedRolls?: number
  iconStyle?: { width: number; height: number; marginRight: number; marginLeft: number }
  verified?: boolean
}) => {
  const finalIconStyle = iconStyle ?? { width: 22, height: 22, marginRight: 2, marginLeft: -3 }

  if (!stat || value == null) {
    return <img src={getBlankUrl()} style={finalIconStyle} alt="" />
  }

  const displayValue = isMain
    ? renderMainStatNumber(stat, value)
    : renderSubstatNumber(stat, value, verified)
  const iconUrl = getStatIconUrl(stat)
  const label = getReadableStatName(stat)
  const suffix = isFlatStat(stat) ? '' : '%'
  
  if (isMain) {
    return (
      <Flex justify="space-between" align="center">
        <Flex>
          <img src={iconUrl} style={finalIconStyle} alt="" />
          {label}
        </Flex>
        {displayValue}{suffix}
      </Flex>
    )
  }
  
  return (
    <Flex justify="space-between" align="center">
      <Flex>
        <img src={iconUrl} style={finalIconStyle} alt="" />
        {label}
      </Flex>
      <Flex justify="space-between" style={{ width: '41.5%' }}>
        <Flex align="center">
          {addedRolls > 0 
            ? Array.from({ length: Math.min(addedRolls, 6) }).map((_, i) => <RollArrow key={i} />)
            : <div />
          }
        </Flex>
        {displayValue}{suffix}
      </Flex>
    </Flex>
  )
}

export interface RelicCardProps {
  relic: Relic
  uid?: string | null
  selected?: boolean
  onSelect?: (uid: string | null) => void
  showScore?: boolean
  compact?: boolean
  size?: 'compact' | 'comfortable' | 'regular'
  fillWidth?: boolean
}

export const RelicCard = memo(function RelicCard({
  relic,
  uid = null,
  selected = false,
  onSelect,
  fillWidth = false,
}: RelicCardProps) {
  const { token } = theme.useToken()
  const relicSrc = getRelicImageUrl(relic)
  const equippedBySrc = relic.equippedBy 
    ? getCharacterAvatarUrl(relic.equippedBy)
    : getBlankUrl()

  const ICON_SIZE = 54
  const CARD_WIDTH = RELIC_CARD_WIDTH
  const CARD_HEIGHT = RELIC_CARD_HEIGHT
  const CONTENT_HEIGHT = 255
  const STAT_GAP = 6
  const ICON_STYLE = { width: 22, height: 22, marginRight: 2, marginLeft: -3 }
  const JUSTIFY: 'space-around' | 'space-between' = 'space-around'
  const substats = Array.from({ length: 4 }, (_, index) => relic.substats?.[index])
  const showEnhance = relic.id != null || relic.uid != null
  const language = getI18n()?.resolvedLanguage
  const isCompactLanguage = language === 'fr_FR' || language === 'pt_BR' || language === 'vi_VN'
  const statTextStyle = {
    whiteSpace: 'nowrap' as const,
    letterSpacing: '-0.2px',
    ...(isCompactLanguage ? { fontSize: '13px', lineHeight: '22px' } : {}),
  }

  const userAgent = navigator.userAgent
  const isMobile = /Android|iPhone|iPad/i.test(userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
  const showcaseShadow = (isMobile || isSafari)
    ? 'rgb(0, 0, 0) 1px 0px 6px'
    : 'rgb(0, 0, 0) 1px 1px 6px'
  const showcaseShadowInsetAddition = ', inset rgb(255 255 255 / 30%) 0px 0px 2px'
  
  return (
    <Card
      size="small"
      hoverable
      onClick={onSelect ? () => onSelect(uid) : undefined}
      style={{
        width: fillWidth ? '100%' : CARD_WIDTH,
        minWidth: fillWidth ? 0 : CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: selected ? token.colorPrimaryBg : undefined,
        borderColor: selected ? token.colorPrimaryBorder : undefined,
        transition: 'background-color 0.35s, box-shadow 0.25s, border-color 0.25s',
        borderRadius: 6,
        boxShadow: showcaseShadow + showcaseShadowInsetAddition,
        cursor: 'pointer',
      }}
    >
      <Flex
        vertical
        justify={JUSTIFY}
        style={{ height: CONTENT_HEIGHT, ...statTextStyle }}
      >
        <Flex justify="space-between" align="center">
          <img
            src={relicSrc}
            title={relic.set}
            style={{ height: ICON_SIZE, width: ICON_SIZE }}
            alt=""
          />
          <Flex align="center" gap={8}>
            <span>{renderGradeIcon(relic)}</span>
            <span>{showEnhance ? `+${relic.enhance}` : ''}</span>
          </Flex>
          <img
            src={equippedBySrc}
            style={{
              height: ICON_SIZE,
              width: ICON_SIZE,
              borderRadius: ICON_SIZE / 2,
              border: relic.equippedBy ? '1px solid rgba(150, 150, 150, 0.25)' : undefined,
              backgroundColor: relic.equippedBy ? 'rgba(0, 0, 0, 0.1)' : undefined,
            }}
            alt=""
          />
        </Flex>

        <Divider style={{ margin: '6px 0px 6px 0px' }} />

        <StatRow
          stat={relic.main?.stat}
          value={relic.main?.value}
          isMain
          iconStyle={ICON_STYLE}
        />

        <Divider style={{ margin: '6px 0px 6px 0px' }} />

        <Flex vertical gap={STAT_GAP}>
          {substats.map((sub, i) => (
            <StatRow
              key={i}
              stat={sub?.stat}
              value={sub?.value}
              addedRolls={sub?.addedRolls}
              iconStyle={ICON_STYLE}
              verified={relic.verified}
            />
          ))}
        </Flex>
      </Flex>
    </Card>
  )
})
