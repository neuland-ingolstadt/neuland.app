import React, { createContext, useContext, useMemo } from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
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

        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      </Head>

      {theme === 'hacker' && (
        <div className={styles.matrixBackground}>
          <TheMatrixAnimation />
        </div>
      )}

      <Navbar className={[styles.navbar, 'container', 'justify-content-between']}>
        <Navbar.Brand className={styles.left}>
          {showBackEffective && (
            <Button variant="link" onClick={() => router.back()} className={styles.back}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
          )}
          <div className={styles.titleText}>
            {title}
          </div>
        </Navbar.Brand>
        <Navbar.Brand className={styles.right}>
          {children &&
            <Dropdown align="right">
              <Dropdown.Toggle variant="link" bsPrefix="dropdown">
                <FontAwesomeIcon icon={faEllipsisV} />
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
  showBack: PropTypes.any,
  children: PropTypes.any
}
