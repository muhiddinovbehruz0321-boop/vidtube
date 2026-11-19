export const VIDEO_CATEGORIES = [
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Explore gaming videos from YouTube.',
    apiTitles: ['gaming'],
    fallbackQueries: ['gaming gameplay', 'game videos'],
  },
  {
    name: 'Automobiles',
    slug: 'automobiles',
    description: 'Discover cars, supercars, and automobile reviews.',
    apiTitles: ['autos & vehicles'],
    fallbackQueries: ['cars', 'supercars', 'automobile reviews'],
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Explore sports highlights and coverage.',
    apiTitles: ['sports'],
    fallbackQueries: ['sports highlights', 'football', 'sports'],
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Find trailers, shows, and entertainment videos.',
    apiTitles: ['entertainment'],
    fallbackQueries: ['entertainment', 'trailers', 'shows'],
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Explore technology, gadgets, and innovation.',
    apiTitles: ['science & technology'],
    fallbackQueries: ['technology', 'gadgets', 'programming'],
  },
  {
    name: 'Music',
    slug: 'music',
    description: 'Discover music videos and official releases.',
    apiTitles: ['music'],
    fallbackQueries: ['music videos', 'official music'],
  },
  {
    name: 'Blogs',
    slug: 'blogs',
    description: 'Explore vlogs, lifestyle, and creator stories.',
    apiTitles: ['people & blogs'],
    fallbackQueries: ['vlogs', 'lifestyle', 'people blogs'],
  },
  {
    name: 'News',
    slug: 'news',
    description: 'Explore the latest news and reports.',
    apiTitles: ['news & politics'],
    fallbackQueries: ['latest news', 'news reports'],
  },
]

export function getCategoryBySlug(slug) {
  return VIDEO_CATEGORIES.find((category) => category.slug === slug) || null
}

export function getCategoryByName(name) {
  return VIDEO_CATEGORIES.find((category) => category.name === name) || null
}

export function resolveVideoCategoryId(categoryName, apiCategories = []) {
  const category = getCategoryByName(categoryName)
  if (!category) return null
  const match = apiCategories.find((item) =>
    item.assignable && category.apiTitles.includes(item.title.toLowerCase()),
  )
  return match?.id ?? null
}

export function categoryNameFromSlug(slug) {
  return getCategoryBySlug(slug)?.name || 'Home'
}
