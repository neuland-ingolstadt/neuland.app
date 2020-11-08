import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import styles from '../styles/Rooms.module.css'

import { obtainSession, getFreeRooms } from '../lib/thi-api-client'
import { formatFriendlyDate, formatFriendlyTime } from '../lib/date-utils'
import { getRoomOpenings } from '../lib/api-converter'

const BUILDINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'M', 'P', 'W', 'Z']
const BUILDING_PRESET = 'G'
const DURATIONS = ['00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45', '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45', '06:00']
const DURATION_PRESET = '01:00'

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
      opening.room.toLowerCase().startsWith(building.toLowerCase()) &&
      beginDate > opening.from &&
      endDate < opening.until
    )
    .sort((a, b) => a.room.localeCompare(b.room))
}

export default function Rooms () {
  const router = useRouter()
  const [freeRooms, setFreeRooms] = useState(null)

  const [building, setBuilding] = useState(BUILDING_PRESET)
  const [date, setDate] = useState(getISODate(new Date()))
  const [time, setTime] = useState(getISOTime(new Date()))
  const [duration, setDuration] = useState(DURATION_PRESET)
  const [filterResults, setFilterResults] = useState(null)

  useEffect(async () => {
    const now = new Date()

    const session = await obtainSession(router)
    const data = await getFreeRooms(session, now)

    const days = data.rooms.map(day => {
      const result = {}
      result.date = new Date(day.datum)
      result.hours = {}

      day.rtypes.forEach(roomType => Object.entries(roomType.stunden).forEach(([hIndex, hour]) => {
        const to = new Date(day.datum + 'T' + hour.bis)
        if (to < now) { return }

        if (!result.hours[hIndex]) {
          result.hours[hIndex] = {
            from: new Date(day.datum + 'T' + hour.von),
            to: new Date(day.datum + 'T' + hour.bis),
            roomTypes: {}
          }
        }

        result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume
      }))

      return result
    })
      .filter(day => Object.entries(day.hours) !== 0)

    console.log(0, days)
    setFreeRooms(days)
  }, [])

  async function filter () {
    const session = await obtainSession(router)
    const rooms = await filterRooms(session, building, date, time, duration)
    console.log(`Found ${rooms.length} results`)
    setFilterResults(rooms)
  }

  return (
    <Container>
      <h1>Raumsuche</h1>
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
              {BUILDINGS.map(b => <option key={b}>{b}</option>)}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Zeit
            </Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
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
      </Form>
      <ListGroup>
        {filterResults && filterResults.map((result, idx) =>
          <ListGroup.Item key={idx} className={styles.item}>
            <div className={styles.left}>
              {result.room}<br />
              {result.type}
            </div>
            <div className={styles.right}>
              {formatFriendlyTime(result.from)}<br />
              {formatFriendlyTime(result.until)}
            </div>
          </ListGroup.Item>
        )}
        {filterResults && filterResults.length === 0 &&
          <ListGroup.Item className={styles.item}>
            Keine Ergebnisse
          </ListGroup.Item>
        }
      </ListGroup>
      <h1>Freie Räume</h1>
      {freeRooms && freeRooms.map((day, i) =>
        Object.values(day.hours).map((hour, j) =>
          <ListGroup key={i + '-' + j}>
            <h4 className={styles.dateBoundary}>
              {formatFriendlyDate(day.date)}, {formatFriendlyTime(hour.from)} - {formatFriendlyTime(hour.to)}
            </h4>

            {Object.entries(hour.roomTypes).map(([roomName, rooms], idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  <div className={styles.name}>
                    {roomName}
                  </div>
                  <div className={styles.room}>
                    {rooms}
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        )
      )}
      <br />
    </Container>
  )
}
