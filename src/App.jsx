import { useCallback, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Watch from './pages/Watch'
import Channel from './pages/Channel'
import Playlist from './pages/Playlist'
import CategoryPage from './pages/CategoryPage'
import { getVideoCategories } from './services/youtubeCategories'
import { categoryNameFromSlug, getCategoryByName } from './data/categories'
import useYouTube from './hooks/useYouTube'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchFromUrl = new URLSearchParams(location.search).get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(() => ({
    locationSearch: location.search,
    value: searchFromUrl,
  }))
  const search = searchDraft.locationSearch === location.search
    ? searchDraft.value
    : searchFromUrl
  const setSearch = (value) => setSearchDraft({ locationSearch: location.search, value })
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const loadCategories = useCallback((signal) => getVideoCategories({ regionCode: 'UZ', signal }), [])
  const isFeedRoute = location.pathname === '/' || /^\/category\/[^/]+$/.test(location.pathname)
  const categoryState = useYouTube(isFeedRoute ? 'video-categories:UZ' : null, loadCategories)
  const categories = categoryState.data || []
  const categoryMatch = location.pathname.match(/^\/category\/([^/]+)$/)
  const category = categoryMatch ? categoryNameFromSlug(categoryMatch[1]) : 'Home'
  const hideSidebar = location.pathname.startsWith('/watch/')
  const selectCategory = (value) => {
    const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
    const path = value === 'Home'
      ? '/'
      : `/category/${getCategoryByName(value).slug}`
    navigate(`${path}${query}`)
  }

  return (
    <div className="app-shell">
      <Header
        search={search}
        setSearch={setSearch}
        onMenu={() => window.innerWidth <= 760
          ? setDrawerOpen((value) => !value)
          : setSidebarCompact((value) => !value)}
      />
      {!hideSidebar && (
        <Sidebar
          category={category}
          setCategory={selectCategory}
          compact={sidebarCompact}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={<Home categories={categories} categoriesLoading={categoryState.loading} category="Home" search={search} />}
        />
        <Route
          path="/category/:categorySlug"
          element={<CategoryPage categories={categories} categoriesLoading={categoryState.loading} search={search} />}
        />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/channel/:channelId" element={<Channel />} />
        <Route path="/playlist/:playlistId" element={<Playlist />} />
        <Route path="*" element={<div className="main-content"><h1>Page not found</h1></div>} />
      </Routes>
    </div>
  )
}

export default App
