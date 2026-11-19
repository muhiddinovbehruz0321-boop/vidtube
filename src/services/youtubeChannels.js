import { youtubeRequest } from './youtubeApi'
import { rememberChannelAvatar } from './youtubeChannelAvatars'
import { getVideosFromPlaylistPage } from './youtubeVideos'

const CHANNEL_FIELDS = 'nextPageToken,items(id,snippet(title,description,customUrl,publishedAt,thumbnails(default,medium,high)),statistics(viewCount,subscriberCount,hiddenSubscriberCount,videoCount),brandingSettings(image(bannerExternalUrl)),contentDetails(relatedPlaylists(uploads)))'

export async function getChannelById(channelId, { signal } = {}) {
  const response = await youtubeRequest('channels', {
    part: 'snippet,statistics,brandingSettings,contentDetails',
    id: channelId,
    fields: CHANNEL_FIELDS,
  }, { signal })
  const channel = response.items?.[0]
  if (!channel) return null

  const snippet = channel.snippet || {}
  const thumbnails = snippet.thumbnails || {}
  const avatar = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || ''
  rememberChannelAvatar(channel.id, avatar)
  return {
    id: channel.id,
    title: snippet.title || 'Unknown channel',
    description: snippet.description || '',
    customUrl: snippet.customUrl || '',
    publishedAt: snippet.publishedAt || '',
    avatar,
    banner: channel.brandingSettings?.image?.bannerExternalUrl || '',
    viewCount: Number(channel.statistics?.viewCount || 0),
    subscriberCount: channel.statistics?.hiddenSubscriberCount
      ? null
      : Number(channel.statistics?.subscriberCount || 0),
    videoCount: Number(channel.statistics?.videoCount || 0),
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || '',
  }
}

export async function getChannelVideos(uploadsPlaylistId, { pageToken, maxResults = 12, signal } = {}) {
  const page = await youtubeRequest('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults,
    pageToken,
    fields: 'nextPageToken,prevPageToken,pageInfo(totalResults,resultsPerPage),items(contentDetails(videoId),snippet(resourceId(videoId)))',
  }, { signal })
  return getVideosFromPlaylistPage(page, { signal })
}
