import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'

import Link from 'next/link'

import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import ListGroup from 'react-bootstrap/ListGroup'

import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

import styles from '../styles/Home.module.css'

import AppNavbar from '../lib/AppNavbar'
import { obtainSession, forgetSession } from '../lib/thi-session-handler'
import { getTimetable, getMensaPlan } from '../lib/thi-api-client'
import { formatNearDate, formatFriendlyTime } from '../lib/date-utils'

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
  const days = await getMensaPlan(session)

  return Object.values(days[0].gerichte)
    .map(x => x.name[1])
}

function HomeCard ({ link, title, children }) {
  return (
    <Link href={link}>
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title>
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
  title: PropTypes.string,
  children: PropTypes.any
}

export default function Home () {
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)
  const [mensaPlan, setMensaPlan] = useState(null)
  const [mensaPlanError, setMensaPlanError] = useState(null)
  const router = useRouter()

  useEffect(async () => {
    const session = await obtainSession(router)

    try {
      setTimetable(await getTimetablePreview(session))
    } catch (e) {
      setTimetableError(e.toString())
    }

    try {
      setMensaPlan(await getMensaPlanPreview(session))
    } catch (e) {
      setMensaPlanError(e.toString())
    }
  }, [])

  return (
    <Container>
      <AppNavbar title="Übersicht" showBack={false}>
        <Button variant="link" onClick={() => forgetSession(router)}>
          Logout
        </Button>
        <br />
        <Button variant="link" href="/debug">
          API Playground
        </Button>
      </AppNavbar>

      <div className={styles.cardDeck}>

        <HomeCard
          title="Stundenplan"
          link="/timetable"
        >
          <ReactPlaceholder type="text" rows={4} ready={timetable || timetableError}>
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
            {timetableError &&
              <ListGroup.Item>
                {timetableError}
              </ListGroup.Item>
            }
            </ListGroup>
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          title="Mensa"
          link="/mensa"
        >
          <ReactPlaceholder type="text" rows={3} ready={mensaPlan || mensaPlanError}>
            <ListGroup variant="flush">
              {mensaPlan && mensaPlan.map((x, i) =>
                <ListGroup.Item key={i}>
                  {x}
                </ListGroup.Item>
              )}
              {mensaPlanError &&
                <ListGroup.Item>
                  {mensaPlanError}
                </ListGroup.Item>
              }
            </ListGroup>
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          title="Räume"
          link="/rooms"
        >
          Freie Räume suchen.
        </HomeCard>

        <HomeCard
          title="Bibliothek"
          link="/library"
        >
          Sitzplätze reservieren.
        </HomeCard>

        <HomeCard
          title="Prüfungen"
          link="/exams"
        >
          Prüfungstermine und -ergebnisse einsehen.
        </HomeCard>

        <HomeCard
          title="Konto"
          link="/personal"
        >
          Persönliche Daten einsehen.
        </HomeCard>

      </div>

    </Container>
  )
}
