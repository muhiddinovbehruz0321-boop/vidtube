const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const unit = units.find(([, size]) => Math.abs(seconds) >= size)
  if (!unit) return relativeTime.format(seconds, 'second')
  return relativeTime.format(Math.round(seconds / unit[1]), unit[0])
}
