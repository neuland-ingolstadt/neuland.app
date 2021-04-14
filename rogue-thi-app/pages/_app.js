import { React } from 'react'
import PropTypes from 'prop-types'
import App from 'next/app'
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

function MyApp ({ Component, pageProps, theme }) {
  return (
    <ThemeContext.Provider value={theme}>
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
