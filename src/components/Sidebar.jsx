import { CarFront, Film, Gamepad2, Home, Laptop, Music2, Newspaper, Trophy, X } from 'lucide-react'
import { VIDEO_CATEGORIES } from '../data/categories'

const categoryItems = [
  { name: 'Home', icon: Home },
  ...VIDEO_CATEGORIES.map((category) => ({
    name: category.name,
    icon: {
      Gaming: Gamepad2,
      Automobiles: CarFront,
      Sports: Trophy,
      Entertainment: Film,
      Technology: Laptop,
      Music: Music2,
      Blogs: Newspaper,
      News: Newspaper,
    }[category.name],
  })),
]

export default function Sidebar({ category, setCategory, compact, open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-overlay" onClick={onClose} aria-label="Close sidebar" />}
      <aside className={`sidebar ${compact ? 'compact' : ''} ${open ? 'open' : ''}`}>
        <button className="drawer-close" onClick={onClose} aria-label="Close sidebar"><X size={20} /></button>
        <nav className="category-list">
          {categoryItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`category-item ${category === name ? 'active' : ''}`}
              onClick={() => { setCategory(name); onClose() }}
              title={compact ? name : undefined}
            >
              <Icon size={18} strokeWidth={category === name ? 2.4 : 2} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        {!compact && (
          <section className="subscriptions">
            <h3>SUBSCRIPTIONS</h3>
            <p className="sidebar-note">Sign in with Google to view your subscriptions.</p>
          </section>
        )}
      </aside>
    </>
  )
}
