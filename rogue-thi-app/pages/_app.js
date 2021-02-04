import { React } from 'react'
import PropTypes from 'prop-types'

// bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'

// fontawesome
import '@fortawesome/fontawesome-svg-core/styles.css'
import { config } from '@fortawesome/fontawesome-svg-core'

import '../styles/globals.css'
import styles from '../styles/Home.module.css'

config.autoAddCss = false

function MyApp ({ Component, pageProps }) {
  return <Component className={styles.themeDefault} {...pageProps} />
}
MyApp.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any
}

export default MyApp
