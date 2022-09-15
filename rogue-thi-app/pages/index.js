import React, { useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'

import {
  faBook,
  faChevronDown,
  faChevronUp,
  faDoorOpen,
  faPen,
  faScroll,
  faTrash,
  faTrashRestore,
  faUser,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'
import { ThemeContext } from './_app'

import { forgetSession } from '../lib/backend/thi-session-handler'

import BaseCard from '../components/cards/BaseCard'
import CalendarCard from '../components/cards/CalendarCard'
import FoodCard from '../components/cards/FoodCard'
import InstallPrompt from '../components/cards/InstallPrompt'
import MobilityCard from '../components/cards/MobilityCard'
import TimetableCard from '../components/cards/TimetableCard'

import themes from '../data/themes.json'

import styles from '../styles/Home.module.css'

const CTF_URL = process.env.NEXT_PUBLIC_CTF_URL

const PLATFORM_DESKTOP = 'desktop'
const PLATFORM_MOBILE = 'mobile'
const USER_STUDENT = 'student'
const USER_EMPLOYEE = 'employee'
const USER_GUEST = 'guest'
const ALL_DASHBOARD_CARDS = [
  {
    key: 'install',
    label: 'Installation',
    default: [PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: hidePromptCard => (
      <InstallPrompt
        key="install"
        onHide={() => hidePromptCard('install')}
        />
    )
  },
  {
    key: 'timetable',
    label: 'Stundenplan',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE],
    card: () => <TimetableCard key="timetable" />
  },
  {
    key: 'mensa',
    label: 'Essen',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <FoodCard key="mensa" />
  },
  {
    key: 'mobility',
    label: 'Mobilität',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <MobilityCard key="mobility" />
  },
  {
    key: 'calendar',
    label: 'Termine',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => <CalendarCard key="calendar" />
  },
  {
    key: 'rooms',
    label: 'Raumplan',
    default: [PLATFORM_DESKTOP, USER_STUDENT, USER_EMPLOYEE, USER_GUEST],
    card: () => (
      <BaseCard
        key="rooms"
        icon={faDoorOpen}
        title="Räume"
        link="/rooms"
        />
    )
  },
  {
    key: 'library',
    label: 'Bibliothek',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="library"
        icon={faBook}
        title="Bibliothek"
        link="/library"
        />
    )
  },
  {
    key: 'grades',
    label: 'Noten & Fächer',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="grades"
        icon={faScroll}
        title="Noten & Fächer"
        link="/grades"
        />
    )
  },
  {
    key: 'personal',
    label: 'Persönliche Daten',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT],
    card: () => (
      <BaseCard
        key="personal"
        icon={faUser}
        title="Persönliche Daten"
        link="/personal"
        />
    )
  },
  {
    key: 'lecturers',
    label: 'Dozenten',
    default: [PLATFORM_DESKTOP, PLATFORM_MOBILE, USER_STUDENT, USER_EMPLOYEE],
    card: () => (
      <BaseCard
        key="lecturers"
        icon={faUserGraduate}
        title="Dozenten"
        link="/lecturers"
        />
    )
  }
]

