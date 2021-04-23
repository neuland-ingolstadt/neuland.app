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

const mobilityIcons = {
  bus: faBus,
  train: faTrain,
  parking: faCar
}

function getMobilityLabel (kind, station) {
  if (kind === 'bus') {
    const entry = bus.stations.find(x => x.id === station)
    return `Bus (${entry ? entry.name : '?'})`
  } else if (kind === 'train') {
    const entry = train.stations.find(x => x.id === station)
    return `Zug (${entry ? entry.name : '?'})`
  } else if (kind === 'parking') {
    return 'Freie Parkplätze'
  } else {
    return 'Mobilität'
  }
}

export function useMobilityData () {
  const [isInitialized, setIsInitialized] = useState(false)
  const [kind, setKind] = useState('train')
  const [station, setStation] = useState(train.defaultStation)
  const [data, setData] = useState(null)
  const [icon, setIcon] = useState(faTrain)
  const [label, setLabel] = useState('Mobilität')
  const time = useTime()

  useEffect(async () => {
    if (!isInitialized && localStorage.mobilityKind && localStorage.mobilityStation) {
      setKind(localStorage.mobilityKind)
      setStation(localStorage.mobilityStation)
      setIsInitialized(true)
      return
    }

    setIcon(mobilityIcons[kind])
    setLabel(getMobilityLabel(kind, station))
    setData(await getMobilityEntries(kind, station))
  }, [time, kind, station])

  return {
    data,
    icon,
    label,

    kind,
    setKind: value => {
      localStorage.mobilityKind = value
      setData(null)
      setKind(value)
    },

    station,
    setStation: value => {
      localStorage.mobilityStation = value
      setData(null)
      setStation(value)
    }
  }
}

async function getMobilityEntries (kind, station) {
  if (kind === 'bus') {
    return getBusPlan(station)
  } else if (kind === 'train') {
    return getTrainPlan(station)
  } else if (kind === 'parking') {
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
    throw new Error('Invalid mobility kind ' + kind)
  }
}

export function renderMobilityEntry (data, item, maxLen, styles) {
  if (data.kind === 'bus') {
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
  } else if (data.kind === 'train') {
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
  } else if (data.kind === 'parking') {
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
  const data = useMobilityData()

  function changeMobilityKind (newKind) {
    if (newKind === 'bus') {
      data.setStation(bus.defaultStation)
    } else if (newKind === 'train') {
      data.setStation(train.defaultStation)
    }

    data.setKind(newKind)
  }

  return (
    <>
      <AppNavbar title={data.label} />

      <AppBody>
        <Form className={styles.stationForm}>
          <Form.Group>
            <Form.Label>
              Transportmittel
            </Form.Label>
            <Form.Control
              as="select"
              value={data.kind}
              onChange={e => changeMobilityKind(e.target.value)}
            >
              <option value="bus">Bus</option>
              <option value="train">Zug</option>
              <option value="parking">Auto</option>
            </Form.Control>
          </Form.Group>
          {data.kind !== 'parking' && (
            <Form.Group>
              <Form.Label>
                Station
              </Form.Label>
              <Form.Control
                as="select"
                value={data.station || ''}
                onChange={e => data.setStation(e.target.value)}
              >
                {(data.kind === 'bus' ? bus.stations : train.stations).map(station =>
                  <option key={station.id} value={station.id}>{station.name}</option>
                )}
              </Form.Control>
            </Form.Group>
          )}
        </Form>

        <ListGroup>
          <ReactPlaceholder type="text" rows={10} ready={data.data}>
            {data.data && data.data.map((item, idx) => (
              <ListGroup.Item key={idx} className={styles.mobilityItem}>
                {renderMobilityEntry(data, item, 200, styles)}
              </ListGroup.Item>
            ))}
          </ReactPlaceholder>
        </ListGroup>

        <br />
      </AppBody>
    </>
  )
}
