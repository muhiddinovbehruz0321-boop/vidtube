export default function PageState({ title, loading, error, onRetry }) {
  if (loading) {
    return (
      <main className="main-content page-state" aria-live="polite">
        <div className="page-loading" />
        <p>Loading from YouTube…</p>
      </main>
    )
  }

  return (
    <main className="main-content page-state" role={error ? 'alert' : undefined}>
      <h1>{title}</h1>
      {error && <p>{error.message}</p>}
      {onRetry && <button className="state-button" onClick={onRetry}>Try again</button>}
    </main>
  )
}
