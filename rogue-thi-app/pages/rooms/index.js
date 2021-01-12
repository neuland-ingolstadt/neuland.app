import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import styles from '../../styles/Rooms.module.css'

import AppNavbar from '../../lib/AppNavbar'
import { callWithSession } from '../../lib/thi-session-handler'
import { getFreeRooms } from '../../lib/thi-api-client'
import { formatFriendlyTime } from '../../lib/date-utils'
import { getRoomOpenings } from '../../lib/api-converter'

const BUILDINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'M', 'P', 'W', 'Z']
const BUILDINGS_ALL = 'Alle'
const DURATIONS = ['00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45', '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45', '06:00']
const DURATION_PRESET = '01:00'
const TUX_ROOMS = ['G308']

function getISODate (date) {
  return date.getFullYear().toString().padStart(4, '0') + '-' +
    (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
    date.getDate().toString().padStart(2, '0')
}

function getISOTime (date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

async function filterRooms (session, building, date, time, duration) {
  const beginDate = new Date(date + 'T' + time)

  const [durationHours, durationMinutes] = duration.split(':').map(x => parseInt(x, 10))
  const endDate = new Date(
    beginDate.getFullYear(),
    beginDate.getMonth(),
    beginDate.getDate(),
    beginDate.getHours() + durationHours,
    beginDate.getMinutes() + durationMinutes,
    beginDate.getSeconds(),
    beginDate.getMilliseconds()
  )

  console.log(`Filtering from ${beginDate} until ${endDate}`)

  const data = await getFreeRooms(session, beginDate)
  const openings = getRoomOpenings(data.rooms, date)
  return Object.keys(openings)
    .flatMap(room =>
      openings[room].map(opening => ({
        room,
        type: opening.type,
        from: opening.from,
        until: opening.until
      }))
    )
    .filter(opening =>
      (building === BUILDINGS_ALL || opening.room.toLowerCase().startsWith(building.toLowerCase())) &&
      beginDate >= opening.from &&
      endDate <= opening.until
    )
    .sort((a, b) => a.room.localeCompare(b.room))
}

export default function Rooms () {
  const router = useRouter()

  const startDate = new Date()
  if(startDate.getHours() > 17 || (startDate.getHours() == 17 && startDate.getMinutes() >= 20)) {
    startDate.setDate(startDate.getDate() + 1)
    startDate.setHours(8)
    startDate.setMinutes(15)
  }

  const [building, setBuilding] = useState(BUILDINGS_ALL)
  const [date, setDate] = useState(getISODate(startDate))
  const [time, setTime] = useState(getISOTime(startDate))
  const [duration, setDuration] = useState(DURATION_PRESET)

  const [searching, setSearching] = useState(false)
  const [filterResults, setFilterResults] = useState(null)

  async function filter () {
    setSearching(true)
    setFilterResults(null)

    const rooms = await callWithSession(
      () => router.push('/login'),
      session => filterRooms(session, building, date, time, duration)
    )

    console.log(`Found ${rooms.length} results`)
    setFilterResults(rooms)
  }

  useEffect(() => filter(), [])

  return (
    <Container>
      <AppNavbar title="Raumsuche" />

      <Form>
        <div className={styles.searchForm}>
          <Form.Group>
            <Form.Label>
              Gebäude
            </Form.Label>
            <Form.Control
              as="select"
              value={building}
              onChange={e => setBuilding(e.target.value)}
            >
              <option key={BUILDINGS_ALL}>{BUILDINGS_ALL}</option>
              {BUILDINGS.map(b => <option key={b}>{b}</option>)}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Datum
            </Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Zeit
            </Form.Label>
            <Form.Control
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Dauer
            </Form.Label>
            <Form.Control
              as="select"
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </Form.Control>
          </Form.Group>
        </div>
        <Button onClick={() => filter()}>
          Suchen
        </Button>
        <Link href="/map">
          <Button variant="link">Karte anzeigen</Button>
        </Link>
        <Link href="/rooms/list">
          <Button variant="link">Stündlichen Plan anzeigen</Button>
        </Link>
      </Form>

      <br />

      {searching &&
        <ReactPlaceholder type="text" rows={10} color="#eeeeee" ready={filterResults}>
          <ListGroup variant="flush">
            {filterResults && filterResults.map((result, idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  {TUX_ROOMS.includes(result.room) && <><FontAwesomeIcon icon={faLinux} /> </>}
                  {result.room}

                  <div className={styles.details}>
                    {result.type}
                  </div>
                </div>
                <div className={styles.right}>
                  frei ab {formatFriendlyTime(result.from)}<br />
                  bis {formatFriendlyTime(result.until)}
                </div>
              </ListGroup.Item>
            )}
            {filterResults && filterResults.length === 0 &&
              <ListGroup.Item className={styles.item}>
                Keine Ergebnisse
              </ListGroup.Item>
            }
          </ListGroup>
        </ReactPlaceholder>
      }
    </Container>
  )
}
