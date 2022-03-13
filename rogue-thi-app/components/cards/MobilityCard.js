import React, { useEffect, useMemo, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import {
  faBus,
  faCar,
  faChargingStation,
  faTrain
} from '@fortawesome/free-solid-svg-icons'

import {
  getMobilityEntries,
  getMobilityLabel,
  getMobilitySettings,
  renderMobilityEntry
} from '../../lib/backend-utils/mobility-utils'
import BaseCard from './BaseCard'
import { useTime } from '../../lib/hooks/time-hook'

import styles from '../../styles/Home.module.css'

const MAX_STATION_LENGTH = 20
const MOBILITY_ICONS = {
  bus: faBus,
  train: faTrain,
  parking: faCar,
  charging: faChargingStation
}

export default function MobilityCard () {
  const time = useTime()
  const [mobility, setMobility] = useState(null)
  const [mobilityError, setMobilityError] = useState(null)
  const [mobilitySettings, setMobilitySettings] = useState(null)

  const mobilityIcon = useMemo(() => {
    return mobilitySettings ? MOBILITY_ICONS[mobilitySettings.kind] : faBus
  }, [mobilitySettings])
  const mobilityLabel = useMemo(() => {
    return mobilitySettings ? getMobilityLabel(mobilitySettings.kind, mobilitySettings.station) : 'Mobilität'
  }, [mobilitySettings])

  useEffect(() => {
    setMobilitySettings(getMobilitySettings())
  }, [])

  useEffect(() => {
    async function load () {
      if (!mobilitySettings) {
        return
      }

      try {
        setMobility(await getMobilityEntries(mobilitySettings.kind, mobilitySettings.station))
      } catch (e) {
        console.error(e)
        setMobilityError('Fehler beim Abruf.')
      }
    }
    load()
  }, [mobilitySettings, time])

  return (
    <BaseCard
      icon={mobilityIcon}
      title={mobilityLabel}
      link="/mobility"
    >
      <ReactPlaceholder type="text" rows={5} ready={mobility || mobilityError}>
        <ListGroup variant="flush">
          {mobility && mobility.slice(0, 4).map((entry, i) => <ListGroup.Item key={i} className={styles.mobilityItem}>
            {renderMobilityEntry(mobilitySettings.kind, entry, MAX_STATION_LENGTH, styles)}
          </ListGroup.Item>
          )}
          {mobility && mobility.length === 0 &&
            <ListGroup.Item>
              Keine Elemente.
            </ListGroup.Item>}
          {mobilityError &&
            <ListGroup.Item>
              Fehler beim Abruf.
            </ListGroup.Item>}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
