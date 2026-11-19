import { Bell, Grid3X3, Menu, Mic, Search, Video, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Header({ search, setSearch, onMenu }) {
  const navigate = useNavigate()
  const location = useLocation()
  const searchPath = location.pathname.startsWith('/category/') ? location.pathname : '/'
  const submitSearch = () => {
    const query = search.trim()
    navigate(query ? `${searchPath}?q=${encodeURIComponent(query)}` : searchPath)
  }
  const clearSearch = () => {
    setSearch('')
    navigate(searchPath)
  }

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Toggle menu"><Menu size={21} /></button>
        <button className="brand" onClick={() => navigate('/')} aria-label="VidTube home">
          <span className="brand-mark"><span /></span>
          <span>VidTube</span>
        </button>
      </div>

      <div className="header-center">
        <div className="search-wrap">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSearch()
            }}
            placeholder="Search"
            aria-label="Search"
          />
          {search && (
            <button className="clear-search" onClick={clearSearch} aria-label="Clear search"><X size={17} /></button>
          )}
          <button className="search-button" onClick={submitSearch} aria-label="Search"><Search size={19} /></button>
        </div>
        <button className="icon-button mic-button" aria-label="Voice search"><Mic size={17} /></button>
      </div>

      <div className="header-right">
        <button className="icon-button desktop-action" aria-label="Create video"><Video size={19} /></button>
        <button className="icon-button desktop-action" aria-label="Apps"><Grid3X3 size={18} /></button>
        <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
        <button className="avatar-button" aria-label="Account"><img src="https://i.pravatar.cc/80?img=47" alt="Your profile" /></button>
      </div>
    </header>
  )
}
