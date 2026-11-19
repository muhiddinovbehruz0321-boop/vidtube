import { createServer } from 'node:http'
import { env } from 'node:process'

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3'
const ALLOWED_RESOURCES = new Set([
  'search',
  'videos',
  'channels',
  'playlists',
  'playlistItems',
  'videoCategories',
])
const allowedOrigins = new Set(
  (env.YOUTUBE_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)
const apiKey = env.YOUTUBE_API_KEY
const port = Number(env.YOUTUBE_PROXY_PORT || 4174)

if (!apiKey) {
  throw new Error('YOUTUBE_API_KEY must be configured in the server environment.')
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
  }

  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.writeHead(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET, OPTIONS' }).end('Method not allowed')
    return
  }

  const requestUrl = new URL(request.url || '/', 'http://localhost')
  const match = requestUrl.pathname.match(/^\/api\/youtube\/v3\/([A-Za-z]+)$/)
  const resource = match?.[1]
  if (!resource || !ALLOWED_RESOURCES.has(resource)) {
    response.writeHead(404).end('YouTube API resource not found')
    return
  }

  const upstreamUrl = new URL(`${API_BASE_URL}/${resource}`)
  for (const [name, value] of requestUrl.searchParams) {
    if (name !== 'key') upstreamUrl.searchParams.set(name, value)
  }
  upstreamUrl.searchParams.set('key', apiKey)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const upstream = await fetch(upstreamUrl, { signal: controller.signal })
    const body = await upstream.text()
    response.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    })
    response.end(body)
  } catch {
    const status = controller.signal.aborted ? 504 : 502
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({
      error: { message: status === 504 ? 'YouTube API request timed out.' : 'YouTube API is unavailable.' },
    }))
  } finally {
    clearTimeout(timeout)
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`YouTube API proxy listening on http://127.0.0.1:${port}`)
})
