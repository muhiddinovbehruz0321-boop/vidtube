import { getCategoryByName } from '../data/categories'
import { searchYouTubeVideos } from './youtubeSearch'
import { getMostPopularVideos } from './youtubeVideos'

const feedCollections = new Map()
const FEED_COLLECTION_TTL = 5 * 60 * 1000

function pruneFeedCollections() {
  const now = Date.now()
  for (const [key, collection] of feedCollections) {
    if (collection.expiresAt <= now) feedCollections.delete(key)
  }
  while (feedCollections.size > 64) {
    feedCollections.delete(feedCollections.keys().next().value)
  }
}

async function searchFallbackTerms(terms, options, pageQuery = '') {
  let lastResult = { items: [], nextPageToken: null, prevPageToken: null, totalResults: 0 }
  const searchTerms = pageQuery ? [pageQuery] : terms
  for (const term of searchTerms) {
    lastResult = await searchYouTubeVideos(term, { ...options, videoCategoryId: undefined })
    if (lastResult.items.length || options.pageToken) {
      return { ...lastResult, fallbackQuery: term }
    }
  }
  return lastResult
}

export async function getCategoryVideos({
  categoryName = 'Home',
  categoryId,
  fallbackQueries = [],
  query = '',
  pageToken,
  previousItems = [],
  fallbackQuery = '',
  regionCode = 'UZ',
  signal,
} = {}) {
  pruneFeedCollections()
  const config = categoryName === 'Home' ? null : getCategoryByName(categoryName)
  const normalizedQuery = query.trim()
  const feedKey = JSON.stringify([categoryName, normalizedQuery.toLowerCase(), regionCode])
  const previousCollection = feedCollections.get(feedKey)
  const reusableFallbackQuery = pageToken && previousCollection?.expiresAt > Date.now()
    ? previousCollection.fallbackQuery
    : fallbackQuery
  let page

  if (normalizedQuery) {
    if (categoryName === 'Home' || categoryId) {
      page = await searchYouTubeVideos(normalizedQuery, {
        videoCategoryId: categoryId || undefined,
        pageToken,
        maxResults: 20,
        regionCode,
        relevanceLanguage: 'uz',
        order: 'relevance',
        signal,
      })
    } else {
      const terms = fallbackQueries.map((term) => `${normalizedQuery} ${term}`)
      page = await searchFallbackTerms(terms, {
        pageToken,
        maxResults: 20,
        regionCode,
        relevanceLanguage: 'uz',
        order: 'relevance',
        signal,
      }, reusableFallbackQuery)
    }
  } else if (categoryName === 'Home') {
    page = await getMostPopularVideos({ pageToken, maxResults: 20, signal })
  } else if (categoryId) {
    page = await getMostPopularVideos({ categoryId, pageToken, maxResults: 20, signal })
  } else if (config?.fallbackQueries.length) {
    page = await searchFallbackTerms(config.fallbackQueries, {
      pageToken,
      maxResults: 20,
      regionCode,
      relevanceLanguage: 'uz',
      order: 'relevance',
      signal,
    }, reusableFallbackQuery)
  } else {
    return { items: [], nextPageToken: null, prevPageToken: null, totalResults: 0 }
  }

  const cachedItems = pageToken && previousCollection?.expiresAt > Date.now()
    ? previousCollection.items
    : []
  const uniqueItems = new Map(
    (pageToken ? [...previousItems, ...cachedItems] : []).map((video) => [video.id, video]),
  )
  for (const video of page.items) uniqueItems.set(video.id, video)
  const result = { ...page, items: [...uniqueItems.values()] }
  feedCollections.set(feedKey, { ...result, expiresAt: Date.now() + FEED_COLLECTION_TTL })
  return result
}
