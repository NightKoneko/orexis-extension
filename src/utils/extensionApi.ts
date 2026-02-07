export type ExtensionApi = typeof chrome

export function getExtensionApi(): ExtensionApi {
  const api = (globalThis as { browser?: ExtensionApi; chrome?: ExtensionApi }).browser
    ?? (globalThis as { chrome?: ExtensionApi }).chrome
  if (!api) {
    throw new Error('Extension API not available')
  }
  return api
}

export async function storageGet(key: string): Promise<Record<string, unknown>> {
  const api = getExtensionApi()
  return new Promise((resolve) => {
    try {
      const maybePromise = api.storage.local.get(
        key,
        (result: Record<string, unknown>) => resolve(result)
      )
      const thenable = maybePromise as unknown as Promise<Record<string, unknown>> | undefined
      if (thenable && typeof (thenable as { then?: unknown }).then === 'function') {
        thenable
          .then((value) => resolve(value))
          .catch(() => resolve({}))
      }
    } catch {
      resolve({})
    }
  })
}

export function storageSet(items: Record<string, unknown>): Promise<void> {
  const api = getExtensionApi()
  return new Promise((resolve) => {
    try {
      const maybePromise = api.storage.local.set(items, () => resolve())
      const thenable = maybePromise as unknown as Promise<void> | undefined
      if (thenable && typeof (thenable as { then?: unknown }).then === 'function') {
        thenable
          .then(() => resolve())
          .catch(() => resolve())
      }
    } catch {
      resolve()
    }
  })
}

export function runtimeSendMessage<T = unknown>(payload: unknown, callback?: (response: T) => void): void {
  const api = getExtensionApi()
  try {
    const maybePromise = api.runtime.sendMessage(payload, (response: T) => callback?.(response))
    const thenable = maybePromise as unknown as Promise<T> | undefined
    if (thenable && typeof (thenable as { then?: unknown }).then === 'function') {
      thenable
        .then((response: T) => callback?.(response))
        .catch(() => callback?.(undefined as T))
    }
  } catch {
    callback?.(undefined as T)
  }
}

export function runtimeGetURL(path: string): string {
  return getExtensionApi().runtime.getURL(path)
}
