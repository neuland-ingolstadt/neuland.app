import { LockKeyhole } from 'lucide-react'

import { TextBlock } from 'react-placeholder/lib/placeholders'

import { formatFriendlyTime, formatRelativeMinutes } from '../date-utils'
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
    station: localStorage.mobilityStationV2 || stations.bus.defaultStation,
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
 * Fetches and parses mobility data
 * @param {string} kind Mobility type (`bus`, `train`, `parking` or `charging`)
 * @param {string} station Station name (only for `bus` or `train`)
 * @returns {object[]}
 */
export async function getMobilityEntries(kind, station) {
  if (kind === 'bus') {
    const data = await NeulandAPI.getBusPlan(station)
    return data.bus
  } else if (kind === 'train') {
    const data = await NeulandAPI.getTrainPlan(station)
    return data.train
  } else if (kind === 'parking') {
    const data = await NeulandAPI.getParkingData()
    return data.parking.lots
  } else if (kind === 'charging') {
    const data = await NeulandAPI.getCharingStationData()
    const relevantStations = [
      59362, 59340, 59360, 59358, 59356, 59200, 59354, 1770740, 22532,
    ]
    return data.charging.filter((x) => relevantStations.includes(x.id))
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
            {item.priceLevel === 'free' && (
              <span className={styles.strikethrough}>&nbsp;€&nbsp;</span>
            )}
            {item.priceLevel === 'restricted' && <LockKeyhole size={14} />}
            {item.priceLevel > 0 && '€'.repeat(item.priceLevel)}
          </div>
        )}
        <div className={styles.mobilityDestination}>{item.name}</div>
        <div className={styles.mobilityTime}>
          {item.available && item.total ? (
            <span>
              {t('transport.details.parking.available', {
                available: `${Math.round(
                  ((item.total - item.available) / item.total) * 100
                )}% - ${item.available}`,
              })}
            </span>
          ) : (
            <span>{t('transport.details.parking.unknown')}</span>
          )}
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
    const actualTime = new Date(Number(time))
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
