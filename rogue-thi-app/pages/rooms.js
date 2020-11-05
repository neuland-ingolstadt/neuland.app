import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'

import styles from '../styles/Timetable.module.css'

import { obtainSession, getFreeRooms } from '../lib/thi-api-client'
import { formatFriendlyDate, formatFriendlyTime } from '../lib/date-utils'

export default function Timetable () {
  const router = useRouter()
  const [freeRooms, setFreeRooms] = useState(null)

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
          if(to < now)
            return

          if(!result.hours[hIndex]) {
            result.hours[hIndex] = {
              from: new Date(day.datum + 'T' + hour.von),
              to: new Date(day.datum + 'T' + hour.bis),
              roomTypes: {},
            }
          }

          result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume
        }))

        return result
      })
      .filter(day => Object.entries(day.hours) != 0)

    console.log(0, days)
    setFreeRooms(days)
  }, [])

  return (
    <Container>
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
