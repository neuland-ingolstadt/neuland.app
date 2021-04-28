import React, { useEffect, useState, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import Link from 'next/link'

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Card from 'react-bootstrap/Card'
import ListGroup from 'react-bootstrap/ListGroup'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight,
  faCalendarMinus,
  faUtensils,
  faDoorOpen,
  faBook,
  faPen,
  faCalendarAlt,
  faUser,
  faBus,
  faTrain,
  faCar,
  faChargingStation
} from '@fortawesome/free-solid-svg-icons'

import AppBody from '../components/AppBody'
import AppNavbar, { ThemeContext } from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'
import InstallPrompt from '../components/InstallPrompt'
import { calendar, loadExamList } from './calendar.js'
import { getMobilitySettings, renderMobilityEntry, getMobilityLabel, getMobilityEntries } from './mobility.js'
import { callWithSession, forgetSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getTimetable } from '../lib/thi-backend/thi-api-client'
import { getMensaPlan } from '../lib/reimplemented-api-client'
import { formatNearDate, formatFriendlyTime, formatFriendlyRelativeTime } from '../lib/date-utils'
import { useTime } from '../lib/time-hook'

import styles from '../styles/Home.module.css'

const CTF_URL = process.env.NEXT_PUBLIC_CTF_URL
const MAX_STATION_LENGTH = 20
const MOBILITY_ICONS = {
  bus: faBus,
  train: faTrain,
  parking: faCar,
  charging: faChargingStation
}
const ALL_THEMES = [
  { name: 'Automatisch', style: 'default' },
  { name: 'Hell', style: 'light' },
  { name: 'Dunkel', style: 'dark' },
  { name: 'Barbie & Ken', style: 'barbie' },
  { name: 'Retro', style: 'retro' },
  { name: 'Windows 95', style: '95' },
  { name: 'Hackerman', style: 'hacker', requiresToken: true }
]

async function getTimetablePreview (session) {
  const resp = await getTimetable(session, new Date())
  const now = new Date()

  const nextItems = resp.timetable
    .map(x => {
      // parse dates
      x.start_date = new Date(`${x.datum}T${x.von}`)
      x.end_date = new Date(`${x.datum}T${x.bis}`)
      return x
    })
    .filter(x => x.end_date > now)
    .sort((a, b) => a.start_date - b.start_date)

  return nextItems.slice(0, 2)
}

async function getMensaPlanPreview (session) {
  const days = await getMensaPlan()
  if (!days[0]) {
    return []
  }

  const today = Object.values(days[0].meals)
  if (today.length > 2) {
    return [
      today[0].name,
      `und ${today.length - 1} weitere Gerichte`
    ]
  } else {
    return today.map(x => x.name)
  }
}

function HomeCard ({ link, icon, title, className, children }) {
  return (
    <Link href={link}>
      <Card className={[styles.card, className]}>
        <Card.Body>
          <Card.Title>
            <FontAwesomeIcon icon={icon} fixedWidth />
            {' '}
            {title}
            <Button variant="link" className={styles.cardButton}>
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </Card.Title>
          {children &&
            <Card.Text>
              {children}
            </Card.Text>
          }
        </Card.Body>
      </Card>
    </Link>
  )
}
HomeCard.propTypes = {
  link: PropTypes.string,
  icon: PropTypes.object,
  title: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any
}

function TimetableCard () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)

  useEffect(async () => {
    try {
      const timetable = await callWithSession(getTimetablePreview)
      setTimetable(timetable)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        setTimetableError(e)
      }
    }
  }, [])

  return (
    <HomeCard
      icon={faCalendarMinus}
      title="Stundenplan"
      link="/timetable"
    >
      <ReactPlaceholder type="text" rows={5} ready={timetable || timetableError}>
        <ListGroup variant="flush">
        {timetable && timetable.map((x, i) =>
          <ListGroup.Item key={i}>
            <div>
              {x.veranstaltung}, {x.raum}
            </div>
            <div className="text-muted">
              {formatNearDate(x.start_date)} um {formatFriendlyTime(x.start_date)}
            </div>
          </ListGroup.Item>
        )}
        {timetable && timetable.length === 0 &&
          <ListGroup.Item>
            Dein Stundenplan ist leer.
          </ListGroup.Item>
        }
        {timetableError &&
          <ListGroup.Item>
            Fehler beim Abruf des Stundenplans.
          </ListGroup.Item>
        }
        </ListGroup>
      </ReactPlaceholder>
    </HomeCard>
  )
}

