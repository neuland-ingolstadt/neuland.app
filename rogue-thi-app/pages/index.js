import React, { useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import {
  faBook,
  faBus,
  faCalendarAlt,
  faCalendarMinus,
  faCar,
  faChargingStation,
  faChevronRight,
  faDoorOpen,
  faPen,
  faTrain,
  faUtensils
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppNavbar, { ThemeContext } from '../components/AppNavbar'
import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppTabbar from '../components/AppTabbar'
import DiscordPrompt from '../components/DiscordPrompt'
import InstallPrompt from '../components/InstallPrompt'

import { NoSessionError, forgetSession } from '../lib/thi-backend/thi-session-handler'
import { calendar, loadExamList } from './calendar'
import { formatFriendlyRelativeTime, formatFriendlyTime, formatNearDate } from '../lib/date-utils'
import { getFriendlyTimetable, getTimetableEntryName } from './timetable'
import { getMobilityEntries, getMobilityLabel, getMobilitySettings, renderMobilityEntry } from './mobility'
import NeulandAPI from '../lib/neuland-api'
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

async function getMensaPlanPreview () {
  const plan = await NeulandAPI.getMensaPlan()
  const isoDate = new Date().toISOString().substring(0, 10)

  const todaysPlan = plan.find(x => x.timestamp === isoDate)?.meals
  if (!todaysPlan) {
    return []
  } else if (todaysPlan.length <= 2) {
    return todaysPlan.map(x => x.name)
  } else {
    return [
      todaysPlan[0].name,
      `und ${todaysPlan.length - 1} weitere Gerichte`
    ]
  }
}

function HomeCard ({ link, icon, title, className, children }) {
  return (
    // eslint-disable-next-line @next/next/link-passhref
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

  useEffect(() => {
    async function load () {
      try {
        setTimetable(await getFriendlyTimetable(new Date(), false))
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else {
          console.error(e)
          setTimetableError(e)
        }
      }
    }
    load()
  }, [router])

  return (
    <HomeCard
      icon={faCalendarMinus}
      title="Stundenplan"
      link="/timetable"
    >
      <ReactPlaceholder type="text" rows={5} ready={timetable || timetableError}>
        <ListGroup variant="flush">
        {timetable && timetable.slice(0, 2).map((x, i) =>
          <ListGroup.Item key={i}>
            <div>
              {getTimetableEntryName(x).shortName} in {x.raum}
            </div>
            <div className="text-muted">
              {formatNearDate(x.startDate)} um {formatFriendlyTime(x.startDate)}
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

  useEffect(() => {
    async function load () {
      try {
        setMensaPlan(await getMensaPlanPreview())
      } catch (e) {
        console.error(e)
        setMensaPlanError(e)
      }
    }
    load()
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

  useEffect(() => {
    async function load () {
      if (!mobilitySettings) {
        return
      }

      try {
        setMobility(await getMobilityEntries(mobilitySettings.kind, mobilitySettings.station))
      } catch (e) {
        console.error(e)
        setMobilityError('Fehler beim Abruf.')
      }
    }
    load()
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

  useEffect(() => {
    async function load () {
      let exams = []
      try {
        exams = (await loadExamList())
          .filter(x => !!x.date) // remove exams without a date
          .map(x => ({ name: `Prüfung ${x.titel}`, begin: x.date }))
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

      const combined = [...calendar, ...exams]
        .sort((a, b) => a.begin - b.begin)
        .filter(x => x.begin > Date.now() || x.end > Date.now())
      setMixedCalendar(combined)
    }
    load()
  }, [router])

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
                ? 'endet ' + formatFriendlyRelativeTime(x.end)
                : 'beginnt ' + formatFriendlyRelativeTime(x.begin)}
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

  const { hideInstallation, hideDiscord } = useMemo(() => ({
    hideInstallation: typeof localStorage !== 'undefined' ? localStorage.closedInstallPrompt : false,
    hideDiscord: typeof localStorage !== 'undefined' ? localStorage.closedDiscordPrompt : false
  }), [])

  useEffect(() => {
    async function load () {
      if (localStorage.unlockedThemes) {
        setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
      }
      if (localStorage.debugUnlocked) {
        setShowDebug(true)
      }
    }
    load()
  }, [])

  function changeTheme (theme) {
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years in the future
    document.cookie = `theme=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`

    setCurrentTheme(theme)
    setShowThemeModal(false)
  }

  function changePromptSetting (name) {
    if (localStorage[name]) {
      localStorage.removeItem(name)
    } else {
      localStorage[name] = true
    }

    router.reload()
  }

  return (
    <AppContainer>
      <ThemeContext.Provider value={currentTheme}>
        <AppNavbar title="neuland.app" showBack={false}>
          <Dropdown.Item variant="link" href="/lecturers">
            Dozenten
          </Dropdown.Item>
          <Dropdown.Item variant="link" href="/personal">
            Nutzerdaten
          </Dropdown.Item>
          {showDebug && (
            <Dropdown.Item variant="link" href="/debug">
              API Spielwiese
            </Dropdown.Item>
          )}
          <Dropdown.Item variant="link" href="/imprint">
            Impressum & Datenschutz
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item variant="link" onClick={() => setShowThemeModal(true)}>
            Design
          </Dropdown.Item>
          <Dropdown.Item variant="link" onClick={() => forgetSession(router)}>
            Ausloggen
          </Dropdown.Item>
        </AppNavbar>
      </ThemeContext.Provider>

      <AppBody>
        <div className={styles.cardDeck}>
          <InstallPrompt />
          <DiscordPrompt />

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
              <Form>
                <Form.Check
                  label="Installationsanleitung anzeigen"
                  checked={!hideInstallation}
                  onChange={() => changePromptSetting('closedInstallPrompt')}
                  />
                <Form.Check
                  label="Fakultäts Discord anzeigen"
                  checked={!hideDiscord}
                  onChange={() => changePromptSetting('closedDiscordPrompt')}
                  />
              </Form>
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
        </div>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
