import { useEffect, useState } from 'react'

export const OS_ANDROID = 'android'
export const OS_IOS = 'ios'
export const OS_MACOS = 'macos'
export const OS_OTHER = 'other'

function getOperatingSystem() {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return OS_IOS
  } else if (/Mac/.test(navigator.userAgent)) {
    return OS_MACOS
  } else if (/Android/.test(navigator.userAgent)) {
    return OS_ANDROID
  } else {
    return OS_OTHER
  }
}

/**
 * React Hook that provides the users operating system.
 */
export function useOperatingSystem() {
  const [os, setOS] = useState(OS_OTHER)
  useEffect(() => {
    setOS(getOperatingSystem())
  }, [])
  return os
}
