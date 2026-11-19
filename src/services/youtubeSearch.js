import { youtubeRequest } from './youtubeApi'
import { getVideosByIds } from './youtubeVideos'

const SEARCH_FIELDS = 'nextPageToken,prevPageToken,pageInfo(totalResults,resultsPerPage),items(id/videoId,snippet(title,description,channelId,channelTitle,publishedAt,thumbnails(default,medium,high)))'

export async function searchYouTubeVideos(query, {
  pageToken,
  maxResults = 20,
  order = 'relevance',
  regionCode = 'UZ',
  relevanceLanguage = 'uz',
  videoCategoryId,
  signal,
} = {}) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    return { items: [], nextPageToken: null, prevPageToken: null, totalResults: 0 }
  }

  const response = await youtubeRequest('search', {
    part: 'snippet',
    type: 'video',
    q: normalizedQuery,
    maxResults: Math.min(maxResults, 20),
    order,
    regionCode,
    relevanceLanguage,
    videoCategoryId,
    pageToken,
    fields: SEARCH_FIELDS,
  }, { signal })

  const ids = (response.items || []).map((item) => item.id?.videoId).filter(Boolean)
  const items = await getVideosByIds(ids, { signal })
  return {
    items,
    nextPageToken: response.nextPageToken || null,
    prevPageToken: response.prevPageToken || null,
    totalResults: response.pageInfo?.totalResults || 0,
  }
}
