import { formatDate } from '../utils/formatDate'
import { formatDuration } from '../utils/formatDuration'
import { formatViews } from '../utils/formatViews'
import { youtubeRequest } from './youtubeApi'
import { getChannelAvatars } from './youtubeChannelAvatars'

const VIDEO_FIELDS = 'nextPageToken,prevPageToken,pageInfo(totalResults,resultsPerPage),items(id,snippet(title,description,channelId,channelTitle,publishedAt,categoryId,thumbnails(default,medium,high,standard,maxres)),statistics(viewCount,likeCount),contentDetails(duration))'

export function normalizeVideo(video) {
  const snippet = video.snippet || {}
  const statistics = video.statistics || {}
  const thumbnailSet = snippet.thumbnails || {}
  const thumbnail = thumbnailSet.maxres || thumbnailSet.standard || thumbnailSet.high ||
    thumbnailSet.medium || thumbnailSet.default
  const id = typeof video.id === 'string' ? video.id : video.id?.videoId
  const duration = video.contentDetails?.duration || ''
  const viewCount = statistics.viewCount == null ? null : Number(statistics.viewCount)

  return {
    id,
    title: snippet.title || 'Untitled video',
    description: snippet.description || '',
    thumbnail: thumbnail?.url || '',
    channelId: snippet.channelId || '',
    channel: snippet.channelTitle || 'Unknown channel',
    channelAvatar: '',
    publishedAt: snippet.publishedAt || '',
    published: formatDate(snippet.publishedAt),
    viewCount,
    views: viewCount == null ? 'Views unavailable' : formatViews(viewCount),
    likeCount: statistics.likeCount == null ? null : Number(statistics.likeCount),
    duration,
    durationLabel: formatDuration(duration),
    categoryId: snippet.categoryId || '',
    videoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id || '')}`,
  }
}

function mapVideoPage(response) {
  return {
    items: (response.items || []).map(normalizeVideo).filter((video) => video.id),
    nextPageToken: response.nextPageToken || null,
    prevPageToken: response.prevPageToken || null,
    totalResults: response.pageInfo?.totalResults || 0,
  }
}

async function addChannelAvatars(videos, signal) {
  const avatars = await getChannelAvatars(videos.map((video) => video.channelId), { signal })
  return videos.map((video) => ({ ...video, channelAvatar: avatars.get(video.channelId) || '' }))
}

export async function getMostPopularVideos({
  regionCode,
  categoryId,
  pageToken,
  maxResults = 24,
  signal,
} = {}) {
  const response = await youtubeRequest('videos', {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode,
    videoCategoryId: categoryId || undefined,
    pageToken,
    maxResults,
    fields: VIDEO_FIELDS,
  }, { signal })
  const page = mapVideoPage(response)
  return { ...page, items: await addChannelAvatars(page.items, signal) }
}

export async function getVideosByIds(ids, { signal } = {}) {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 50)
  if (!uniqueIds.length) return []

  const response = await youtubeRequest('videos', {
    part: 'snippet,statistics,contentDetails',
    id: uniqueIds.join(','),
    fields: 'items(id,snippet(title,description,channelId,channelTitle,publishedAt,categoryId,thumbnails(default,medium,high,standard,maxres)),statistics(viewCount,likeCount),contentDetails(duration))',
  }, { signal })
  const videosById = new Map((response.items || []).map((video) => [video.id, normalizeVideo(video)]))
  const videos = uniqueIds.map((id) => videosById.get(id)).filter(Boolean)
  return addChannelAvatars(videos, signal)
}

export async function getVideosFromPlaylistPage(playlistPage, { signal } = {}) {
  const ids = (playlistPage.items || [])
    .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean)
  const items = await getVideosByIds(ids, { signal })
  return {
    items,
    nextPageToken: playlistPage.nextPageToken || null,
    prevPageToken: playlistPage.prevPageToken || null,
    totalResults: playlistPage.pageInfo?.totalResults || 0,
  }
}
