import React, { useEffect, useState } from 'react'

import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import {
  getMobilityEntries,
  getMobilityLabel,
  getMobilitySettings,
  renderMobilityEntry
} from '../lib/backend-utils/mobility-utils'
import stations from '../data/mobility.json'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Mobility.module.css'

export default function Bus () {
  const time = useTime()
  const [kind, setKind] = useState(null)
  const [station, setStation] = useState(null)
  const [data, setData] = useState(null)
  const [dataError, setDataError] = useState(null)

  useEffect(() => {
    const { kind, station } = getMobilitySettings()
    setKind(kind)
    setStation(station)
  }, [])

  useEffect(() => {
    async function load () {
      try {
        if (kind) {
          localStorage.mobilityKind = kind
          setData(null)
          setDataError(null)
          setData(await getMobilityEntries(kind, station))
        } else {
          delete localStorage.mobilityKind
        }
        if (station) {
          localStorage.mobilityStation = station
        } else {
          delete localStorage.mobilityStation
        }
      } catch (e) {
        setDataError(e.message)
      }
    }
    load()
  }, [kind, station, time])

  function changeKind (kind) {
    setKind(kind)
    setData(null)
    if (kind === 'bus' || kind === 'train') {
      setStation(stations[kind].defaultStation)
    } else {
      setStation(null)
    }
  }

  return (
    <AppContainer>
      <AppNavbar title={getMobilityLabel(kind, station)} />

      <AppBody>
        <Form className={styles.stationForm}>
          <Form.Group>
            <Form.Label>
              Verkehrsmittel
            </Form.Label>
            <Form.Control
              as="select"
              value={kind}
              onChange={e => changeKind(e.target.value)}
            >
              <option value="bus">Bus</option>
              <option value="train">Bahn</option>
              <option value="parking">Auto</option>
              <option value="charging">E-Auto</option>
            </Form.Control>
          </Form.Group>
          {(kind === 'bus' || kind === 'train') && (
            <Form.Group>
              <Form.Label>
                Bahnhof / Haltestelle
              </Form.Label>
              <Form.Control
                as="select"
                value={station || ''}
                onChange={e => setStation(e.target.value)}
              >
                {kind && stations[kind].stations.map(station =>
                  <option key={station.id} value={station.id}>{station.name}</option>
                )}
              </Form.Control>
            </Form.Group>
          )}
        </Form>

        <ListGroup>
          <ReactPlaceholder type="text" rows={10} ready={data || dataError}>
            {dataError && (
              <ListGroup.Item className={styles.mobilityItem}>
                Fehler beim Abruf!<br />
                {dataError}
              </ListGroup.Item>
            )}
            {data && data.length === 0 &&
              <ListGroup.Item className={styles.mobilityItem}>
                Keine Elemente.
              </ListGroup.Item>
            }
            {data && data.map((item, idx) => (
              <ListGroup.Item key={idx} className={styles.mobilityItem}>
                {renderMobilityEntry(kind, item, 200, styles)}
              </ListGroup.Item>
            ))}
          </ReactPlaceholder>
        </ListGroup>

        <AppTabbar />
      </AppBody>
    </AppContainer>
  )
}
