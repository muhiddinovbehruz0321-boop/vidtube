import { youtubeRequest } from './youtubeApi'

export async function getVideoCategories({ regionCode = 'UZ', signal } = {}) {
  const response = await youtubeRequest('videoCategories', {
    part: 'snippet',
    regionCode,
    fields: 'items(id,snippet(title,assignable))',
  }, { signal, cacheTtl: 24 * 60 * 60 * 1000 })

  return (response.items || [])
    .filter((category) => category.snippet?.assignable)
    .map((category) => ({
      id: category.id,
      title: category.snippet.title,
      assignable: category.snippet.assignable,
    }))
}
