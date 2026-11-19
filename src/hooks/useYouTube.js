import { useEffect, useState } from 'react'

export default function useYouTube(key, loader) {
  const [state, setState] = useState(null)

  useEffect(() => {
    if (!key || !loader) return undefined

    const controller = new AbortController()
    loader(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data, error: null })
      },
      (error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setState({ key, data: null, error })
        }
      },
    )
    return () => controller.abort()
  }, [key, loader])

  const current = Boolean(key) && state?.key === key
  return {
    data: current ? state.data : null,
    previousData: state?.data || null,
    error: current ? state.error : null,
    loading: Boolean(key) && !current,
  }
}
