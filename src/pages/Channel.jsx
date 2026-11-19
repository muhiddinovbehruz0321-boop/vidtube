import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import VideoGrid from '../components/VideoGrid'
import useYouTube from '../hooks/useYouTube'
import { getChannelById, getChannelVideos } from '../services/youtubeChannels'
import { formatCount } from '../utils/formatViews'

export default function Channel() {
  const { channelId } = useParams()
  const [page, setPage] = useState({ channelId: '', token: '' })
  const [retryCount, setRetryCount] = useState(0)
  const loadChannel = useCallback((signal) => getChannelById(channelId, { signal }), [channelId])
  const channelState = useYouTube(`channel:${channelId}:${retryCount}`, loadChannel)
  const channel = channelState.data
  const pageToken = page.channelId === channelId ? page.token : ''
  const loadVideos = useCallback((signal) => {
    if (!channel?.uploadsPlaylistId) return Promise.resolve({ items: [], nextPageToken: null })
    return getChannelVideos(channel.uploadsPlaylistId, { pageToken, maxResults: 12, signal })
  }, [channel, pageToken])
  const videosState = useYouTube(channel ? `channel-videos:${channelId}:${pageToken}` : null, loadVideos)

  if (channelState.loading) return <PageState title="Loading channel" loading />
  if (channelState.error) {
    return <PageState title="Channel could not be loaded" error={channelState.error} onRetry={() => setRetryCount((count) => count + 1)} />
  }
  if (!channel) return <PageState title="Channel not found" error={{ message: 'This public channel could not be found.' }} />

  return (
    <main className="main-content channel-page">
      {channel.banner && <div className="channel-banner" style={{ backgroundImage: `url("${channel.banner}")` }} />}
      <header className="channel-header">
        {channel.avatar && <img className="channel-avatar" src={channel.avatar} alt="" />}
        <div>
          <h1>{channel.title}</h1>
          <p>{channel.customUrl && `${channel.customUrl} · `}
            {channel.subscriberCount == null ? 'Subscribers hidden' : `${formatCount(channel.subscriberCount)} subscribers`}
            {' · '}{formatCount(channel.viewCount)} views · {formatCount(channel.videoCount)} videos</p>
        </div>
      </header>
      {channel.description && <p className="channel-description">{channel.description}</p>}
      <VideoGrid
        videos={videosState.data?.items || []}
        loading={videosState.loading}
        error={videosState.error}
        hasMore={Boolean(videosState.data?.nextPageToken)}
        canGoBack={Boolean(videosState.data?.prevPageToken)}
        loadingPage={videosState.loading}
        onNext={() => setPage({ channelId, token: videosState.data?.nextPageToken || '' })}
        onPrevious={() => setPage({ channelId, token: videosState.data?.prevPageToken || '' })}
        onRetry={() => setRetryCount((count) => count + 1)}
        emptyTitle="No public videos"
        emptyMessage="This channel has no public uploads available."
      />
    </main>
  )
}
