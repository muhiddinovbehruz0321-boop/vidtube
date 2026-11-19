import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import VideoGrid from '../components/VideoGrid'
import useYouTube from '../hooks/useYouTube'
import { getPlaylistById, getPlaylistVideos } from '../services/youtubePlaylists'
import { formatDate } from '../utils/formatDate'

export default function Playlist() {
  const { playlistId } = useParams()
  const [page, setPage] = useState({ playlistId: '', token: '' })
  const [retryCount, setRetryCount] = useState(0)
  const loadPlaylist = useCallback((signal) => getPlaylistById(playlistId, { signal }), [playlistId])
  const playlistState = useYouTube(`playlist:${playlistId}:${retryCount}`, loadPlaylist)
  const playlist = playlistState.data
  const pageToken = page.playlistId === playlistId ? page.token : ''
  const loadVideos = useCallback((signal) => getPlaylistVideos(playlistId, {
    pageToken,
    maxResults: 12,
    signal,
  }), [pageToken, playlistId])
  const videosState = useYouTube(
    playlist ? `playlist-videos:${playlistId}:${pageToken}` : null,
    loadVideos,
  )

  if (playlistState.loading) return <PageState title="Loading playlist" loading />
  if (playlistState.error) {
    return <PageState title="Playlist could not be loaded" error={playlistState.error} onRetry={() => setRetryCount((count) => count + 1)} />
  }
  if (!playlist) return <PageState title="Playlist not found" error={{ message: 'This playlist may be private, removed, or unavailable.' }} />

  return (
    <main className="main-content playlist-page">
      <header className="playlist-header">
        {playlist.thumbnail && <img src={playlist.thumbnail} alt="" />}
        <div>
          <h1>{playlist.title}</h1>
          <p><Link to={`/channel/${playlist.channelId}`}>{playlist.channel}</Link>
            {' · '}{playlist.itemCount} videos · {formatDate(playlist.publishedAt)}</p>
          {playlist.description && <p>{playlist.description}</p>}
        </div>
      </header>
      <VideoGrid
        videos={videosState.data?.items || []}
        loading={videosState.loading}
        error={videosState.error}
        hasMore={Boolean(videosState.data?.nextPageToken)}
        canGoBack={Boolean(videosState.data?.prevPageToken)}
        loadingPage={videosState.loading}
        onNext={() => setPage({ playlistId, token: videosState.data?.nextPageToken || '' })}
        onPrevious={() => setPage({ playlistId, token: videosState.data?.prevPageToken || '' })}
        onRetry={() => setRetryCount((count) => count + 1)}
        emptyTitle="This playlist is empty"
        emptyMessage="No public playlist videos are available."
      />
    </main>
  )
}
