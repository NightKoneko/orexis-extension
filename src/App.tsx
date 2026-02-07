import { useState } from 'react'
import { ConfigProvider, Segmented, theme, Flex } from 'antd'
import { TeamOutlined, UserOutlined } from '@ant-design/icons'
import { TeamLoadouts } from './components/TeamLoadouts'
import { CharacterBuilds } from './components/CharacterBuilds'
import { getStoreState } from './site-api'

const { darkAlgorithm } = theme

const DEFAULT_CONTENT_WIDTH = 1450

const defaultGap = 8

export function App() {
  const [activeTab, setActiveTab] = useState<string>('teams')
  const [buildsCharacterId, setBuildsCharacterId] = useState<string | null>(null)

  const globalTheme = getStoreState()?.globalThemeConfig

  return (
    <ConfigProvider
      theme={globalTheme ?? {
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#1668dc',
          borderRadius: 6,
        },
      }}
    >
      <Flex
        vertical
        gap={defaultGap}
        style={{
          width: DEFAULT_CONTENT_WIDTH,
          marginBottom: 200,
        }}
      >

        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            {
              value: 'teams',
              label: (
                <Flex align="center" gap={6} style={{ padding: '0 8px' }}>
                  <TeamOutlined />
                  Team Loadouts
                </Flex>
              ),
            },
            {
              value: 'builds',
              label: (
                <Flex align="center" gap={6} style={{ padding: '0 8px' }}>
                  <UserOutlined />
                  Character Builds
                </Flex>
              ),
            },
          ]}
        />

        <div style={{ display: activeTab === 'teams' ? 'contents' : 'none' }}>
          <TeamLoadouts
            onOpenCharacterBuilds={(characterId) => {
              setBuildsCharacterId(characterId)
              setActiveTab('builds')
            }}
          />
        </div>
        <div style={{ display: activeTab === 'builds' ? 'contents' : 'none' }}>
          <CharacterBuilds
            externalSelectedCharacterId={buildsCharacterId}
            onSelectCharacterId={setBuildsCharacterId}
          />
        </div>
      </Flex>
    </ConfigProvider>
  )
}
