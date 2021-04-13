import { React, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import App from 'next/app'
import ThemeLoader, { extractThemeFromCookie } from '../components/ThemeLoader'

// fontawesome
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'

import '../styles/globals.css'
import styles from '../styles/Home.module.css'

config.autoAddCss = false

function MyApp ({ Component, pageProps, theme }) {
  const router = useRouter()
  const actualTheme = useMemo(() => {
    if (router.pathname.startsWith('/become-hackerman')) {
      return 'hacker'
    } else {
      return theme
    }
  }, [theme, router])

  return (
    <ThemeLoader theme={actualTheme}>
      <Component className={styles.themeDefault} {...pageProps} />
    </ThemeLoader>
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
