import { useRouter } from 'next/router'

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import { Calendar, Home, Map, User, Utensils } from 'lucide-react'

import { USER_GUEST, useUserKind } from '../../lib/hooks/user-kind'

import styles from '../../styles/AppTabbar.module.css'

import { i18n } from 'next-i18next'

/**
 * Tab bar to be displayed at the bottom of the screen.
 */
export default function AppTabbar() {
  const router = useRouter()
  const { userKind } = useUserKind()

  return (
    <>
      <div className={styles.spacer} />

      <Navbar
        fixed="bottom"
        className={[styles.navbar, 'mobile-only']}
      >
        <Nav className={['justify-content-around', styles.nav]}>
          <Nav.Item>
            <Nav.Link
              onClick={() => router.replace('/')}
              className={[
                styles.tab,
                router.pathname === '/' && styles.tabActive,
              ]}
            >
              <Home
                size={24}
                className={styles.icon}
              />
              {i18n.t('cards.home')}
            </Nav.Link>
          </Nav.Item>
          {userKind !== USER_GUEST && (
            <Nav.Item>
              <Nav.Link
                onClick={() => router.replace('/timetable')}
                className={[
                  styles.tab,
                  router.pathname === '/timetable' && styles.tabActive,
                ]}
              >
                <Calendar
                  size={24}
                  className={styles.icon}
                />
                {i18n.t('cards.timetable')}
              </Nav.Link>
            </Nav.Item>
          )}
          <Nav.Item>
            <Nav.Link
              onClick={() => router.replace('/rooms')}
              className={[
                styles.tab,
                router.pathname === '/rooms' && styles.tabActive,
              ]}
            >
              <Map
                size={24}
                className={styles.icon}
              />
              {i18n.t('appbar.rooms')}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => router.replace('/food')}
              className={[
                styles.tab,
                router.pathname === '/food' && styles.tabActive,
              ]}
            >
              <Utensils
                size={24}
                className={styles.icon}
              />
              {i18n.t('cards.mensa')}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => router.replace('/personal')}
              className={[
                styles.tab,
                router.pathname === '/personal' && styles.tabActive,
              ]}
            >
              <User
                size={24}
                className={styles.icon}
              />
              {i18n.t('cards.personal')}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    </>
  )
}
