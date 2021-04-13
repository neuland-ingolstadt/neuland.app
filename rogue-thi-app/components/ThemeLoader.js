import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'

import TheMatrixAnimation from './TheMatrixAnimation'

import styles from '../styles/ThemeLoader.module.css'

export function extractThemeFromCookie (req) {
  console.log(req)

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

export default function ThemeLoader ({ children, theme }) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      </Head>
      {theme === 'hacker' && (
        <div className={styles.matrixBackground}>
          <TheMatrixAnimation />
        </div>
      )}
      {children}
    </>
  )
}
ThemeLoader.propTypes = {
  children: PropTypes.array,
  theme: PropTypes.string
}
