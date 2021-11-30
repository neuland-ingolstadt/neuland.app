import { React, useMemo, useState, createContext } from 'react'
import App from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'

import PropTypes from 'prop-types'
import TheMatrixAnimation from './../components/TheMatrixAnimation'

import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'

import '../styles/globals.css'

export const ThemeContext = createContext('default')

config.autoAddCss = false

function extractThemeFromCookie (req) {
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

function MyApp ({ Component, pageProps, theme: initialTheme }) {
  const router = useRouter()
  const [theme, setTheme] = useState(initialTheme)
  const computedTheme = useMemo(() => {
    if (router.pathname === '/become-hackerman') {
      return 'hacker'
    } else {
      return theme
    }
  }, [theme, router.pathname])

  return (
    <ThemeContext.Provider value={[computedTheme, setTheme]}>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
        <meta name="description" content="Eine inoffizielle App für die Technische Hochschule Ingolstadt" />
        <meta name="keywords" content="THI, Technische Hochschule Ingolstadt, App" />
        <meta name="theme-color" content="#8845ef" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon512.png"></link>
        <link href="/favicon32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/favicon64.png" rel="icon" type="image/png" sizes="64x64" />
        <link href="/favicon512.png" rel="icon" type="image/png" sizes="512x512" />

        <link rel="stylesheet" href={`/themes/${computedTheme}.css`} />
      </Head>

      {computedTheme === 'hacker' && (
        <div className="matrixBackground">
          <TheMatrixAnimation />
        </div>
      )}

      <Component {...pageProps} />
    </ThemeContext.Provider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any,
  theme: PropTypes.string
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext)
  return {
    ...appProps,
    theme: extractThemeFromCookie(appContext.ctx.req)
  }
}

export default MyApp
