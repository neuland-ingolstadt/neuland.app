import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import styles from '../../styles/Rooms.module.css'

import AppNavbar from '../../components/AppNavbar'
import { callWithSession, NoSessionError } from '../../lib/thi-backend/thi-session-handler'
import { getFreeRooms } from '../../lib/thi-backend/thi-api-client'
import { formatNearDate, formatFriendlyTime } from '../../lib/date-utils'

const TUX_ROOMS = ['G308']

export default function Rooms () {
  const router = useRouter()
  const [freeRooms, setFreeRooms] = useState(null)

  useEffect(async () => {
    try {
      const now = new Date()
      const data = await callWithSession(
        session => getFreeRooms(session, now)
      )

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

          result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume.split(', ')
        }))

        return result
      })
        .filter(day => Object.entries(day.hours) !== 0)

      setFreeRooms(days)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.push('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  return (
    <Container>
      <AppNavbar title="Stündlicher Raumplan" />

      <ReactPlaceholder type="text" rows={20} color="#eeeeee" ready={freeRooms}>
        {freeRooms && freeRooms.map((day, i) =>
          Object.values(day.hours).map((hour, j) =>
            <ListGroup key={i + '-' + j}>
              <h4 className={styles.dateBoundary}>
                {formatNearDate(day.date)}, {formatFriendlyTime(hour.from)} - {formatFriendlyTime(hour.to)}
              </h4>

              {Object.entries(hour.roomTypes).map(([roomName, rooms], idx) =>
                <ListGroup.Item key={idx} className={styles.item}>
                  <div className={styles.left}>
                    <div className={styles.name}>
                      {roomName}
                    </div>
                    <div className={styles.room}>
                      {rooms.map((room, idx) =>
                        <>
                          {TUX_ROOMS.includes(room)
                            ? <><FontAwesomeIcon icon={faLinux} /> {room}</>
                            : <>{room}</>}
                          {idx === rooms.length - 1 ? '' : ', '}
                        </>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          )
        )}
      </ReactPlaceholder>
      <br />
    </Container>
  )
}
