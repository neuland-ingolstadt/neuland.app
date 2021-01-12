import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import crypto from 'crypto'

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
  faCalendar,
  faUtensils,
  faDoorOpen,
  faBook,
  faPen,
  faUser
} from '@fortawesome/free-solid-svg-icons'

import styles from '../styles/Home.module.css'

import AppNavbar from '../lib/AppNavbar'
import InstallPrompt from '../lib/InstallPrompt'
import { obtainSession, forgetSession } from '../lib/thi-session-handler'
import { getTimetable, getPersonalData } from '../lib/thi-api-client'
import { getMensaPlan } from '../lib/reimplemented-api-client'
import { formatNearDate, formatFriendlyTime } from '../lib/date-utils'

const IMPRINT_URL = process.env.NEXT_PUBLIC_IMPRINT_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL

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

  return Object.values(days[0].gerichte)
    .map(x => x.name[1])
}

const allThemes = [
  { name: 'Standard', style: 'default', requirePremium: false },
  { name: 'Dunkel', style: 'dark', requirePremium: true },
  { name: 'Cyberpunk', style: 'cyberpunk', requirePremium: true }
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

export default function Home () {
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)
  const [mensaPlan, setMensaPlan] = useState(null)
  const [mensaPlanError, setMensaPlanError] = useState(null)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [userHash, setUserHash] = useState(null)
  const [isPremiumUser, setIsPremiumUser] = useState(true)
  const [currentTheme, setCurrentTheme] = useState('default')
  const router = useRouter()

  useEffect(async () => {
    try {
      setMensaPlan(await getMensaPlanPreview())
    } catch (e) {
      console.error(e)
      setMensaPlanError(e)
    }

    const session = await obtainSession(router)

    try {
      setTimetable(await getTimetablePreview(session))
    } catch (e) {
      console.error(e)
      setTimetableError(e)
    }
  }, [])

  useEffect(async () => {
    if (localStorage.theme && localStorage.theme !== currentTheme) {
      setCurrentTheme(localStorage.theme)
    }

    if (!showThemeModal || userHash !== null) {
      return
    }

    const session = await obtainSession(router)
    const user = await getPersonalData(session)

    const hash = crypto.createHash('sha256')
    hash.update(user.persdata.bibnr, 'utf8')
    hash.update(user.persdata.email, 'utf8')
    setUserHash(hash.digest('base64'))
  }, [showThemeModal])

  function setTheme (newTheme) {
    document.body.classList.remove(currentTheme)
    document.body.classList.add(newTheme)
    localStorage.theme = newTheme
    setCurrentTheme(newTheme)
  }

  return (
    <Container>
      <AppNavbar title="Übersicht" showBack={false}>
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
      </AppNavbar>

      <div className={styles.cardDeck}>

        <InstallPrompt />

        <Modal show={!!showThemeModal} dialogClassName={styles.themeModal} onHide={() => setShowThemeModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Erscheinungsbild</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Wähle ein Erscheinungsbild</h4>
            <Form>
              {allThemes.map((theme, i) => (
                <Form.Check
                  name="theme-selection"
                  key={i}
                  type="radio"
                  label={theme.name}
                  checked={currentTheme === theme.style}
                  disabled={theme.requirePremium && !isPremiumUser}
                  onChange={() => setTheme(theme.style)}
                />
              ))}
            </Form>
            {/*
            <br />
            <h4>Informationen</h4>
            <ReactPlaceholder type="text" rows={2} color="#eeeeee" ready={!!userHash}>
              <strong>Deine ID: </strong> {userHash}<br />
              <strong>Dein Status: </strong> {isPremiumUser ? 'Premium' : 'Standard'}<br />
            </ReactPlaceholder>
            <br />
            Mitglieder des Neuland Ingolstadt e.V. können Premium Erscheinungsbilder benutzen.
            Wenn du bereits Mitglied bist aber hier Standard-User angezeigt wird
            <a href={FEEDBACK_URL}> sende uns bitte deine ID</a> zusammen mit deiner
            Mitgliedsnummer. <br />
            Du bist noch kein Mitglied? <a href={WEBSITE_URL}>Hier</a> findest du weitere
            Informationen über den Verein. Die Mitgliedschaft ist für Studierende kostenlos.
            */}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowThemeModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>

        <HomeCard
          icon={faCalendar}
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
                Der Stundenplan ist leer.
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
          title="Prüfungen"
          link="/exams"
        >
          Prüfungstermine und -ergebnisse einsehen.
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
