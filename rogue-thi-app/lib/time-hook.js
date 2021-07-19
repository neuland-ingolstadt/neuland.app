import { useEffect, useState } from 'react'

/**
 * A React Hook that supplies the current date and time and updates every minute
 */
export function useTime () {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  return time
}
