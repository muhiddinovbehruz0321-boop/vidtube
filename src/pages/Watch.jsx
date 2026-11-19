import { useCallback, useState } from 'react'
import { Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import VideoGrid from '../components/VideoGrid'
import useYouTube from '../hooks/useYouTube'
import { getChannelById } from '../services/youtubeChannels'
import { searchYouTubeVideos } from '../services/youtubeSearch'
import { getVideosByIds } from '../services/youtubeVideos'
import { formatCount } from '../utils/formatViews'

export default function Watch() {
  const { id } = useParams()
  const [notice, setNotice] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const loadVideo = useCallback((signal) => getVideosByIds([id], { signal }), [id])
  const videoState = useYouTube(`video:${id}:${retryCount}`, loadVideo)
  const video = videoState.data?.[0]
  const loadChannel = useCallback((signal) => getChannelById(video?.channelId, { signal }), [video?.channelId])
  const channelState = useYouTube(video?.channelId ? `channel:${video.channelId}` : null, loadChannel)
  const loadRelated = useCallback((signal) => searchYouTubeVideos(video?.title || '', {
    maxResults: 12,
    signal,
  }), [video?.title])
  const relatedState = useYouTube(video ? `related:${video.id}` : null, loadRelated)
  const related = (relatedState.data?.items || []).filter((item) => item.id !== id).slice(0, 8)

  const retry = () => setRetryCount((count) => count + 1)
  const requireOAuth = (action) => {
    setNotice(`${action} requires Google OAuth sign-in. This public API-key experience does not change account data.`)
  }

  const shareVideo = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url: video.videoUrl })
      } else {
        await navigator.clipboard.writeText(video.videoUrl)
        setNotice('Video link copied.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') setNotice('Could not share this video from the current browser.')
    }
  }

  if (videoState.loading) return <PageState title="Loading video" loading />
  if (videoState.error) return <PageState title="Video could not be loaded" error={videoState.error} onRetry={retry} />
  if (!video) return <PageState title="Video not found or unavailable" error={{ message: 'This video may be private, removed, or unavailable in your region.' }} />

  const channel = channelState.data
  const playerUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=0&controls=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`

  return (
    <main className="main-content watch-page">
      <section className="watch-main">
        <div className="player-wrap">
          <iframe
            src={playerUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <h1 className="watch-title">{video.title}</h1>
        <div className="watch-actions">
          <div className="channel-info">
            {channel?.avatar && <img src={channel.avatar} alt="" />}
            <div>
              <Link to={`/channel/${video.channelId}`} className="channel-name-link">{video.channel}</Link>
              <span>{channel
                ? channel.subscriberCount == null ? 'Subscriber count hidden' : `${formatCount(channel.subscriberCount)} subscribers`
                : 'Channel information unavailable'}</span>
            </div>
            <button className="subscribe" onClick={() => requireOAuth('Subscribing')}>Subscribe</button>
          </div>
          <div className="action-buttons">
            <button onClick={() => requireOAuth('Liking')} aria-label="Like video"><ThumbsUp size={18} /> {video.likeCount == null ? 'Like' : formatCount(video.likeCount)}</button>
            <button onClick={() => requireOAuth('Rating')} aria-label="Dislike video"><ThumbsDown size={18} /></button>
            <button onClick={shareVideo}><Share2 size={18} /> Share</button>
          </div>
        </div>
        {notice && <p className="watch-message" role="status">{notice}</p>}
        <div className="description">
          <strong>{video.views} · {video.published}</strong>
          <p>{video.description || 'No description provided.'}</p>
        </div>
      </section>
      <aside className="related-videos">
        <h2 className="related-heading">Related videos</h2>
        {relatedState.error
          ? <p className="inline-error" role="alert">{relatedState.error.message}</p>
          : <VideoGrid
            videos={related}
            loading={relatedState.loading}
            error={null}
            emptyTitle="No related videos found"
            emptyMessage="YouTube did not return related results."
          />}
      </aside>
    </main>
  )
}
