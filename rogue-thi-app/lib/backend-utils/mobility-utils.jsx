import { Euro, LockKeyhole } from 'lucide-react'

import { TextBlock } from 'react-placeholder/lib/placeholders'

import { formatFriendlyTime, formatRelativeMinutes } from '../date-utils'
import API from '../backend/authenticated-api'
import NeulandAPI from '../backend/neuland-api'

import stations from '../../data/mobility.json'
import { useTranslation } from 'next-i18next'

/**
 * Retrieves the users mobility preferences.
 * @returns {object}
 */
export function getMobilitySettings() {
  return {
    kind: localStorage.mobilityKind || 'bus',
    station: localStorage.mobilityStation || stations.bus.defaultStation,
  }
}

/**
 * Determines the title of the mobility card / page.
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {string} station Station name (only for `bus` or `train`)
 * @param {object} t Translation object
 * @returns {string}
 */
export function getMobilityLabel(kind, station, t) {
  switch (kind) {
    case 'bus': {
      const busEntry = stations.bus.stations.find((x) => x.id === station)
      return t('transport.title.bus', {
        station: busEntry ? busEntry.name : '?',
      })
    }
    case 'train': {
      const trainEntry = stations.train.stations.find((x) => x.id === station)
      return t('transport.title.train', {
        station: trainEntry ? trainEntry.name : '?',
      })
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
async function getAndConvertCampusParkingData() {
  let available = null
  try {
    const entries = await API.getCampusParkingData()
    available = entries.find((x) => x.name === 'TG Gießerei Hochschule')?.free
    available = typeof available === 'string' ? parseInt(available) : null
  } catch (e) {
    available = null
  }

  return {
    name: 'Congressgarage',
    available,
  }
}

/**
 * Fetches and parses mobility data
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {string} station Station name (only for `bus` or `train`)
 * @returns {object[]}
 */
export async function getMobilityEntries(kind, station) {
  if (kind === 'bus') {
    return NeulandAPI.getBusPlan(station)
  } else if (kind === 'train') {
    return NeulandAPI.getTrainPlan(station)
  } else if (kind === 'parking') {
    const [data, campusEntry] = await Promise.all([
      NeulandAPI.getParkingData(),
      getAndConvertCampusParkingData(),
    ])
    data.push(campusEntry)

    return [
      ...stations.parking.map((x) => {
        const entry = data.find((y) => x.name === y.name)
        return {
          name: x.name,
          priceLevel: x.priceLevel,
          available: entry ? entry.available : null,
        }
      }),
      ...data.filter((x) => !stations.parking.find((y) => x.name === y.name)),
    ]
  } else if (kind === 'charging') {
    const data = await NeulandAPI.getCharingStationData()
    return [
      ...stations.charging
        .map((x) => data.find((y) => x.id === y.id))
        .filter((x) => !!x),
      ...data.filter((x) => !stations.charging.find((y) => x.id === y.id)),
    ]
  } else {
    throw new Error('Invalid mobility kind ' + kind)
  }
}

export function RenderMobilityEntryPlaceholder({ kind, styles }) {
  if (kind === 'charging') {
    return (
      <>
        <div
          className={`${styles.mobilityDestination} ${styles.placeholder_4_0}`}
        >
          <TextBlock rows={1} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className={styles.mobilityRoute}>- - -</div>
      <div className={styles.mobilityDestination}>
        <TextBlock rows={1} />
      </div>
    </>
  )
}

/**
 * Renders a row on the mobility page.
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {object} item Mobility data
 * @param {number} maxLen Truncate the string after this many characters
 * @param {string} styles CSS object
 */
export function RenderMobilityEntry({ kind, item, maxLen, styles, detailed }) {
  const { t } = useTranslation('mobility')

  if (kind === 'bus') {
    const timeString = formatTimes(item.time, 30, 30)

    return (
      <>
        <div className={styles.mobilityRoute}>{item.route}</div>
        <div className={styles.mobilityDestination}>{item.destination}</div>
        <div className={styles.mobilityTime}>{timeString}</div>
      </>
    )
  } else if (kind === 'train') {
    const timeString = formatTimes(item.actualTime, 30, 90)

    return (
      <>
        <div className={styles.mobilityRoute}>{item.name}</div>
        <div
          className={`${styles.mobilityDestination} ${
            item.canceled ? styles.mobilityCanceled : ''
          }`}
        >
          {item.destination.length <= maxLen
            ? item.destination
            : item.destination.substr(0, maxLen) + '…'}
        </div>
        <div
          className={`${styles.mobilityTime} ${
            item.canceled ? styles.mobilityCanceled : ''
          }`}
        >
          {timeString}
        </div>
      </>
    )
  } else if (kind === 'parking') {
    return (
      <>
        {item.priceLevel && (
          <div className={styles.mobilityRoute}>
            {item.priceLevel === 'free' && <Euro size={16} />}
            {item.priceLevel === 'restricted' && <LockKeyhole size={16} />}
            {item.priceLevel > 0 &&
              new Array(item.priceLevel).fill(0).map((_, i) => (
                <Euro
                  key={i}
                  size={16}
                  style={{ marginLeft: i === 0 ? 0 : -5 }}
                />
              ))}
          </div>
        )}
        <div className={styles.mobilityDestination}>{item.name}</div>
        <div className={styles.mobilityTime}>
          {typeof item.available === 'number'
            ? t('transport.details.parking.available', {
                available: item.available,
              })
            : t('transport.details.parking.unknown')}
        </div>
      </>
    )
  } else if (kind === 'charging') {
    return (
      <>
        <div className={styles.mobilityDestination}>{item.name}</div>
        <div className={styles.mobilityTime}>
          {t('transport.details.charging.available', {
            available: item.available,
            total: item.total,
          })}
        </div>
      </>
    )
  } else {
    throw new Error('Invalid mobility kind')
  }

  /**
   * Formats the time difference between the current time and the given time.
   * @param {string} time - The time to format.
   * @param {number} cardMin - The number of minutes to show relative time for on the card.
   * @param {number} detailedMin - The number of minutes to relative time for in the detailed view.
   * @param {boolean} detailed - Whether to return a detailed time string (card vs page)
   * @returns {string} The formatted time string.
   */
  function formatTimes(time, cardMin, detailedMin) {
    const cardMs = cardMin * 60 * 1000
    const detailedMs = detailedMin * 60 * 1000
    const actualTime = new Date(time)
    const timeDifference = actualTime - new Date()
    let timeString

    if (detailed) {
      timeString = `${formatFriendlyTime(actualTime)} ${
        timeDifference < detailedMs
          ? `- ${formatRelativeMinutes(actualTime)}`
          : ''
      }`
    } else {
      if (timeDifference > cardMs) {
        timeString = formatFriendlyTime(actualTime)
      } else {
        timeString = `in ${formatRelativeMinutes(actualTime)}`
      }
    }
    return timeString
  }
}
