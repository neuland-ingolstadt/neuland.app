import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'

import Button from 'react-bootstrap/Button'
import Navbar from 'react-bootstrap/Navbar'
import Dropdown from 'react-bootstrap/Dropdown'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faEllipsisH, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'

import TheMatrixAnimation from './TheMatrixAnimation'
import { getOperatingSystem, OS_IOS, OS_OTHER } from '../lib/user-agent'

import styles from '../styles/AppNavbar.module.css'

export default function AppNavbar ({ title, showBack, children, themeState }) {
  const router = useRouter()
  const [os, setOS] = useState(OS_OTHER)
  const [theme, setTheme] = themeState || useState('default')

  useEffect(() => setOS(getOperatingSystem()), [])
  useEffect(() => localStorage.theme && setTheme(localStorage.theme), [])

  if (typeof showBack === 'undefined') {
    showBack = true
  }

  function goBack () {
    router.back()
  }

  return (
    <>
      <Head>
        <title>{title}</title>

        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
        <meta name="description" content="Eine inoffizielle App für die Technische Hochschule Ingolstadt" />
        <meta name="keywords" content="THI, Technische Hochschule Ingolstadt, App" />
        <meta name="theme-color" content="#005a9b" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon512.png"></link>
        <link href="/favicon32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/favicon64.png" rel="icon" type="image/png" sizes="64x64" />
        <link href="/favicon512.png" rel="icon" type="image/png" sizes="512x512" />

        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      </Head>
      {theme === 'hacker' && (
        <div className={styles.matrixBackground}>
          <TheMatrixAnimation />
        </div>
      )}
      <Navbar sticky="top" className={[styles.navbar, 'justify-content-between']}>
        <Navbar.Brand className={styles.left}>
          {showBack && (
            <Button variant="link" onClick={() => goBack()} className={styles.back}>
              <FontAwesomeIcon icon={faChevronLeft} />
              {os === OS_IOS && ' Übersicht'}
            </Button>
          )}
        </Navbar.Brand>
        <Navbar.Brand className={styles.title}>
          {title}
        </Navbar.Brand>
        <Navbar.Brand className={styles.right}>
          {children &&
            <Dropdown align="right">
              <Dropdown.Toggle variant="link" bsPrefix="dropdown">
                <FontAwesomeIcon icon={os === OS_IOS ? faEllipsisH : faEllipsisV} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="right">
                {children}
              </Dropdown.Menu>
            </Dropdown>
          }
        </Navbar.Brand>
      </Navbar>
    </>
  )
}
AppNavbar.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  children: PropTypes.array,
  themeState: PropTypes.array
}
