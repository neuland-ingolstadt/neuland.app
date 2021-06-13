import React, { useEffect, useState } from 'react'

import ReactPlaceholder from 'react-placeholder'
import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEuroSign,
  faKey
} from '@fortawesome/free-solid-svg-icons'
import {
  faCreativeCommonsNcEu
} from '@fortawesome/free-brands-svg-icons'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getCampusParkingData } from '../lib/thi-backend/thi-api-client'
import { getBusPlan, getTrainPlan, getParkingData, getCharingStationData } from '../lib/reimplemented-api-client'
import { useTime } from '../lib/time-hook'
import { formatRelativeMinutes } from '../lib/date-utils'
import stations from '../data/mobility.json'

import styles from '../styles/Mobility.module.css'

export function getMobilitySettings () {
  return {
    kind: localStorage.mobilityKind || 'bus',
    station: localStorage.mobilityStation || stations.bus.defaultStation
  }
}

export function getMobilityLabel (kind, station) {
  if (kind === 'bus') {
    const entry = stations.bus.stations.find(x => x.id === station)
    return `Bus (${entry ? entry.name : '?'})`
  } else if (kind === 'train') {
    const entry = stations.train.stations.find(x => x.id === station)
    return `Bahn (${entry ? entry.name : '?'})`
  } else if (kind === 'parking') {
    return 'Parkplätze'
  } else if (kind === 'charging') {
    return 'Ladestationen'
  } else {
    return 'Mobilität'
  }
}

async function getAndConvertCampusParkingData () {
  let available = null
  try {
    const entries = await callWithSession(getCampusParkingData)
    available = entries.find(x => x.name === 'TG Gießerei Hochschule')?.free
    available = typeof available === 'string' ? parseInt(available) : null
  } catch (e) {
    if (!(e instanceof NoSessionError)) {
      throw e
    }
  }

  return {
    name: 'THI Campusgelände',
    available
  }
}

export async function getMobilityEntries (kind, station) {
  if (kind === 'bus') {
    return getBusPlan(station)
  } else if (kind === 'train') {
    return getTrainPlan(station)
  } else if (kind === 'parking') {
    const [data, campusEntry] = await Promise.all([
      getParkingData(),
      getAndConvertCampusParkingData()
    ])
    data.push(campusEntry)

    return [
      ...stations.parking.map(x => {
        const entry = data.find(y => x.name === y.name)
        return {
          name: x.name,
          priceLevel: x.priceLevel,
          available: entry ? entry.available : null
        }
      }),
      ...data.filter(x => !stations.parking.find(y => x.name === y.name))
    ]
  } else if (kind === 'charging') {
    const data = await getCharingStationData()
    return [
      ...stations.charging
        .map(x => data.find(y => x.id === y.id))
        .filter(x => !!x),
      ...data.filter(x => !stations.charging.find(y => x.id === y.id))
    ]
  } else {
    throw new Error('Invalid mobility kind ' + kind)
  }
}

export function renderMobilityEntry (kind, item, maxLen, styles) {
  if (kind === 'bus') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.route}
        </div>
        <div className={styles.mobilityDestination}>
          {item.destination.length <= maxLen ? item.destination : item.destination.substr(0, maxLen) + '…' }
        </div>
        <div className={styles.mobilityTime}>
          {formatRelativeMinutes(new Date(item.time))}
        </div>
      </>
    )
  } else if (kind === 'train') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.name}
        </div>
        <div className={styles.mobilityDestination}>
          {item.destination.length <= maxLen ? item.destination : item.destination.substr(0, maxLen) + '…' }
        </div>
        <div className={styles.mobilityTime}>
          {formatRelativeMinutes(new Date(item.actualTime))}
        </div>
      </>
    )
  } else if (kind === 'parking') {
    return (
      <>
        {item.priceLevel && (
          <div className={styles.mobilityRoute}>
            {item.priceLevel === 'free' && (
              <FontAwesomeIcon icon={faCreativeCommonsNcEu} />
            )}
            {item.priceLevel === 'restricted' && (
              <FontAwesomeIcon icon={faKey} />
            )}
            {item.priceLevel > 0 && new Array(item.priceLevel)
              .fill(0)
              .map((_, i) => (
                <FontAwesomeIcon key={i} icon={faEuroSign} />
              ))
            }
          </div>
        )}
        <div className={styles.mobilityDestination}>
          {item.name}
        </div>
        <div className={styles.mobilityTime}>
          {typeof item.available === 'number'
            ? item.available + ' frei'
            : 'n/a'
          }
        </div>
      </>
    )
  } else if (kind === 'charging') {
    return (
      <>
        <div className={styles.mobilityDestination}>
          {item.name}
        </div>
        <div className={styles.mobilityTime}>
          {item.available} von {item.total} frei
        </div>
      </>
    )
  } else {
    throw new Error('Invalid mobility kind')
  }
}

export default function Bus () {
  const time = useTime()
  const [kind, setKind] = useState(null)
  const [station, setStation] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const { kind, station } = getMobilitySettings()
    setKind(kind)
    setStation(station)
  }, [])

  useEffect(async () => {
    try {
      if (kind) {
        localStorage.mobilityKind = kind
        setData(null)
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
      alert(e.message)
    }
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
    <>
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
          <ReactPlaceholder type="text" rows={10} ready={data}>
            {data && data.map((item, idx) => (
              <ListGroup.Item key={idx} className={styles.mobilityItem}>
                {renderMobilityEntry(kind, item, 200, styles)}
              </ListGroup.Item>
            ))}
          </ReactPlaceholder>
        </ListGroup>

        <AppTabbar />
      </AppBody>
    </>
  )
}
