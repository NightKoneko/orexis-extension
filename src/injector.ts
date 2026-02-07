import { runtimeGetURL, runtimeSendMessage } from './utils/extensionApi'

const script = document.createElement('script')
script.src = runtimeGetURL('content.js')
script.type = 'text/javascript'

;(document.head || document.documentElement).appendChild(script)

script.onload = () => {
  script.remove()
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  
  if (event.data?.type === 'orexis_to_background') {
    runtimeSendMessage(event.data.payload, (response) => {
      window.postMessage({
        type: 'orexis_from_background',
        id: event.data.id,
        response
      }, '*')
    })
  }
})

console.log('[Orexis] Injector loaded')
