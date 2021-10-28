import React, { createContext, useContext, useMemo } from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import { faChevronLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/router'

import TheMatrixAnimation from './TheMatrixAnimation'
import { useMediaQuery } from '../lib/media-query-hook'

import styles from '../styles/AppNavbar.module.css'

export const ThemeContext = createContext('default')

export default function AppNavbar ({ title, showBack, children }) {
  const router = useRouter()
  const theme = useContext(ThemeContext)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const showBackEffective = useMemo(() => {
    if (typeof showBack === 'undefined') {
      return true
    } else if (showBack === 'desktop-only') {
      return isDesktop
    } else {
      return showBack
    }
  }, [showBack, isDesktop])

  return (
    <>
      <Head>
        <title>{title}</title>

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

        {/* generated using npx pwa-asset-generator */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2732-2048.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2388-1668.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-1536.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2224.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2224-1668.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1620-2160.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2160-1620.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284-2778.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2778-1284.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2532-1170.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2436-1125.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2688-1242.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1792-828.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2208.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2208-1242.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1334-750.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1136-640.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      </Head>

      {theme === 'hacker' && (
        <div className={styles.matrixBackground}>
          <TheMatrixAnimation />
        </div>
      )}

      <Navbar fixed="top" className={[styles.navbar, 'container', 'justify-content-between']}>
        <Navbar.Brand className={styles.left}>
          {showBackEffective && (
            <Button variant="link" onClick={() => router.back()} className={styles.back}>
              <FontAwesomeIcon title="Zurück" icon={faChevronLeft} fixedWidth />
            </Button>
          )}
          <div className={styles.titleText}>
            {title}
          </div>
        </Navbar.Brand>
        <Nav>
          {children}
        </Nav>
      </Navbar>

      <div className={styles.spacer} />
    </>
  )
}
AppNavbar.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.any,
  children: PropTypes.any
}

function AppNavbarButton ({ children, ...props }) {
  return (
    <Button variant="link" {...props}>
      {children}
    </Button>
  )
}
AppNavbarButton.propTypes = {
  children: PropTypes.any
}

AppNavbar.Button = AppNavbarButton

function AppNavbarOverflow ({ children }) {
  return (
    <Dropdown align="right">
      <Dropdown.Toggle variant="link" bsPrefix="dropdown">
        <FontAwesomeIcon title="Mehr Optionen" icon={faEllipsisV} fixedWidth />
      </Dropdown.Toggle>

      <Dropdown.Menu align="right">
        {children}
      </Dropdown.Menu>
    </Dropdown>
  )
}
AppNavbarOverflow.propTypes = {
  children: PropTypes.any
}

AppNavbar.Overflow = AppNavbarOverflow
