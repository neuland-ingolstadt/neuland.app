import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import Link from 'next/link'

import Container from 'react-bootstrap/Container'
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
  faBus,
  faDoorOpen,
  faBook,
  faPen,
  faCalendarAlt,
  faUser
} from '@fortawesome/free-solid-svg-icons'

import AppNavbar, { extractThemeFromCookie } from '../components/AppNavbar'
import InstallPrompt from '../components/InstallPrompt'
import { callWithSession, forgetSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getTimetable } from '../lib/thi-backend/thi-api-client'
import { getMensaPlan, getBusPlan } from '../lib/reimplemented-api-client'
import { formatNearDate, formatFriendlyTime, formatRelativeMinutes } from '../lib/date-utils'
import { useTime } from '../lib/time-hook'
import { stations, defaultStation } from '../data/bus.json'

import styles from '../styles/Home.module.css'

const IMPRINT_URL = process.env.NEXT_PUBLIC_IMPRINT_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL
const CTF_URL = process.env.NEXT_PUBLIC_CTF_URL

const MAX_STATION_LENGTH = 20

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

const allThemes = [
  { name: 'Standard', style: 'default' },
  { name: 'Dunkel', style: 'dark' },
  { name: 'Barbie & Ken', style: 'barbie' },
  { name: 'Retro', style: 'retro' },
  { name: 'Windows 98 (Achtung: Unbenutzbar!)', style: '98' },
  { name: 'Hackerman (siehe unten)', style: 'hacker', requiresToken: true }
]

function HomeCard ({ link, icon, title, children }) {
  return (
    <Link href={link}>
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title>
            <FontAwesomeIcon icon={icon} fixedWidth />
            {' '}
            {title}
            <Button variant="link" className={styles.cardButton}>
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </Card.Title>
          <Card.Text>
            {children}
          </Card.Text>
        </Card.Body>
      </Card>
    </Link>
  )
}
HomeCard.propTypes = {
  link: PropTypes.string,
  icon: PropTypes.object,
  title: PropTypes.string,
  children: PropTypes.any
}

