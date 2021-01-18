import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import styles from '../styles/Timetable.module.css'

import AppNavbar from '../lib/AppNavbar'
import { callWithSession, NoSessionError } from '../lib/thi-session-handler'
import { getTimetable } from '../lib/thi-api-client'
import { formatNearDate, formatFriendlyTime } from '../lib/date-utils'

async function getFriendlyTimetable () {
  const [today] = new Date().toISOString().split('T')

  const { timetable } = await callWithSession(
    async session => await getTimetable(session, new Date())
  )

  // get all available dates
  const dates = timetable
    .map(x => x.datum)
    .filter(x => x >= today)
    .filter((v, i, a) => a.indexOf(v) === i)

  // get events for each date
  const groups = dates.map(date => ({
    date: date,
    items: timetable
      .filter(x => x.datum === date)
      .map(x => {
        // parse dates
        x.start_date = new Date(`${x.datum}T${x.von}`)
        x.end_date = new Date(`${x.datum}T${x.bis}`)
        return x
      })
  }))

  return groups
}

export default function Timetable () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)

  useEffect(async () => {
    try {
      setTimetable(await getFriendlyTimetable(router))
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
      <AppNavbar title="Stundenplan" />

      <ReactPlaceholder type="text" rows={20} color="#eeeeee" ready={timetable}>
        {timetable && timetable.map((group, idx) =>
          <ListGroup key={idx}>
            <h4 className={styles.dateBoundary}>
              {formatNearDate(group.date)}
            </h4>

            {group.items.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item}>
                <div className={styles.left}>
                  <div className={styles.name}>
                    {item.veranstaltung}
                  </div>
                  <div className={styles.room}>
                    {item.raum}
                  </div>
                </div>
                <div className={styles.right}>
                  {formatFriendlyTime(item.start_date)} <br />
                  {formatFriendlyTime(item.end_date)}
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        )}
      </ReactPlaceholder>
    </Container>
  )
}
