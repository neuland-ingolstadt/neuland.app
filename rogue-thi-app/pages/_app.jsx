import { React, createContext, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { appWithTranslation } from 'next-i18next'

import PropTypes from 'prop-types'
import TheMatrixAnimation from './../components/TheMatrixAnimation'
import { useFoodFilter } from '../lib/hooks/food-filter'

import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'

import themes from '../data/themes.json'

import '../styles/globals.css'
import { useDashboard } from '../lib/hooks/dashboard'

export const ThemeContext = createContext('default')
export const FoodFilterContext = createContext(false)
export const ShowDashboardModal = createContext(false)
export const ShowPersonalDataModal = createContext(false)
export const ShowThemeModal = createContext(false)
export const DashboardContext = createContext({})
export const ShowLanguageModal = createContext(false)

config.autoAddCss = false

function MyApp ({ Component, pageProps }) {
  const router = useRouter()
  const [theme, setTheme] = useState('default')
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [showPersonalDataModal, setShowPersonalDataModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const foodFilter = useFoodFilter()
  const {
    shownDashboardEntries,
    hiddenDashboardEntries,
    moveDashboardEntry,
    hideDashboardEntry,
    bringBackDashboardEntry,
    resetOrder
  } = useDashboard()

  useEffect(() => {
    // migrate legacy cookie theme setting to localStorage
    // added 2022-04-15, can be removed later
    const entry = document.cookie.split(';').find(x => x.trim().startsWith('theme='))
    if (entry) {
      localStorage.theme = entry.split('=')[1]
      document.cookie = `theme=; expires=${new Date().toUTCString()}; path=/; SameSite=Strict; Secure`
    }

    const theme = localStorage.theme
    if (theme && themes.find(x => x.style === theme)) {
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

  return (
    <ShowLanguageModal.Provider value={[showLanguageModal, setShowLanguageModal]}>
      <ThemeContext.Provider value={[computedTheme, setTheme]}>
        <FoodFilterContext.Provider value={foodFilter}>
          <ShowDashboardModal.Provider value={[showDashboardModal, setShowDashboardModal]}>
            <ShowPersonalDataModal.Provider value={[showPersonalDataModal, setShowPersonalDataModal]}>
              <ShowThemeModal.Provider value={[showThemeModal, setShowThemeModal]}>
                <DashboardContext.Provider
                  value={{
                    shownDashboardEntries,
                    hiddenDashboardEntries,
                    moveDashboardEntry,
                    hideDashboardEntry,
                    bringBackDashboardEntry,
                    resetOrder
                  }}
                >

                  <Head>
                    <meta charSet="utf-8"/>
                    <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
                    <meta
                      name="viewport"
                      content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"
                    />
                    <meta name="description" content="Eine inoffizielle App für die Technische Hochschule Ingolstadt"/>
                    <meta name="keywords" content="THI, Technische Hochschule Ingolstadt, App"/>
                    <meta name="theme-color" content="#8845ef"/>

                    <link rel="manifest" href="/manifest.json"/>
                    <meta name="apple-mobile-web-app-status-bar-style" content="default"/>

                    {/* generated using npx pwa-asset-generator (run via Dockerfile) */}
                    <meta name="apple-mobile-web-app-capable" content="yes"/>
                    <link rel="apple-touch-icon" href="/apple-icon-180.png"/>
                    <link rel="icon" type="image/png" sizes="196x196" href="/favicon-196.png"/>
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2048-2732.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2732-2048.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1668-2388.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2388-1668.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1536-2048.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2048-1536.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1668-2224.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2224-1668.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1620-2160.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2160-1620.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1284-2778.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2778-1284.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1170-2532.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2532-1170.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1125-2436.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2436-1125.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1242-2688.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2688-1242.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-828-1792.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1792-828.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1242-2208.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-2208-1242.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-750-1334.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1334-750.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-640-1136.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    />
                    <link
                      rel="apple-touch-startup-image"
                      href="/apple-splash-dark-1136-640.jpg"
                      media="(prefers-color-scheme: dark) and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
                    />

                    <link rel="stylesheet" href={`/themes/${computedTheme}.css`}/>
                  </Head>

                  {computedTheme === 'hacker' && (
                    <div className="matrixBackground">
                      <TheMatrixAnimation/>
                    </div>
                  )}

                  <Component {...pageProps} />
                </DashboardContext.Provider>
              </ShowThemeModal.Provider>
            </ShowPersonalDataModal.Provider>
          </ShowDashboardModal.Provider>
        </FoodFilterContext.Provider>
      </ThemeContext.Provider>
    </ShowLanguageModal.Provider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any,
  theme: PropTypes.string
}

export default appWithTranslation(MyApp)
