import React from 'react'

import { faEuroSign, faKey } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCreativeCommonsNcEu } from '@fortawesome/free-brands-svg-icons'

import API from '../backend/authenticated-api'
import NeulandAPI from '../backend/neuland-api'
import { formatRelativeMinutes, formatFriendlyTime } from '../date-utils'

import stations from '../../data/mobility.json'

/**
 * Retrieves the users mobility preferences.
 * @returns {object}
 */
export function getMobilitySettings () {
  return {
    kind: localStorage.mobilityKind || 'bus',
    station: localStorage.mobilityStation || stations.bus.defaultStation
  }
}

/**
 * Determines the title of the mobility card / page.
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {string} station Station name (only for `bus` or `train`)
 * @param {object} t Translation object
 * @returns {string}
 */
export function getMobilityLabel (kind, station, t) {
  switch (kind) {
    case 'bus': {
      const busEntry = stations.bus.stations.find(x => x.id === station)
      return t('transport.title.bus', { station: busEntry ? busEntry.name : '?' })
    }
    case 'train': {
      const trainEntry = stations.train.stations.find(x => x.id === station)
      return t('transport.title.train', { station: trainEntry ? trainEntry.name : '?' })
    }
    case 'parking':
      return t('transport.title.parking')
    case 'charging':
      return t('transport.title.charging')
    default:
      return t('transport.title.unknown')
  }
}

/**
 * Fetches and parses parking availability for the campus
 * @returns {object}
 */
async function getAndConvertCampusParkingData () {
  let available = null
  try {
    const entries = await API.getCampusParkingData()
    available = entries.find(x => x.name === 'TG Gießerei Hochschule')?.free
    available = typeof available === 'string' ? parseInt(available) : null
  } catch (e) {
    available = null
  }

  return {
    name: 'Congressgarage (Mitarbeiter)',
    available
  }
}

/**
 * Fetches and parses mobility data
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {string} station Station name (only for `bus` or `train`)
 * @returns {object[]}
 */
export async function getMobilityEntries (kind, station) {
  if (kind === 'bus') {
    return NeulandAPI.getBusPlan(station)
  } else if (kind === 'train') {
    return NeulandAPI.getTrainPlan(station)
  } else if (kind === 'parking') {
    const [data, campusEntry] = await Promise.all([
      NeulandAPI.getParkingData(),
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
    const data = await NeulandAPI.getCharingStationData()
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

/**
 * Renders a row on the mobility page.
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {object} item Mobility data
 * @param {number} maxLen Truncate the string after this many characters
 * @param {string} styles CSS object
 */
export function renderMobilityEntry (kind, item, maxLen, styles) {
  if (kind === 'bus') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.route}
        </div>
        <div className={styles.mobilityDestination}>
          {item.destination}
        </div>
        <div className={styles.mobilityTime}>
          { formatFriendlyTime(new Date(item.time))} ({'in'} { formatRelativeMinutes(new Date(item.time)) })
        </div>
      </>
    )
  } else if (kind === 'train') {
    return (
      <>
        <div className={styles.mobilityRoute}>
          {item.name}
        </div>
        <div className={`${styles.mobilityDestination} ${item.canceled ? styles.mobilityCanceled : ''}`}>
          {item.destination.length <= maxLen ? item.destination : item.destination.substr(0, maxLen) + '…'}
        </div>
        <div className={`${styles.mobilityTime} ${item.canceled ? styles.mobilityCanceled : ''}`}>
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
              <FontAwesomeIcon title="Kostenlos" icon={faCreativeCommonsNcEu} />
            )}
            {item.priceLevel === 'restricted' && (
              <FontAwesomeIcon title="Zugangsbeschränkt" icon={faKey} />
            )}
            {item.priceLevel > 0 && new Array(item.priceLevel)
              .fill(0)
              .map((_, i) => (
                <FontAwesomeIcon title="Kostenpflichtig" key={i} icon={faEuroSign} />
              ))}
          </div>
        )}
        <div className={styles.mobilityDestination}>
          {item.name}
        </div>
        <div className={styles.mobilityTime}>
          {typeof item.available === 'number'
            ? item.available + ' frei'
            : 'n/a'}
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
