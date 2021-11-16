import React from 'react'
import { useRouter } from 'next/router'

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import {
  faCalendar,
  faHome,
  faMap,
  faUtensils
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from '../styles/AppTabbar.module.css'

export default function AppTabbar () {
  const router = useRouter()

  return (
    <>
      <div className={styles.spacer} />

      <Navbar fixed="bottom" className={[styles.navbar, 'mobile-only']}>
        <Nav className={['justify-content-around', styles.nav]}>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/')} className={[styles.tab, router.pathname === '/' && styles.tabActive]}>
              <FontAwesomeIcon icon={faHome} className={styles.icon} />
              Home
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/timetable')} className={[styles.tab, router.pathname === '/timetable' && styles.tabActive]}>
              <FontAwesomeIcon icon={faCalendar} className={styles.icon} />
              Stundenplan
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/rooms')} className={[styles.tab, router.pathname === '/rooms' && styles.tabActive]}>
              <FontAwesomeIcon icon={faMap} className={styles.icon} />
              Raumplan
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={() => router.replace('/food')} className={[styles.tab, router.pathname === '/food' && styles.tabActive]}>
              <FontAwesomeIcon icon={faUtensils} className={styles.icon} />
              Essen
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  )
}
