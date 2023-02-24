import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import {
  faBook,
  faCalendar,
  faHome,
  faMap,
  faUtensils
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from '../../styles/AppTabbar.module.css'

/**
 * Tab bar to be displayed at the bottom of the screen.
 */
export default function AppTabbar () {
  const router = useRouter()
  const [isGuest, setIsGuest] = useState(true)
  useEffect(() => setIsGuest(localStorage.session === 'guest'), [])

  return (
    <>
      <div className={styles.spacer} />

      <Navbar fixed="bottom" className={[styles.navbar, 'mobile-only']}>
        <Nav className={['justify-content-around', styles.nav]}>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/library')} className={[styles.tab, router.pathname === '/library' && styles.tabActive]}>
              <FontAwesomeIcon icon={faBook} className={styles.icon} />
              Bibliothek
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/rooms')} className={[styles.tab, router.pathname === '/rooms' && styles.tabActive]}>
              <FontAwesomeIcon icon={faMap} className={styles.icon} fixedWidth />
              Raumplan
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/')} className={[styles.tab, router.pathname === '/' && styles.tabActive]}>
              <FontAwesomeIcon icon={faHome} className={styles.icon} fixedWidth />
              Home
            </Nav.Link>
          </Nav.Item>
          {!isGuest && (
            <Nav.Item>
              <Nav.Link onClick={() => router.replace('/timetable')} className={[styles.tab, router.pathname === '/timetable' && styles.tabActive]}>
                <FontAwesomeIcon icon={faCalendar} className={styles.icon} fixedWidth />
                Stundenplan
              </Nav.Link>
            </Nav.Item>
          )}
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/food')} className={[styles.tab, router.pathname === '/food' && styles.tabActive]}>
              <FontAwesomeIcon icon={faUtensils} className={styles.icon} fixedWidth />
              Essen
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  )
}
