import React, { useMemo } from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import { faChevronLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/router'

import { useMediaQuery } from '../lib/media-query-hook'

import styles from '../styles/AppNavbar.module.css'

export default function AppNavbar ({ title, showBack, children }) {
  const router = useRouter()
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
      </Head>

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
