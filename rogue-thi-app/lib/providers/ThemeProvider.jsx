import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import themes from '../../data/themes.json'
import { useRouter } from 'next/router'

const LIGHT = '#ffffff'
const DARK = '#202020'

const initialState = {
  theme: 'default',
  setTheme: () => {},
  themeColor: undefined,
  setThemeColor: () => {},
  mapTheme: 'light',
}

const ThemeContext = createContext(initialState)

export default function ThemeProvider({ children }) {
  const router = useRouter()
  const [systemTheme, setSystemTheme] = useState('light')
  const [theme, setTheme] = useState('default')
  const [themeColor, setThemeColor] = useState(undefined)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Update the theme color and theme when the user changes dark/light mode
  useEffect(() => {
    if (theme === 'default') {
      if (systemTheme === 'dark') {
        setThemeColor(DARK)
        setTheme('default')
      } else {
        setThemeColor(LIGHT)
        setTheme('default')
      }
    }
  }, [systemTheme, theme])

  // Update the theme color when the user changes the theme
  useEffect(() => {
    const prideColors = [
      '#b61616',
      '#ff8c00',
      '#ffdb3b',
      '#019d30',
      '#0b68ea',
      '#8845ef',
    ]
    const today = new Date()
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const isDarkMode = mediaQuery.matches

    const themeColors = {
      light: LIGHT,
      dark: DARK,
      hacker: '#0ae40a',
      pride: prideColors[today.getDay() % prideColors.length],
      blue: '#005ea1',
    }
    const selectedThemeColor = themeColors[theme] || (isDarkMode ? DARK : LIGHT)
    setThemeColor(selectedThemeColor)
  }, [theme])

  useEffect(() => {
    const theme = localStorage.theme
    if (theme && themes.find((x) => x.style === theme)) {
      setTheme(theme)
    }
  }, [])

  const computedTheme = useMemo(() => {
    if (router.pathname === '/become-hackerman') {
      return 'hacker'
    } else {
      return theme
    }
  }, [theme, router.pathname])

  const [mapTheme, setMapTheme] = useState('light')
  useEffect(() => {
    const mode = themes.find((x) => x.style === theme)?.mapTheme

    if (mode === 'system') {
      setMapTheme(systemTheme)
    } else {
      setMapTheme(mode)
    }
  }, [systemTheme, theme])

  const value = {
    theme: computedTheme,
    setTheme,
    themeColor,
    setThemeColor,
    mapTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
