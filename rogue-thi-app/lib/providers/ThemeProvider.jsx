import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import themes from '../../data/themes.json'
import useMediaQuery from '@restart/hooks/useMediaQuery'
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
  const mediaQueryDark = useMediaQuery('(prefers-color-scheme: dark)')
  const router = useRouter()
  const [theme, setTheme] = useState('default')
  const [themeColor, setThemeColor] = useState(undefined)

  const systemTheme = useMemo(() => {
    return mediaQueryDark ? 'dark' : 'light'
  }, [mediaQueryDark])

  // Update the theme color and theme when the user changes dark/light mode
  useEffect(() => {
    if (theme === 'default') {
      if (mediaQueryDark) {
        setThemeColor(DARK)
        setTheme('default')
      } else {
        setThemeColor(LIGHT)
        setTheme('default')
      }
    }
  }, [mediaQueryDark, theme])

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
      retro: '#121212',
      barbie: '#d44e95',
      hacker: '#0ae40a',
      pride: prideColors[today.getDay() % prideColors.length],
      blue: '#005ea1',
      95: '#008080',
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

  const mapTheme = useMemo(() => {
    const mode = themes.find((x) => x.style === theme)?.mapTheme

    return mode === 'system' ? systemTheme : theme
  }, [theme, systemTheme])

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
