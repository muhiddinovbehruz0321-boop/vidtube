const compactNumber = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCount(value) {
  const count = Number(value)
  return Number.isFinite(count) ? compactNumber.format(count) : 'Unavailable'
}

export function formatViews(value) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 'Views unavailable'
  return `${formatCount(count)} views`
}
