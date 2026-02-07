import { Card, Divider, Flex, theme } from 'antd'
import type { Relic } from '../types'
import {
  GRADE_COLORS,
  formatStatValue,
  getRelicImageUrl,
  getStatIconUrl,
} from '../utils'
import { getBlankUrl, getCharacterAvatarUrl } from '../site-api'

const RollArrow = () => (
  <span style={{ marginRight: -5, opacity: 0.75 }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24">
      <g transform="translate(24 1) scale(-1 1)">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" d="M8 12L15 5M8 12L15 19" />
      </g>
    </svg>
  </span>
)

const GradeIndicator = ({ grade, enhance }: { grade: number; enhance: number }) => {
  const color = GRADE_COLORS[grade] ?? GRADE_COLORS[5]
  return (
    <Flex align="center" gap={8}>
      <span>
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <circle cx="7" cy="7" r="7" fill={color} />
        </svg>
      </span>
      <span>+{enhance}</span>
    </Flex>
  )
}

const StatRow = ({ 
  stat, 
  value, 
  isMain = false, 
  addedRolls = 0,
  iconStyle,
}: { 
  stat: string
  value: number
  isMain?: boolean
  addedRolls?: number
  iconStyle?: { width: number; height: number; marginRight: number; marginLeft: number }
}) => {
  const displayValue = formatStatValue(stat, value)
  const iconUrl = getStatIconUrl(stat)
  const finalIconStyle = iconStyle ?? { width: 22, height: 22, marginRight: 2, marginLeft: -3 }
  
  if (isMain) {
    return (
      <Flex justify="space-between" align="center">
        <Flex>
          <img src={iconUrl} style={finalIconStyle} alt="" />
          {stat}
        </Flex>
        {displayValue}
      </Flex>
    )
  }
  
  return (
    <Flex justify="space-between" align="center">
      <Flex>
        <img src={iconUrl} style={finalIconStyle} alt="" />
        {stat}
      </Flex>
      <Flex justify="space-between" style={{ width: '41.5%' }}>
        <Flex align="center">
          {addedRolls > 0 
            ? Array.from({ length: Math.min(addedRolls, 6) }).map((_, i) => <RollArrow key={i} />)
            : <div />
          }
        </Flex>
        {displayValue}
      </Flex>
    </Flex>
  )
}

export interface RelicCardProps {
  relic: Relic
  selected?: boolean
  onClick?: () => void
  showScore?: boolean
  compact?: boolean
}

export function RelicCard({ relic, selected = false, onClick, compact = false }: RelicCardProps) {
  const { token } = theme.useToken()
  const relicSrc = getRelicImageUrl(relic)
  const equippedBySrc = relic.equippedBy 
    ? getCharacterAvatarUrl(relic.equippedBy)
    : getBlankUrl()
  
  const ICON_SIZE = compact ? 36 : 50
  const CARD_WIDTH = compact ? 160 : 200
  const CARD_HEIGHT = compact ? 220 : 280
  const CONTENT_HEIGHT = compact ? 195 : 255
  const ICON_STYLE = compact ? { width: 16, height: 16, marginRight: 2, marginLeft: -2 } : { width: 22, height: 22, marginRight: 2, marginLeft: -3 }
  
  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      style={{
        width: CARD_WIDTH,
        minWidth: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: selected ? token.colorPrimaryBg : token.colorBgContainer,
        borderColor: selected ? token.colorPrimaryBorder : token.colorBorderSecondary,
        transition: 'background-color 0.35s, box-shadow 0.25s, border-color 0.25s',
        borderRadius: token.borderRadius,
        boxShadow: token.boxShadowSecondary,
        cursor: 'pointer',
      }}
    >
      <Flex vertical justify="space-between" style={{ height: CONTENT_HEIGHT }}>
        <Flex justify="space-between" align="center">
          <img
            src={relicSrc}
            title={relic.set}
            style={{ height: ICON_SIZE, width: ICON_SIZE }}
            alt=""
          />
          <GradeIndicator grade={relic.grade} enhance={relic.enhance} />
          <img
            src={equippedBySrc}
            style={{
              height: ICON_SIZE,
              width: ICON_SIZE,
              borderRadius: ICON_SIZE / 2,
              border: relic.equippedBy ? `1px solid ${token.colorBorderSecondary}` : undefined,
              backgroundColor: relic.equippedBy ? token.colorFillQuaternary : undefined,
            }}
            alt=""
          />
        </Flex>

        <Divider style={{ margin: compact ? '4px 0' : '6px 0' }} />

        {relic.main && (
          <StatRow stat={relic.main.stat} value={relic.main.value} isMain iconStyle={ICON_STYLE} />
        )}

        <Divider style={{ margin: compact ? '4px 0' : '6px 0' }} />

        <Flex vertical gap={0}>
          {relic.substats.map((sub, i) => (
            <StatRow
              key={i}
              stat={sub.stat}
              value={sub.value}
              addedRolls={sub.addedRolls}
              iconStyle={ICON_STYLE}
            />
          ))}
        </Flex>
      </Flex>
    </Card>
  )
}
