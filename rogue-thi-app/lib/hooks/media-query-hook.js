import { useEffect, useState } from 'react'

/**
 * React Hook that checks whether a CSS media query matches.
 */
export function useMediaQuery (query) {
  const [matches, setMatches] = useState(undefined)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const listener = () => setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}
