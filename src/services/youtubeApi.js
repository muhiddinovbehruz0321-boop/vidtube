const GOOGLE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'
const DEFAULT_CACHE_TTL = 5 * 60 * 1000
const REQUEST_TIMEOUT = 12000
const responseCache = new Map()
const inFlightRequests = new Map()

export class YouTubeApiError extends Error {
  constructor(message, { code = 'API_ERROR', status = 0, reason = '' } = {}) {
    super(message)
    this.name = 'YouTubeApiError'
    this.code = code
    this.status = status
    this.reason = reason
  }
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_YOUTUBE_API_BASE_URL || GOOGLE_API_BASE_URL).replace(/\/+$/, '')
}

function toApiError(status, payload) {
  const details = payload?.error
  const reason = details?.errors?.[0]?.reason || ''
  const message = details?.message || ''

  if (status === 403 && /quota|dailyLimit/i.test(`${reason} ${message}`)) {
    return new YouTubeApiError('YouTube API quota is exhausted. Please try again later.', {
      code: 'QUOTA_EXCEEDED', status, reason,
    })
  }
  if (status === 403 && /keyInvalid|API key not valid/i.test(`${reason} ${message}`)) {
    return new YouTubeApiError('The YouTube API key is invalid. Check the local environment configuration.', {
      code: 'INVALID_API_KEY', status, reason,
    })
  }
  if (status === 403 && /accessNotConfigured|SERVICE_DISABLED/i.test(`${reason} ${message}`)) {
    return new YouTubeApiError('YouTube Data API v3 is not enabled for this Google Cloud project.', {
      code: 'API_NOT_ENABLED', status, reason,
    })
  }
  if (status === 400) {
    return new YouTubeApiError(message || 'The YouTube API rejected the request parameters.', {
      code: 'INVALID_REQUEST', status, reason,
    })
  }
  if (status === 403) {
    return new YouTubeApiError('YouTube denied this request. Check API key restrictions and permissions.', {
      code: 'FORBIDDEN', status, reason,
    })
  }
  if (status === 404) {
    return new YouTubeApiError('The requested YouTube resource was not found.', {
      code: 'NOT_FOUND', status, reason,
    })
  }
  if (status >= 500) {
    return new YouTubeApiError('YouTube is temporarily unavailable. Please try again.', {
      code: 'UPSTREAM_ERROR', status, reason,
    })
  }
  return new YouTubeApiError(message || 'The YouTube request failed.', { status, reason })
}

function makeCacheKey(resource, params) {
  return `${resource}?${Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')}`
}

async function fetchResource(url, signal) {
  const controller = new AbortController()
  const onAbort = () => controller.abort(signal.reason)
  signal?.addEventListener('abort', onAbort, { once: true })
  if (signal?.aborted) onAbort()

  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const payload = await response.json().catch(() => null)
    if (!response.ok) throw toApiError(response.status, payload)
    return payload
  } catch (error) {
    if (error instanceof YouTubeApiError) throw error
    if (timedOut) {
      throw new YouTubeApiError('The YouTube request timed out. Please try again.', { code: 'TIMEOUT' })
    }
    if (signal?.aborted || error.name === 'AbortError') throw error
    if (!navigator.onLine) {
      throw new YouTubeApiError('No internet connection. Check your connection and try again.', {
        code: 'OFFLINE',
      })
    }
    throw new YouTubeApiError('Could not reach YouTube. Check the API key restrictions and try again.', {
      code: 'NETWORK_ERROR',
    })
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

function subscribeToRequest(entry, signal) {
  const subscriber = Symbol('youtube-request')
  entry.subscribers.add(subscriber)

  return new Promise((resolve, reject) => {
    let finished = false
    const cleanup = () => {
      if (finished) return false
      finished = true
      entry.subscribers.delete(subscriber)
      signal?.removeEventListener('abort', onAbort)
      if (!entry.settled && entry.subscribers.size === 0) entry.controller.abort()
      return true
    }
    const onAbort = () => {
      if (cleanup()) reject(new DOMException('The request was cancelled.', 'AbortError'))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    entry.promise.then(
      (value) => { if (cleanup()) resolve(value) },
      (error) => { if (cleanup()) reject(error) },
    )
  })
}

export function youtubeRequest(resource, params = {}, { signal, cacheTtl = DEFAULT_CACHE_TTL } = {}) {
  const baseUrl = getApiBaseUrl()
  const url = new URL(`${baseUrl}/${resource}`, window.location.origin)
  const query = { ...params }
  if (new URL(baseUrl, window.location.origin).origin === new URL(GOOGLE_API_BASE_URL).origin) {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
    if (!apiKey) {
      return Promise.reject(new YouTubeApiError(
        'YouTube API is not configured. Add VITE_YOUTUBE_API_KEY to the local .env file.',
        { code: 'MISSING_API_KEY' },
      ))
    }
    query.key = apiKey
  }
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, String(value))
    }
  }

  const key = makeCacheKey(resource, params)
  const cached = responseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value)
  if (cached) responseCache.delete(key)

  let entry = inFlightRequests.get(key)
  if (entry?.controller.signal.aborted) {
    inFlightRequests.delete(key)
    entry = null
  }
  if (!entry) {
    const controller = new AbortController()
    entry = { controller, subscribers: new Set(), settled: false, promise: null }
    const currentEntry = entry
    entry.promise = fetchResource(url, controller.signal).then((value) => {
      if (cacheTtl > 0) responseCache.set(key, { value, expiresAt: Date.now() + cacheTtl })
      return value
    }).finally(() => {
      currentEntry.settled = true
      if (inFlightRequests.get(key) === currentEntry) inFlightRequests.delete(key)
    })
    inFlightRequests.set(key, entry)
  }
  return subscribeToRequest(entry, signal)
}

export function clearYouTubeCache() {
  responseCache.clear()
}
