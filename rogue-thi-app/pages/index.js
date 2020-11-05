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

import { obtainSession, getPersonalData, getTimetable, getMensaPlan } from '../lib/thi-api-client'
import { formatFriendlyDateTime } from '../lib/date-utils'

async function getPersonalDataPreview (session) {
  const resp = await getPersonalData(session)
  return `${resp.persdata.vname} ${resp.persdata.name} (${resp.persdata.user})`
}

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
  const resp = await getMensaPlan(session)

  return Object.values(resp.gerichte)
    .map(x => x.name[1])
}

function HomeCard ({ link, title, children }) {
  return (
    <Link href={link}>
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title>
            {title}
          </Card.Title>
          <Card.Text>
            {children}
          </Card.Text>
        </Card.Body>
          <Button variant="link" className={styles.cardButton}>
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
      </Card>
    </Link>
  )
}
HomeCard.propTypes = {
  link: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.array
}

export default function Home () {
  const [personalData, setPersonalData] = useState(null)
  const [timetable, setTimetable] = useState(null)
  const [mensaPlan, setMensaPlan] = useState(null)
  const router = useRouter()

  useEffect(async () => {
    const session = await obtainSession(router)

    Promise.all([
      getPersonalDataPreview(session)
        .then(resp => setPersonalData(resp)),
      getTimetablePreview(session)
        .then(resp => setTimetable(resp)),
      getMensaPlanPreview(session)
        .then(resp => setMensaPlan(resp))
    ])
      .catch(err => {
        console.error(err)
        router.push('/login')
      })
  }, [])

  return (
    <Container>

      <div className={styles.cardDeck}>
        <HomeCard
          title="Konto"
          link="/personal"
        >
          <ReactPlaceholder type="text" rows={1} ready={personalData}>
            Eingeloggt als {personalData}.
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          title="Stundenplan"
          link="/timetable"
        >
          <ReactPlaceholder type="text" rows={4} ready={timetable}>
            <ListGroup variant="flush">
            {timetable && timetable.map((x, i) =>
              <ListGroup.Item key={i}>
                <div>
                  {x.veranstaltung}, {x.raum}
                </div>
                <div className="text-muted">
                  {formatFriendlyDateTime(x.start_date)}
                </div>
              </ListGroup.Item>
            )}
            </ListGroup>
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          title="Speiseplan"
          link="/meals"
        >
          <ReactPlaceholder type="text" rows={3} ready={mensaPlan}>
            <ListGroup variant="flush">
              {mensaPlan && mensaPlan.map((x, i) =>
                <ListGroup.Item key={i}>
                  {x}
                </ListGroup.Item>
              )}
            </ListGroup>
          </ReactPlaceholder>
        </HomeCard>

        <HomeCard
          title="Noten und Prüfungen"
          link="/exams"
        >
          Prüfungstermine und Ergebnisse
        </HomeCard>

        <HomeCard
          title="Räume"
          link="/rooms"
        >
          Einen freien Raum finden.
        </HomeCard>

        <HomeCard
          title="Bibliothek"
          link="/library"
        >
          Einen Platz reservieren.
        </HomeCard>

      </div>

    </Container>
  )
}
