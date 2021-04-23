import React, { useEffect, useState } from 'react'

import ReactPlaceholder from 'react-placeholder'
import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEuroSign,
  faBus,
  faTrain,
  faCar
} from '@fortawesome/free-solid-svg-icons'
import {
  faCreativeCommonsNcEu
} from '@fortawesome/free-brands-svg-icons'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import { getBusPlan, getTrainPlan, getParkingData } from '../lib/reimplemented-api-client'
import { useTime } from '../lib/time-hook'
import { formatFriendlyRelativeTime } from '../lib/date-utils'
import { bus, train, parking } from '../data/mobility.json'

import styles from '../styles/Bus.module.css'

export function getMobilityIcon () {
  const icons = {
    bus: faBus,
    train: faTrain,
    parking: faCar
  }

  const { mobilityKind } = localStorage
  return icons[mobilityKind]
}

export function getMobilityLabel () {
  const { mobilityKind, mobilityStation } = localStorage

  if (mobilityKind === 'bus') {
    const name = bus.stations.find(x => x.id === mobilityStation).name
    return `Bus (${name})`
  } else if (mobilityKind === 'train') {
    const name = train.stations.find(x => x.id === mobilityStation).name
    return `Zug (${name})`
  } else if (mobilityKind === 'parking') {
    return 'Freie Parkplätze'
  } else {
    return 'Mobilität'
  }
}

export async function getMobilityEntries () {
  const { mobilityKind, mobilityStation } = localStorage
  if (!mobilityKind || !mobilityStation) {
    return []
  }

  if (mobilityKind === 'bus') {
    return getBusPlan(mobilityStation)
  } else if (mobilityKind === 'train') {
    return getTrainPlan(mobilityStation)
  } else if (mobilityKind === 'parking') {
    const data = await getParkingData()
    return [
      ...parking.map(x => {
        const entry = data.find(y => x.name === y.name)
        return {
          name: x.name,
          priceLevel: x.priceLevel,
          available: entry ? entry.available : null
        }
      }),
      ...data.filter(x => !parking.find(y => x.name === y.name))
    ]
  } else {
    throw new Error('Invalid mobility kind')
  }
}

export function renderMobilityEntry (item, maxLen, styles) {
  const { mobilityKind } = localStorage
  if (!mobilityKind) {
    return null
  }

  if (mobilityKind === 'bus') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.route}
        </div>
        <div className={styles.mobilityDestination}>
          {item.destination.substr(0, maxLen)}
        </div>
        <div className={styles.mobilityTime}>
          {formatFriendlyRelativeTime(new Date(item.time))}
        </div>
      </>
    )
  } else if (mobilityKind === 'train') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.name}
        </div>
        <div className={styles.mobilityDestination}>
          {item.destination.substr(0, maxLen)}
        </div>
        <div className={styles.mobilityTime}>
          {formatFriendlyRelativeTime(new Date(item.actualTime))}
        </div>
      </>
    )
  } else if (mobilityKind === 'parking') {
    return (
      <>
        {item.priceLevel && (
          <div className={styles.mobilityRoute}>
            {item.priceLevel < 0 && (
              <FontAwesomeIcon icon={faCreativeCommonsNcEu} />
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
            ? item.available
            : 'N/A'}
        </div>
      </>
    )
  } else {
    throw new Error('Invalid mobility kind')
  }
}

export default function Bus () {
  const time = useTime()
  const [mobilityKind, setMobilityKind] = useState('')
  const [station, setStation] = useState('')
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    if (localStorage.mobilityKind && localStorage.mobilityStation) {
      setMobilityKind(localStorage.mobilityKind)
      setStation(localStorage.mobilityStation)
    } else {
      setMobilityKind('train')
      setStation(train.defaultStation)
    }
  }, [])

  useEffect(async () => {
    setEntries(null)
    if (!mobilityKind || !station) {
      return
    }

    localStorage.mobilityKind = mobilityKind
    localStorage.mobilityStation = station

    try {
      setEntries(await getMobilityEntries())
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }, [time, mobilityKind, station])

  function changeMobilityKind (newKind) {
    if (newKind === 'bus') {
      setStation(bus.defaultStation)
    } else if (newKind === 'train') {
      setStation(train.defaultStation)
    }

    setMobilityKind(newKind)
  }

  return (
    <>
      <AppNavbar title={mobilityKind ? getMobilityLabel() : 'Mobilität'} />

      <AppBody>
        <Form className={styles.stationForm}>
          <Form.Group>
            <Form.Label>
              Transportmittel
            </Form.Label>
            <Form.Control
              as="select"
              value={mobilityKind}
              onChange={e => changeMobilityKind(e.target.value)}
            >
              <option value="bus">Bus</option>
              <option value="train">Zug</option>
              <option value="parking">Auto</option>
            </Form.Control>
          </Form.Group>
          {mobilityKind !== 'parking' && (
            <Form.Group>
              <Form.Label>
                Station
              </Form.Label>
              <Form.Control
                as="select"
                value={station || ''}
                onChange={e => setStation(e.target.value)}
              >
                {(mobilityKind === 'bus' ? bus.stations : train.stations).map(station =>
                  <option key={station.id} value={station.id}>{station.name}</option>
                )}
              </Form.Control>
            </Form.Group>
          )}
        </Form>

        <ListGroup>
          <ReactPlaceholder type="text" rows={10} ready={entries}>
            {entries && entries.map((item, idx) => (
              <ListGroup.Item key={idx} className={styles.mobilityItem}>
                {renderMobilityEntry(item, 200, styles)}
              </ListGroup.Item>
            ))}
          </ReactPlaceholder>
        </ListGroup>

        <br />
      </AppBody>
    </>
  )
}
