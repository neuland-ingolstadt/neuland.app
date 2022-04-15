import { Capacitor } from '@capacitor/core'

export function saveTheme (theme) {
  if (Capacitor.isNativePlatform()) {
    // in capacitor, save it in localStorage since cookies are not supported
    localStorage.theme = theme
  } else {
    // in the web version, save it as a cookie so that we can include the theme in SSR
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years in the future
    document.cookie = `theme=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`
  }
}

export function loadTheme (req) {
  if (Capacitor.isNativePlatform()) {
    return localStorage.theme
  } else {
    let cookie
    if (typeof req !== 'undefined') {
      cookie = req.headers.cookie
    } else if (typeof document !== 'undefined') {
      cookie = document.cookie
    }

    if (!cookie) {
      return 'default'
    }

    const entry = cookie.split(';').find(x => x.trim().startsWith('theme='))
    if (!entry) {
      return 'default'
    }

    return entry.split('=')[1]
  }
}