function MensaCard () {
  const [mensaPlan, setMensaPlan] = useState(null)
  const [mensaPlanError, setMensaPlanError] = useState(null)

  useEffect(async () => {
    try {
      setMensaPlan(await getMensaPlanPreview())
    } catch (e) {
      console.error(e)
      setMensaPlanError(e)
    }
  }, [])

  return (
    <HomeCard
      icon={faUtensils}
      title="Mensa"
      link="/mensa"
      className="desktop-only"
    >
      <ReactPlaceholder type="text" rows={5} ready={mensaPlan || mensaPlanError}>
        <ListGroup variant="flush">
          {mensaPlan && mensaPlan.map((x, i) =>
            <ListGroup.Item key={i}>
              {x}
            </ListGroup.Item>
          )}
          {mensaPlan && mensaPlan.length === 0 &&
            <ListGroup.Item>
              Der Speiseplan ist leer.
            </ListGroup.Item>
          }
          {mensaPlanError &&
            <ListGroup.Item>
              Fehler beim Abruf des Speiseplans.<br />
              Die Mensa mag gerade nicht. :(
            </ListGroup.Item>
          }
        </ListGroup>
      </ReactPlaceholder>
    </HomeCard>

  )
}

function MobilityCard () {
  const time = useTime()
  const [mobility, setMobility] = useState(null)
  const [mobilityError, setMobilityError] = useState(null)
  const [mobilitySettings, setMobilitySettings] = useState(null)

  const mobilityIcon = useMemo(() => {
    return mobilitySettings ? MOBILITY_ICONS[mobilitySettings.kind] : faBus
  }, [mobilitySettings])
  const mobilityLabel = useMemo(() => {
    return mobilitySettings ? getMobilityLabel(mobilitySettings.kind, mobilitySettings.station) : 'Mobilität'
  }, [mobilitySettings])

  useEffect(() => {
    setMobilitySettings(getMobilitySettings())
  }, [])

  useEffect(async () => {
    if (!mobilitySettings) {
      return
    }

    try {
      setMobility(await getMobilityEntries(mobilitySettings.kind, mobilitySettings.station))
    } catch (e) {
      console.error(e)
      setMobilityError('Fehler beim Abruf.')
    }
  }, [mobilitySettings, time])

  return (
    <HomeCard
      icon={mobilityIcon}
      title={mobilityLabel}
      link="/mobility"
    >
      <ReactPlaceholder type="text" rows={5} ready={mobility || mobilityError}>
        <ListGroup variant="flush">
          {mobility && mobility.slice(0, 4).map((entry, i) =>
            <ListGroup.Item key={i} className={styles.mobilityItem}>
              {renderMobilityEntry(mobilitySettings.kind, entry, MAX_STATION_LENGTH, styles)}
            </ListGroup.Item>
          )}
          {mobility && mobility.length === 0 &&
            <ListGroup.Item>
              Keine Abfahrten in nächster Zeit.
            </ListGroup.Item>
          }
          {mobilityError &&
            <ListGroup.Item>
              Fehler beim Abruf.
            </ListGroup.Item>
          }
        </ListGroup>
      </ReactPlaceholder>
    </HomeCard>
  )
}

function CalendarCard () {
  const router = useRouter()
  const time = useTime()
  const [mixedCalendar, setMixedCalendar] = useState(calendar)

  useEffect(async () => {
    let examList = []
    try {
      examList = await callWithSession(loadExamList)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else if (e.message === 'Query not possible') {
        // ignore, leaving examList empty
      } else {
        console.error(e)
        alert(e)
      }
    }

    const examEntries = examList.map(x => ({ name: `Prüfung ${x.titel}`, begin: x.date }))
    const combined = [...calendar, ...examEntries]
    combined.sort((a, b) => a.begin - b.begin)
    setMixedCalendar(combined)
  }, [])

  return (
    <HomeCard
      icon={faCalendarAlt}
      title="Termine"
      link="/calendar"
    >
      <ListGroup variant="flush">
        {mixedCalendar && mixedCalendar.slice(0, 2).map((x, i) => (
          <ListGroup.Item key={i}>
            <div>
              {x.name}
            </div>
            <div className="text-muted">
              {(x.end && x.begin < time)
                ? 'bis ' + formatFriendlyRelativeTime(x.end)
                : formatFriendlyRelativeTime(x.begin)}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </HomeCard>
  )
}

export default function Home () {
  const router = useRouter()

  // page state
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(useContext(ThemeContext))
  const [unlockedThemes, setUnlockedThemes] = useState([])
  const [showDebug, setShowDebug] = useState(false)

  useEffect(async () => {
    if (localStorage.unlockedThemes) {
      setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
    }
    if (localStorage.debugUnlocked) {
      setShowDebug(true)
    }
  }, [])

  function changeTheme (theme) {
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years in the future
    document.cookie = `theme=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`

    setCurrentTheme(theme)
    setShowThemeModal(false)
  }

  return (
    <>
      <ThemeContext.Provider value={currentTheme}>
        <AppNavbar title="neuland.app" showBack={false}>
          <Dropdown.Item variant="link" onClick={() => setShowThemeModal(true)}>
            Design
          </Dropdown.Item>
          {showDebug && (
            <Dropdown.Item variant="link" href="/debug">
              API Spielwiese
            </Dropdown.Item>
          )}
          <Dropdown.Item variant="link" href="/imprint">
            Impressum & Datenschutz
          </Dropdown.Item>
          <Dropdown.Item variant="link" onClick={() => forgetSession(router)}>
            Ausloggen
          </Dropdown.Item>
        </AppNavbar>
      </ThemeContext.Provider>

      <AppBody>
        <div className={styles.cardDeck}>
          <InstallPrompt />

          <Modal show={!!showThemeModal} dialogClassName={styles.themeModal} onHide={() => setShowThemeModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Design</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                {ALL_THEMES.map((theme, i) => (
                  <Button
                  key={i}
                    id={`theme-${i}`}
                    className={styles.themeButton}
                    variant={currentTheme === theme.style ? 'primary' : 'secondary'}
                    onClick={() => changeTheme(theme.style)}
                    disabled={theme.requiresToken && unlockedThemes.indexOf(theme.style) === -1}
                  >
                    {theme.name}
                  </Button>
                ))}
              </Form>
              <br />
              <p>
                Um das <i>Hackerman</i>-Design freizuschalten, musst du mindestens vier Aufgaben unseres <a href={CTF_URL} target="_blank" rel="noreferrer">Übungs-CTFs</a> lösen.
                Wenn du so weit bist, kannst du es <Link href="/become-hackerman">hier</Link> freischalten.
              </p>
            </Modal.Body>
          </Modal>

          <TimetableCard />

          <MensaCard />

          <MobilityCard />

          <CalendarCard />

          <HomeCard
            icon={faDoorOpen}
            title="Räume"
            link="/rooms"
            className="desktop-only"
          />

          <HomeCard
            icon={faBook}
            title="Bibliothek"
            link="/library"
          />

          <HomeCard
            icon={faPen}
            title="Noten & Fächer"
            link="/grades"
          />

          <HomeCard
            icon={faUser}
            title="Konto"
            link="/personal"
          />
        </div>
      </AppBody>

      <AppTabbar />
    </>
  )
}
