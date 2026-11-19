import CategoryHeader from '../components/CategoryHeader'
import VideoGrid from '../components/VideoGrid'
import useCategoryVideos from '../hooks/useCategoryVideos'

export default function Home({ categories, categoriesLoading, category, search }) {
  const feed = useCategoryVideos({ category, search, categories, categoriesLoading })

  return (
    <main className="main-content">
      <CategoryHeader category={category} />
      {feed.searchTooShort && (
        <p className="search-hint">Enter at least 2 characters to search YouTube videos.</p>
      )}
      <VideoGrid
        videos={feed.videos}
        loading={feed.loading}
        loadingPage={feed.loadingMore}
        error={feed.error}
        hasMore={feed.hasMore}
        onNext={feed.loadMore}
        onRetry={feed.retry}
        emptyTitle={search ? 'No videos found' : 'No public videos available'}
        emptyMessage={search
          ? 'Try another search phrase.'
          : 'YouTube did not return videos for this category.'}
      />
    </main>
  )
}
