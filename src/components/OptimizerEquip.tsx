import { Button, Flex, message } from "antd"
import { HeaderText } from "./HeaderText"
import { getStoreState, resolveCharacterName } from "../site-api"
import { applyLoadout } from "../utils/bridge"
import { MEOW } from "../content"

export function OptimizerEquip() {
  return (<Flex vertical gap={5} >
      <HeaderText style={{color: 'white'}}>
        Orexis
      </HeaderText>
      <Button
        onClick={async () => {
          const {optimizerTabFocusCharacter, optimizerBuild} = getStoreState() ?? {}
          if (!optimizerTabFocusCharacter || !optimizerBuild) {
            return message.error('Failed to retrieve necessary information from store')
          }
          const loadout = {
            avatar_id: parseInt(optimizerTabFocusCharacter),
            name: `${resolveCharacterName(null, optimizerTabFocusCharacter)} - optimizer build`,
            relic_uids: Object.values(optimizerBuild).filter(Boolean).map(Number),
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
        }}
        type='primary'
      >
        <div dangerouslySetInnerHTML={{__html: MEOW}} style={{height: 20, width: 20}}/>
        Equip in game
      </Button>
    </Flex>
  )
}