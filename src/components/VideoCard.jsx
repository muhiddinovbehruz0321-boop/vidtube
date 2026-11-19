import { useNavigate } from 'react-router-dom'

export default function VideoCard({ video }) {
  const navigate = useNavigate()
  return (
    <article className="video-card">
      <button className="thumbnail-button" onClick={() => navigate(`/watch/${video.id}`)} aria-label={`Watch ${video.title}`}>
        <img src={video.thumbnail} alt="" loading="lazy" />
        {video.durationLabel && <span className="duration-badge">{video.durationLabel}</span>}
      </button>
      <div className="video-details">
        <h2>
          <button className="video-title-button" onClick={() => navigate(`/watch/${video.id}`)}>
            {video.title}
          </button>
        </h2>
        <div className="channel-row">
          {video.channelAvatar && <img className="video-channel-avatar" src={video.channelAvatar} alt="" loading="lazy" />}
          {video.channelId
            ? <button className="channel-link" onClick={() => navigate(`/channel/${video.channelId}`)}>{video.channel}</button>
            : <span className="channel-link">{video.channel}</span>}
        </div>
        <p className="video-meta">{video.views} · {video.published}</p>
      </div>
    </article>
  )
}
