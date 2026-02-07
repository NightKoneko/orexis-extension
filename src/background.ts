import { DEFAULT_WS_URL, WS_URL_STORAGE_KEY } from './constants'
import { getExtensionApi, storageGet, storageSet } from './utils/extensionApi'

const extensionApi = getExtensionApi()

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

async function getWsUrl(): Promise<string> {
  const result = await storageGet(WS_URL_STORAGE_KEY)
  return (result[WS_URL_STORAGE_KEY] as string) || DEFAULT_WS_URL
}

async function meow() {
  if (ws?.readyState === WebSocket.OPEN) return

  const url = await getWsUrl()
  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[Orexis] Connected to backend')
  }

  ws.onclose = () => {
    console.log('[Orexis] Disconnected from backend, reconnecting in 5s...')
    ws = null
    scheduleReconnect()
  }

  ws.onerror = (error) => {
    console.error('[Orexis] WebSocket error:', error)
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string)
      console.log('[Orexis] Received:', data)
    } catch {
      console.log('[Orexis] Received raw:', event.data)
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(meow, 5000)
}

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Orexis] Message received:', message)

  if (message.type === 'apply_loadout') {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      sendResponse({ ok: false, error: 'Not connected to backend' })
      return true
    }

    const payload = {
      type: 'set_loadouts',
      loadouts: [message.loadout],
    }

    const onResponse = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        if (data.type === 'loadouts_updated') {
          sendResponse({ ok: true })
        } else if (data.type === 'error') {
          sendResponse({ ok: false, error: data.message || 'Backend error' })
        } else {
          sendResponse({ ok: true })
        }
      } catch {
        sendResponse({ ok: true })
      }
      ws?.removeEventListener('message', onResponse)
    }

    const timeout = setTimeout(() => {
      ws?.removeEventListener('message', onResponse)
      sendResponse({ ok: false, error: 'Backend response timeout' })
    }, 5000)

    ws.addEventListener('message', (event) => {
      clearTimeout(timeout)
      onResponse(event)
    }, { once: true })

    ws.send(JSON.stringify(payload))
    return true
  }

  if (message.type === 'get_status') {
    sendResponse({ connected: ws?.readyState === WebSocket.OPEN })
    return true
  }

  if (message.type === 'set_ws_url') {
    const url = message.url as string
    storageSet({ [WS_URL_STORAGE_KEY]: url })
    ws?.close()
    meow()
    sendResponse({ ok: true })
    return true
  }

  return false
})

meow()