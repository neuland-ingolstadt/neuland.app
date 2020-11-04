import React, { useEffect, useState } from 'react'
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

import { getPersonalData, getTimetable, getMensaPlan } from '../lib/thi-api-client'

async function getPersonalDataPreview () {
  const resp = await getPersonalData(localStorage.session)
  return resp.persdata.user
}

async function getTimetablePreview () {
  const resp = await getTimetable(localStorage.session, new Date())
  const now = new Date()

  const nextItems = resp.timetable
    .map(x => {
      // parse dates
      x.start_date = new Date(`${x.datum} ${x.von}`)
      x.end_date = new Date(`${x.datum} ${x.bis}`)
      return x
    })
    .filter(x => x.end_date > now)
    .sort((a, b) => a.start_date - b.start_date)

  return nextItems[0]
}

async function getMensaPlanPreview () {
  const resp = await getMensaPlan(localStorage.session)

  return Object.values(resp.gerichte)
    .map(x => x.name[1])
}

function formatFriendlyDateTime (datetime) {
  if (!datetime) {
    return null
  }

  let date
  if (datetime.toDateString() === new Date().toDateString()) {
    date = 'Heute'
  } else {
    date = datetime.toLocaleDateString()
  }

  const time = datetime.toLocaleTimeString()

  return `${date}, ${time}`
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

  useEffect(() => {
    getPersonalDataPreview()
      .then(resp => setPersonalData(resp))
      .catch(console.error)
    getTimetablePreview()
      .then(resp => setTimetable(resp))
      .catch(console.error)
    getMensaPlanPreview()
      .then(resp => setMensaPlan(resp))
      .catch(console.error)
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
          <ReactPlaceholder type="text" rows={2} ready={timetable}>
            <div>
              {timetable && timetable.veranstaltung}
            </div>
            <div className="text-muted">
              {timetable && formatFriendlyDateTime(timetable.start_date)}
            </div>
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
