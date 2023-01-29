import { useEffect, useState } from 'react'

/**
 * React Hook that continuously provides the users current location.
 */
export function useLocation () {
  const [location, setLocation] = useState(undefined)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported')
      return
    }

    const watch = navigator.geolocation.watchPosition(position => {
      setLocation(position.coords)
    }, err => {
      console.error(err)
    })

    return () => {
      navigator.geolocation.clearWatch(watch)
    }
  }, [])

  return location
}
