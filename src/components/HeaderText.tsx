import { Typography } from 'antd'
import type { ComponentProps, CSSProperties } from 'react'

const { Text } = Typography

const BASE_STYLE: CSSProperties = {
    textDecoration: 'underline',
    textDecorationColor: '#6d97ffb3',
    textUnderlineOffset: '2px',
    whiteSpace: 'nowrap',
}

type HeaderTextProps = ComponentProps<typeof Text>

export function HeaderText({ style, ...props }: HeaderTextProps) {
    return <Text {...props} style={{ ...BASE_STYLE, ...style }} />
}
