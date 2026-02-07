import { BRIDGE_MESSAGE_TIMEOUT } from '../constants'

let messageId = 0
const pendingCallbacks = new Map<number, (response: unknown) => void>()

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type !== 'orexis_from_background') return
  
  const callback = pendingCallbacks.get(event.data.id)
  if (callback) {
    pendingCallbacks.delete(event.data.id)
    callback(event.data.response)
  }
})

export function sendToBackground<T = unknown>(
  payload: { type: string; [key: string]: unknown },
  callback?: (response: T) => void
): void {
  const id = ++messageId
  
  if (callback) {
    pendingCallbacks.set(id, callback as (response: unknown) => void)
    
    setTimeout(() => {
      if (pendingCallbacks.has(id)) {
        pendingCallbacks.delete(id)
        callback({ ok: false, error: 'Timeout' } as T)
      }
    }, BRIDGE_MESSAGE_TIMEOUT)
  }
  
  window.postMessage({
    type: 'orexis_to_background',
    id,
    payload,
  }, '*')
}

export function applyLoadout(loadout: {
  avatar_id: number
  name: string
  relic_uids: number[]
}): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    sendToBackground({ type: 'apply_loadout', loadout }, (response) => {
      resolve(response as { ok: boolean; error?: string })
    })
  })
}

export function checkBackendStatus(): Promise<{ connected: boolean }> {
  return new Promise((resolve) => {
    sendToBackground({ type: 'get_status' }, (response) => {
      resolve(response as { connected: boolean })
    })
  })
}
