export function formatDuration(value = '') {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return ''

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const parts = hours
    ? [hours, String(minutes).padStart(2, '0'), String(seconds).padStart(2, '0')]
    : [minutes, String(seconds).padStart(2, '0')]
  return parts.join(':')
}
