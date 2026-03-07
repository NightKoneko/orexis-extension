import { Button, Flex, message } from "antd"
import { HeaderText } from "./HeaderText"
import { getRelicById, getStoreState, resolveCharacterName } from "../site-api"
import { applyLoadout } from "../utils/bridge"
import { MEOW } from "../content"
import { getRelicUid } from "../utils/relics"
import type { Relic } from "../types"

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

          const relicUids = Object.values(optimizerBuild)
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .map((id) => {
              const relic = getRelicById(id) as Relic | undefined
              const resolved = relic ? getRelicUid(relic) ?? id : id
              const uid = Number(resolved)
              return Number.isInteger(uid) && uid > 0 ? uid : null
            })
            .filter((uid): uid is number => uid != null)

          if (!relicUids.length) {
            return message.error('build did not contain valid game relic UIDs')
          }

          const loadout = {
            avatar_id: parseInt(optimizerTabFocusCharacter),
            name: `${resolveCharacterName(null, optimizerTabFocusCharacter)} - optimizer build`,
            relic_uids: relicUids,
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