export default function Home ({ theme }) {
  const router = useRouter()
  const time = useTime()

  // dynamic widget data
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)
  const [mensaPlan, setMensaPlan] = useState(null)
  const [mensaPlanError, setMensaPlanError] = useState(null)
  const [busPlan, setBusPlan] = useState(null)
  const [busPlanError, setBusPlanError] = useState(null)
  const [stationName, setStationName] = useState(null)

  // page state
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [unlockedThemes, setUnlockedThemes] = useState([])

  useEffect(async () => {
    try {
      setMensaPlan(await getMensaPlanPreview())
    } catch (e) {
      console.error(e)
      setMensaPlanError(e)
    }
  }, [])

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

  useEffect(async () => {
    setBusPlan(null)

    const stationId = localStorage.station || defaultStation
    const stationName = stations.find(s => s.id === stationId).name

    setStationName(stationName)

    try {
      setBusPlan(await getBusPlan(stationId))
    } catch (e) {
      console.error(e)
      setBusPlanError(e)
    }
  }, [time])

  useEffect(async () => {
    if (localStorage.unlockedThemes) {
      setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
    }
  }, [])

  function setTheme (newTheme) {
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years in the future
    document.cookie = `theme=${newTheme}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`
    setCurrentTheme(newTheme)
  }

  return (
    <Container>
      <AppNavbar title="Übersicht" showBack={false} theme={currentTheme}>
        <Dropdown.Item variant="link" onClick={() => forgetSession(router)}>
          Ausloggen
        </Dropdown.Item>
        <Dropdown.Item variant="link" onClick={() => setShowThemeModal(true)}>
          Erscheinungsbild
        </Dropdown.Item>
        <Dropdown.Item variant="link" href="/debug">
          API Playground
        </Dropdown.Item>
        <hr />
        <Dropdown.Item variant="link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
          Feedback
        </Dropdown.Item>
        <Dropdown.Item variant="link" href={GIT_URL} target="_blank" rel="noreferrer">
          Quellcode
        </Dropdown.Item>
        <Dropdown.Item variant="link" href={IMPRINT_URL} target="_blank" rel="noreferrer">
          Impressum und Datenschutz
        </Dropdown.Item>
        <Dropdown.Item variant="link" href="/legal">
          Rechtliche Hinweise der THI
        </Dropdown.Item>
      </AppNavbar>

      <div className={styles.cardDeck}>
        <InstallPrompt />

        <Modal show={!!showThemeModal} dialogClassName={styles.themeModal} onHide={() => setShowThemeModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Erscheinungsbild</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              {allThemes.map((theme, i) => (
                <Form.Check
                  name="theme-selection"
                  key={i}
                  id={`theme-${i}`}
                  type="radio"
                  label={theme.name}
                  checked={currentTheme === theme.style}
                  onChange={() => setTheme(theme.style)}
                  disabled={theme.requiresToken && unlockedThemes.indexOf(theme.style) === -1}
                />
              ))}
            </Form>
            <br />
            <p>
              Für die Verwendung des mit Abstand coolsten Erscheinungsbild <i>Hackerman</i> musst
              du mindestens vier Aufgaben unseres{' '}
              <a href={CTF_URL} target="_blank" rel="noreferrer">Übungs-CTF</a> lösen.
              <br />
              Sobald du das erreicht hast <a href="/become-hackerman">Klicke hier!</a>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowThemeModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>

        <HomeCard
          icon={faCalendarMinus}
          title="Stundenplan"
          link="/timetable"
        >
          <ReactPlaceholder type="text" rows={5} color="#eeeeee" ready={timetable || timetableError}>
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

        <HomeCard
          icon={faUtensils}
          title="Mensa"
          link="/mensa"
        >
          <ReactPlaceholder type="text" rows={5} color="#eeeeee" ready={mensaPlan || mensaPlanError}>
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

        <HomeCard
          icon={faBus}
          title={stationName ? `Bus (${stationName})` : 'Bus'}
          link="/bus"
        >
          <ReactPlaceholder type="text" rows={5} color="#eeeeee" ready={busPlan || busPlanError}>
            <ListGroup variant="flush">
              {busPlan && busPlan.slice(0, 4).map((x, i) =>
                <ListGroup.Item key={i} className={styles.busItem}>
                  <div className={styles.busRoute}>
                    {x.route}
                  </div>
                  <div className={styles.busDestination}>
                    {x.destination.length > MAX_STATION_LENGTH
                      ? x.destination.substr(0, MAX_STATION_LENGTH) + '…'
                      : x.destination
                    }
                  </div>
                  <div className={styles.busTime}>
                    {formatRelativeMinutes(x.time)}
                  </div>
                </ListGroup.Item>
              )}
              {busPlan && busPlan.length === 0 &&
                <ListGroup.Item>
                  In nächster Zeit kommen keine Busse.
                </ListGroup.Item>
              }
              {busPlanError &&
                <ListGroup.Item>
                  Fehler beim Abruf des Busplans.
                </ListGroup.Item>
              }
            </ListGroup>
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          icon={faCalendarAlt}
          title="Termine"
          link="/calendar"
        >
          Prüfungs- und Semestertermine anzeigen.
        </HomeCard>

        <HomeCard
          icon={faDoorOpen}
          title="Räume"
          link="/rooms"
        >
          Freie Räume suchen.
        </HomeCard>

        <HomeCard
          icon={faBook}
          title="Bibliothek"
          link="/library"
        >
          Sitzplätze reservieren.
        </HomeCard>

        <HomeCard
          icon={faPen}
          title="Noten & Fächer"
          link="/grades"
        >
          Prüfungsergebnisse und ausstehende Fächer einsehen.
        </HomeCard>

        <HomeCard
          icon={faUser}
          title="Konto"
          link="/personal"
        >
          Persönliche Daten einsehen.
        </HomeCard>
      </div>
    </Container>
  )
}

Home.propTypes = {
  theme: PropTypes.string
}

Home.getInitialProps = function ({ req }) {
  return {
    theme: extractThemeFromCookie(req)
  }
}
