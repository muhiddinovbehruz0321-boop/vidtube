import { youtubeRequest } from './youtubeApi'

const avatarCache = new Map()
const AVATAR_CACHE_TTL = 60 * 60 * 1000

export function rememberChannelAvatar(channelId, avatarUrl) {
  if (channelId && avatarUrl) {
    avatarCache.set(channelId, { avatarUrl, expiresAt: Date.now() + AVATAR_CACHE_TTL })
  }
}

export async function getChannelAvatars(channelIds, { signal } = {}) {
  const uniqueIds = [...new Set(channelIds.filter(Boolean))]
  const now = Date.now()
  const missingIds = uniqueIds.filter((id) => {
    const cached = avatarCache.get(id)
    if (cached?.expiresAt > now) return false
    avatarCache.delete(id)
    return true
  })

  if (missingIds.length) {
    const response = await youtubeRequest('channels', {
      part: 'snippet',
      id: missingIds.slice(0, 50).join(','),
      fields: 'items(id,snippet(thumbnails(default,medium,high)))',
    }, { signal, cacheTtl: AVATAR_CACHE_TTL })

    for (const channel of response.items || []) {
      const thumbnails = channel.snippet?.thumbnails || {}
      const avatarUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || ''
      if (avatarUrl) rememberChannelAvatar(channel.id, avatarUrl)
    }
    for (const id of missingIds) {
      if (!avatarCache.has(id)) avatarCache.set(id, { avatarUrl: '', expiresAt: now + AVATAR_CACHE_TTL })
    }
  }

  return new Map(uniqueIds.map((id) => [id, avatarCache.get(id)?.avatarUrl || '']))
}
