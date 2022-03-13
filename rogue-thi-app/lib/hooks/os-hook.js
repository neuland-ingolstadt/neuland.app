import { useEffect, useState } from 'react'

export const OS_ANDROID = 'android'
export const OS_IOS = 'ios'
export const OS_OTHER = 'other'

function getOperatingSystem () {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return OS_IOS
  } else if (/Android/.test(navigator.userAgent)) {
    return OS_ANDROID
  } else {
    return OS_OTHER
  }
}

export function useOperatingSystem () {
  const [os, setOS] = useState(OS_OTHER)
  useEffect(() => {
    setOS(getOperatingSystem())
  }, [])
  return os
}