export default function Home () {
  const router = useRouter()

  // page state
  const [shownDashboardEntries, setShownDashboardEntries] = useState([])
  const [hiddenDashboardEntries, setHiddenDashboardEntries] = useState([])
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [unlockedThemes, setUnlockedThemes] = useState([])
  const [showDebug, setShowDebug] = useState(false)
  const [theme, setTheme] = useContext(ThemeContext)
  const themeModalBody = useRef()

  useEffect(() => {
    async function load () {
      if (localStorage.personalizedDashboard) {
        const entries = JSON.parse(localStorage.personalizedDashboard)
          .map(key => ALL_DASHBOARD_CARDS.find(x => x.key === key))
          .filter(x => !!x)
        const hiddenEntries = JSON.parse(localStorage.personalizedDashboardHidden)
          .map(key => ALL_DASHBOARD_CARDS.find(x => x.key === key))
          .filter(x => !!x)

        ALL_DASHBOARD_CARDS.forEach(card => {
          if (!entries.find(x => x.key === card.key) && !hiddenEntries.find(x => x.key === card.key)) {
            // new (previosly unknown) card
            entries.splice(0, 0, card)
          }
        })
        setShownDashboardEntries(entries)
        setHiddenDashboardEntries(hiddenEntries)
      } else {
        const platform = window.matchMedia('(max-width: 768px)').matches
          ? PLATFORM_MOBILE
          : PLATFORM_DESKTOP

        let personGroup = USER_STUDENT
        if (localStorage.session === 'guest') {
          personGroup = USER_GUEST
        } else if (localStorage.isStudent === 'false') {
          personGroup = USER_EMPLOYEE
        }

        const filter = x => x.default.includes(platform) && x.default.includes(personGroup)
        setShownDashboardEntries(ALL_DASHBOARD_CARDS.filter(filter))
        setHiddenDashboardEntries(ALL_DASHBOARD_CARDS.filter(x => !filter(x)))
      }

      if (localStorage.unlockedThemes) {
        setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
      }
      if (localStorage.debugUnlocked) {
        setShowDebug(true)
      }
    }
    load()
  }, [])

  function changeDashboardEntries (entries, hiddenEntries) {
    localStorage.personalizedDashboard = JSON.stringify(entries.map(x => x.key))
    localStorage.personalizedDashboardHidden = JSON.stringify(hiddenEntries.map(x => x.key))
    setShownDashboardEntries(entries)
    setHiddenDashboardEntries(hiddenEntries)
  }

  function moveDashboardEntry (oldIndex, diff) {
    const newIndex = oldIndex + diff
    if (newIndex < 0 || newIndex >= shownDashboardEntries.length) {
      return
    }

    const entries = shownDashboardEntries.slice(0)
    const entry = entries[oldIndex]
    entries.splice(oldIndex, 1)
    entries.splice(newIndex, 0, entry)

    changeDashboardEntries(entries, hiddenDashboardEntries)
  }

  function hideDashboardEntry (key) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    const index = entries.findIndex(x => x.key === key)
    if (index >= 0) {
      hiddenEntries.push(entries[index])
      entries.splice(index, 1)
    }

    changeDashboardEntries(entries, hiddenEntries)
  }

  function bringBackDashboardEntry (index) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    entries.push(hiddenEntries[index])
    hiddenEntries.splice(index, 1)

    changeDashboardEntries(entries, hiddenEntries)
  }

  function changeTheme (theme) {
    localStorage.theme = theme
    setTheme(theme)
    setShowThemeModal(false)
  }

  return (
    <AppContainer>
      <AppNavbar title="neuland.app" showBack={false}>
        <AppNavbar.Button onClick={() => setShowThemeModal(true)}>
          <FontAwesomeIcon title="Personalisieren" icon={faPen} fixedWidth />
        </AppNavbar.Button>
        <AppNavbar.Overflow>
          {showDebug && (
            <AppNavbar.Overflow.Link variant="link" href="/debug">
              API Spielwiese
            </AppNavbar.Overflow.Link>
          )}
          <AppNavbar.Overflow.Link variant="link" href="/imprint">
            Impressum & Datenschutz
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => forgetSession(router)}>
            Ausloggen
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <div className={styles.cardDeck}>
          <Modal show={!!showThemeModal} dialogClassName={styles.themeModal} onHide={() => setShowThemeModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Personalisierung</Modal.Title>
            </Modal.Header>
            <Modal.Body ref={themeModalBody}>
              <h3 className={styles.themeHeader}>Design</h3>
              <Form>
                {themes.map((availableTheme, i) => (
                  <Button
                    key={i}
                    id={`theme-${i}`}
                    className={styles.themeButton}
                    variant={theme === availableTheme.style ? 'primary' : 'secondary'}
                    onClick={() => changeTheme(availableTheme.style)}
                    disabled={availableTheme.requiresToken && unlockedThemes.indexOf(availableTheme.style) === -1}
                  >
                    {availableTheme.name}
                  </Button>
                ))}
              </Form>
              <p>
                Um das <i>Hackerman</i>-Design freizuschalten, musst du mindestens vier Aufgaben unseres <a href={CTF_URL} target="_blank" rel="noreferrer">Übungs-CTFs</a> lösen.
                Wenn du so weit bist, kannst du es <Link href="/become-hackerman">hier</Link> freischalten.
              </p>

              <h3 className={styles.themeHeader}>Dashboard</h3>
              <p>
                Hier kannst du die Reihenfolge der im Dashboard angezeigten Einträge verändern.
              </p>
              <ListGroup>
                {shownDashboardEntries.map((entry, i) => (
                  <ListGroup.Item key={i} className={styles.personalizeItem}>
                    <div className={styles.personalizeLabel}>
                      {entry.label}
                    </div>
                    <div className={styles.personalizeButtons}>
                      <Button variant="text" onClick={() => moveDashboardEntry(i, -1)}>
                        <FontAwesomeIcon title="Nach oben" icon={faChevronUp} fixedWidth />
                      </Button>
                      <Button variant="text" onClick={() => moveDashboardEntry(i, +1)}>
                        <FontAwesomeIcon title="Nach unten" icon={faChevronDown} fixedWidth />
                      </Button>
                      <Button variant="text" onClick={() => hideDashboardEntry(entry.key)}>
                        <FontAwesomeIcon title="Entfernen" icon={faTrash} fixedWidth />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <br />

              <h4>Ausgeblendete Elemente</h4>
              <ListGroup>
                {hiddenDashboardEntries.map((entry, i) => (
                  <ListGroup.Item key={i} className={styles.personalizeItem}>
                    <div className={styles.personalizeLabel}>
                      {entry.label}
                    </div>
                    <div className={styles.personalizeButtons}>
                      <Button variant="text" onClick={() => bringBackDashboardEntry(i)}>
                        <FontAwesomeIcon title="Wiederherstellen" icon={faTrashRestore} fixedWidth />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <br />

              <Button
                variant="secondary"
                onClick={() => changeDashboardEntries(ALL_DASHBOARD_CARDS, [])}
              >
                Reihenfolge zurücksetzen
              </Button>
            </Modal.Body>
          </Modal>

          {shownDashboardEntries.map(entry => entry.card(hideDashboardEntry))}
        </div>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
