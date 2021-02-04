import React, { useEffect, useState } from 'react'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'

import styles from '../styles/Bus.module.css'

import AppNavbar from '../lib/AppNavbar'
import { getBusPlan } from '../lib/reimplemented-api-client'
import { useTime } from '../lib/time-hook'
import { formatFriendlyRelativeTime } from '../lib/date-utils'

export default function Bus () {
  const time = useTime()
  const [departures, setDepartures] = useState(null)

  useEffect(async () => {
    try {
      setDepartures(await getBusPlan('zob'))
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }, [time])

  return (
    <Container>
      <AppNavbar title="Bus: ZOB" />

      <ListGroup variant="flush">
        <ReactPlaceholder type="text" rows={10} color="#eeeeee" ready={departures}>
          {departures && departures.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.route}>
                {item.route}
              </div>
              <div className={styles.destination}>
                {item.destination}
              </div>
              <div className={styles.time}>
                {formatFriendlyRelativeTime(new Date(item.time), time)}
              </div>
            </ListGroup.Item>
          )}
        </ReactPlaceholder>
      </ListGroup>

      <br />
    </Container>
  )
}
