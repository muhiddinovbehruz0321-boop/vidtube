import VideoCard from './VideoCard'

function SkeletonCard() {
  return (
    <div className="video-skeleton" aria-hidden="true">
      <div className="skeleton-thumbnail" />
      <div className="skeleton-line title" />
      <div className="skeleton-line title-short" />
      <div className="skeleton-channel">
        <div className="skeleton-avatar" />
        <div className="skeleton-line channel" />
      </div>
      <div className="skeleton-line metadata" />
    </div>
  )
}

export default function VideoGrid({
  videos = [],
  loading,
  error,
  hasMore,
  canGoBack,
  loadingPage,
  onNext,
  onPrevious,
  onRetry,
  emptyTitle = 'No videos found',
  emptyMessage = 'Try a different search or category.',
}) {
  if (loading && !videos.length) {
    return <div className="video-grid">{Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}</div>
  }

  if (error && !videos.length) {
    return (
      <div className="api-state error-state" role="alert">
        <h2>Videos could not be loaded</h2>
        <p>{error.message}</p>
        <button className="state-button" onClick={onRetry}>Try again</button>
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="api-state empty-state">
        <h2>{emptyTitle}</h2>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="video-grid">
        {videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
      {error && <p className="inline-error" role="alert">{error.message}</p>}
      {(hasMore || canGoBack) && (
        <div className="pagination">
          {canGoBack && <button className="state-button" onClick={onPrevious} disabled={loadingPage}>Previous</button>}
          {hasMore && <button className="state-button" onClick={onNext} disabled={loadingPage}>
            {loadingPage ? 'Loading…' : 'Load more'}
          </button>}
        </div>
      )}
    </>
  )
}
