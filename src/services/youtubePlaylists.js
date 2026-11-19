import { youtubeRequest } from './youtubeApi'
import { getVideosFromPlaylistPage } from './youtubeVideos'

export async function getPlaylistById(playlistId, { signal } = {}) {
  const response = await youtubeRequest('playlists', {
    part: 'snippet,contentDetails,status',
    id: playlistId,
    fields: 'items(id,snippet(title,description,channelId,channelTitle,publishedAt,thumbnails(default,medium,high)),contentDetails(itemCount),status(privacyStatus))',
  }, { signal })
  const playlist = response.items?.[0]
  if (!playlist) return null
  return {
    id: playlist.id,
    title: playlist.snippet?.title || 'Untitled playlist',
    description: playlist.snippet?.description || '',
    channelId: playlist.snippet?.channelId || '',
    channel: playlist.snippet?.channelTitle || 'Unknown channel',
    publishedAt: playlist.snippet?.publishedAt || '',
    thumbnail: playlist.snippet?.thumbnails?.high?.url ||
      playlist.snippet?.thumbnails?.medium?.url ||
      playlist.snippet?.thumbnails?.default?.url || '',
    itemCount: Number(playlist.contentDetails?.itemCount || 0),
    privacyStatus: playlist.status?.privacyStatus || '',
  }
}

export async function getPlaylistVideos(playlistId, { pageToken, maxResults = 12, signal } = {}) {
  const page = await youtubeRequest('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults,
    pageToken,
    fields: 'nextPageToken,prevPageToken,pageInfo(totalResults,resultsPerPage),items(contentDetails(videoId),snippet(resourceId(videoId)))',
  }, { signal })
  return getVideosFromPlaylistPage(page, { signal })
}
