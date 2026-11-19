import { getCategoryByName } from '../data/categories'

export default function CategoryHeader({ category }) {
  const config = getCategoryByName(category)
  const title = category === 'Home' ? 'All' : category
  const description = config?.description || 'Explore popular videos on YouTube.'

  return (
    <header className="category-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}
