import { useCallback, useState } from 'react'
import { getCategoryByName, resolveVideoCategoryId } from '../data/categories'
import useDebouncedValue from './useDebouncedValue'
import useYouTube from './useYouTube'
import { getCategoryVideos } from '../services/youtubeFeed'

export default function useCategoryVideos({
  category,
  search,
  categories,
  categoriesLoading,
  regionCode = 'UZ',
}) {
  const query = search.trim()
  const debouncedQuery = useDebouncedValue(query)
  const [pagination, setPagination] = useState({ feedKey: '', token: '' })
  const [retryCount, setRetryCount] = useState(0)
  const categoryConfig = getCategoryByName(category)
  const categoryId = category === 'Home' ? null : resolveVideoCategoryId(category, categories)
  const feedKey = JSON.stringify([category, debouncedQuery.toLowerCase(), regionCode])
  const pageToken = pagination.feedKey === feedKey ? pagination.token : ''
  const debouncing = query !== debouncedQuery
  const categoryLoading = category !== 'Home' && categoriesLoading
  const searchTooShort = query.length > 0 && query.length < 2
  const canLoad = Boolean(categoryConfig || category === 'Home') &&
    !categoryLoading && !debouncing && !searchTooShort
  const requestKey = canLoad ? `${feedKey}:page:${pageToken}:retry:${retryCount}` : null
  const loadPage = useCallback((signal) => getCategoryVideos({
    categoryName: category,
    categoryId,
    fallbackQueries: categoryConfig?.fallbackQueries || [],
    query: debouncedQuery,
    pageToken,
    fallbackQuery: pagination.feedKey === feedKey ? pagination.fallbackQuery : '',
    previousItems: pagination.feedKey === feedKey ? pagination.items : [],
    regionCode,
    signal,
  }), [category, categoryConfig, categoryId, debouncedQuery, feedKey, pageToken, pagination.fallbackQuery, pagination.feedKey, pagination.items, regionCode])
  const result = useYouTube(requestKey, loadPage)
  const previousPage = pageToken ? result.previousData : null
  const videos = result.data?.items || previousPage?.items || []
  const error = result.error || (!categoryConfig && category !== 'Home'
    ? new Error('This category is not supported.')
    : null)

  return {
    videos,
    error,
    loading: categoryLoading || debouncing || result.loading,
    loadingMore: Boolean(pageToken && result.loading),
    hasMore: Boolean((result.data || previousPage)?.nextPageToken),
    searchTooShort,
    loadMore: () => {
      const token = result.data?.nextPageToken
      if (token) {
        setPagination({
          feedKey,
          token,
          items: videos,
          fallbackQuery: result.data?.fallbackQuery || '',
        })
      }
    },
    retry: () => setRetryCount((count) => count + 1),
  }
}
