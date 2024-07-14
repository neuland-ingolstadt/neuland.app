import React, { useCallback, useMemo } from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import Link from 'next/link'

import { ChevronLeft, CircleUser, EllipsisVertical } from 'lucide-react'
import useMediaQuery from '@restart/hooks/useMediaQuery'
import { useRouter } from 'next/router'

import styles from '../../styles/AppNavbar.module.css'

/**
 * Navigation bar to be displayed at the top of the screen.
 */
export default function AppNavbar({ title, showBack, children }) {
  const router = useRouter()
  const route = router.pathname.slice(1)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  /**
   * Indicates whether a back button should be shown.
   */
  const showBackEffective = useMemo(() => {
    if (typeof showBack === 'undefined') {
      return true
    } else if (showBack === 'desktop-only') {
      return isDesktop
    } else {
      return showBack
    }
  }, [showBack, isDesktop])

  const isPride = useMemo(() => new Date().getMonth() === 5, [])

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <Navbar
        fixed="top"
        className={[styles.navbar, 'container', 'justify-content-between']}
      >
        <Navbar.Brand className={styles.left}>
          {showBackEffective && (
            <Button
              variant="link"
              onClick={() => router.back()}
              className={styles.back}
            >
              <ChevronLeft size={18} />
            </Button>
          )}
          <div className={`${styles.titleText} ${isPride ? styles.pride : ''}`}>
            {title}
          </div>
        </Navbar.Brand>

        <Nav
          style={{
            marginTop: '4px',
          }}
        >
          {children}
          {isDesktop && route !== 'personal' && (
            <Link href="/personal">
              <AppNavbar.Button>
                <CircleUser size={24} />
              </AppNavbar.Button>
            </Link>
          )}
        </Nav>
      </Navbar>

      <div className={styles.spacer} />
    </>
  )
}
AppNavbar.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.any,
  children: PropTypes.any,
}

/**
 * Button to be displayed in the navbar.
 */
function AppNavbarButton({ children, ...props }) {
  return (
    <Button
      variant="link"
      {...props}
    >
      {children}
    </Button>
  )
}
AppNavbarButton.propTypes = {
  children: PropTypes.any,
}

AppNavbar.Button = AppNavbarButton

/**
 * Overflow menu to be displayed in the navbar.
 */
function AppNavbarOverflow({ children }) {
  return (
    <Dropdown align="right">
      <Dropdown.Toggle
        variant="link"
        bsPrefix="dropdown"
      >
        <EllipsisVertical size={18} />
      </Dropdown.Toggle>

      <Dropdown.Menu align="right">{children}</Dropdown.Menu>
    </Dropdown>
  )
}
AppNavbarOverflow.propTypes = {
  children: PropTypes.any,
}

AppNavbar.Overflow = AppNavbarOverflow

/**
 * Wrapper around Dropdown.Link that makes it compatible with Next.js.
 * Use this to make sure the links work even when exported as static HTML.
 */
function AppNavbarOverflowLink({ href, onClick, children }) {
  const router = useRouter()

  const click = useCallback(() => {
    if (href) {
      router.push(href)
    }
    if (onClick) {
      onClick()
    }
  }, [router, href, onClick])

  return <Dropdown.Item onClick={() => click()}>{children}</Dropdown.Item>
}
AppNavbarOverflowLink.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.any,
}
AppNavbar.Overflow.Link = AppNavbarOverflowLink
