import React, { useCallback, useMemo } from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import { faChevronLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useMediaQuery from '@restart/hooks/useMediaQuery'
import { useRouter } from 'next/router'

import styles from '../../styles/AppNavbar.module.css'
import { useTranslation } from 'next-i18next'

/**
 * Navigation bar to be displayed at the top of the screen.
 */
export default function AppNavbar({ title, showBack, children }) {
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { t } = useTranslation('common')

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
              <FontAwesomeIcon
                title={t('appbar.back', { ns: 'common' })}
                icon={faChevronLeft}
                fixedWidth
              />
            </Button>
          )}
          <div
            className={
              new Date().getMonth() === 5
                ? styles.titleTextPride
                : styles.titleText
            }
          >
            {title}
          </div>
        </Navbar.Brand>
        <Nav>{children}</Nav>
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
  const { t } = useTranslation('common')

  return (
    <Dropdown align="right">
      <Dropdown.Toggle
        variant="link"
        bsPrefix="dropdown"
      >
        <FontAwesomeIcon
          title={t('appbar.overflow', { ns: 'common' })}
          icon={faEllipsisV}
          fixedWidth
        />
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
