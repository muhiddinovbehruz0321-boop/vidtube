import { useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import Home from './Home'
import { getCategoryBySlug } from '../data/categories'

export default function CategoryPage({ categories, categoriesLoading, search }) {
  const { categorySlug } = useParams()
  const category = getCategoryBySlug(categorySlug)

  if (!category) return <PageState title="Category not found" />

  return (
    <Home
      categories={categories}
      categoriesLoading={categoriesLoading}
      category={category.name}
      search={search}
    />
  )
}
