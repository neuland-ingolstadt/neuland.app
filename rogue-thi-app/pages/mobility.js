import React, { useEffect, useState } from 'react'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'

import styles from '../styles/Bus.module.css'

import AppNavbar from '../components/AppNavbar'
import { getBusPlan } from '../lib/reimplemented-api-client'
import { useTime } from '../lib/time-hook'
import { formatFriendlyRelativeTime } from '../lib/date-utils'
import { stations, defaultStation } from '../data/mobility.json'

export default function Mobility () {
  const time = useTime()
  const [location, setLocation] = useState(null)
  const [departures, setDepartures] = useState(null)

  useEffect(() => {
    setLocation(localStorage.station || defaultStation)
  }, [])

  useEffect(async () => {
    if (!location) {
      return
    }

    try {
      if () {

      }
      setDepartures(await getBusPlan(location))
      localStorage.station = station
    } catch (e) {
      setDepartures(null)
      console.error(e)
      alert(e)
    }
  }, [time, station])

  return (
    <Container>
      <AppNavbar title="Bus" />

      <Form.Group controlId="stationSelect">
        <Form.Control
          as="select"
          className={styles.stationSelect}
          value={location || ''}
          onChange={e => setLocation(e.target.value)}
        >
          {stations.map(station =>
            <option key={station.id} value={`bus/${station.id}`}>{station.name}</option>
          )}
        </Form.Control>
      </Form.Group>

      {departures && (
        <ListGroup>
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
      )}

      <br />
    </Container>
  )
}
