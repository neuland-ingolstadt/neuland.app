import { React, useMemo, useState } from 'react'
import App from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'

import PropTypes from 'prop-types'
import { ThemeContext } from '../components/AppNavbar'

// fontawesome
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'

import '../styles/globals.css'

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
        <link rel="stylesheet" href={`/themes/${computedTheme}.css`} />
      </Head>
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
