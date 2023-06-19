import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import Link from 'next/link'
import { useRouter } from 'next/router'

import Form from 'react-bootstrap/Form'

import { AttributionControl, CircleMarker, FeatureGroup, LayerGroup, LayersControl, MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet'

import { NoSessionError, UnavailableSessionError } from '../lib/backend/thi-session-handler'
import { USER_GUEST, useUserKind } from '../lib/hooks/user-kind'
import { filterRooms, getNextValidDate } from '../lib/backend-utils/rooms-utils'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../lib/date-utils'
import { useLocation } from '../lib/hooks/geolocation'

import styles from '../styles/RoomMap.module.css'
import { useTranslation } from 'next-i18next'

const SPECIAL_ROOMS = {
  G308: { text: 'Linux PC-Pool', color: '#F5BD0C' }
}
const SEARCHED_PROPERTIES = [
  'Gebaeude',
  'Raum',
  'Funktion'
]
const FLOOR_SUBSTITUTES = {
  0: 'EG', // room G0099
  OG: '1', // floor 1 in H (Carissma)
  AG: '1.5', // floor 1.5 in A
  G: '1.5', // floor 1.5 in H (Reimanns)
  null: '4' // floor 4 in Z (Arbeitsamt),
}
const FLOOR_ORDER = [
  '4',
  '3',
  '2',
  '1.5',
  '1',
  'EG'
]
const DEFAULT_CENTER = [48.76630, 11.43330]

const SPECIAL_COLORS = [...new Set(Object.values(SPECIAL_ROOMS).map(x => x.color))]

/**
 * Room map based on Leaflet.
 * Implemented as a component because this is the best way to bypass SSR, which is incompatible with Leaflet.
 */
export default function RoomMap ({ highlight, roomData }) {
  const router = useRouter()
  const searchField = useRef()
  const location = useLocation()
  const userKind = useUserKind()
  const [searchText, setSearchText] = useState(highlight ? highlight.toUpperCase() : '')
  const [availableRooms, setAvailableRooms] = useState(null)

  const { t } = useTranslation('rooms')

  /**
   * Preprocessed room data for Leaflet.
   */
  const allRooms = useMemo(() => {
    return roomData.features
      .map(feature => {
        const { properties, geometry } = feature

        if (!geometry || !geometry.coordinates || geometry.type !== 'Polygon') {
          return []
        }

        if (properties.Etage in FLOOR_SUBSTITUTES) {
          properties.Etage = FLOOR_SUBSTITUTES[properties.Etage]
        }
        if (FLOOR_ORDER.indexOf(properties.Etage) === -1) {
          FLOOR_ORDER.push(properties.Etage)
        }

        return geometry.coordinates.map(points => ({
          properties,
          coordinates: points.map(([lon, lat]) => [lat, lon]),
          options: { }
        }))
      })
      .flat()
  }, [roomData])

  /**
   * Preprocessed and filtered room data for Leaflet.
   */
  const [filteredRooms, center] = useMemo(() => {
    if (!searchText) {
      return [allRooms, DEFAULT_CENTER]
    }

    const getProp = (room, prop) => room.properties[prop]?.toUpperCase()
    const fullTextSearcher = room => SEARCHED_PROPERTIES.some(x => getProp(room, x)?.includes(searchText))
    const roomOnlySearcher = room => getProp(room, 'Raum').startsWith(searchText)
    const filtered = allRooms.filter(/^[A-Z](G|[0-9E]\.)?\d*$/.test(searchText) ? roomOnlySearcher : fullTextSearcher)

    let lon = 0
    let lat = 0
    let count = 0
    filtered.forEach(x => {
      lon += x.coordinates[0][0]
      lat += x.coordinates[0][1]
      count += 1
    })
    const filteredCenter = count > 0 ? [lon / count, lat / count] : DEFAULT_CENTER

    return [filtered, filteredCenter]
  }, [searchText, allRooms])

  useEffect(() => {
    async function load () {
      try {
        const dateObj = getNextValidDate()
        const date = formatISODate(dateObj)
        const time = formatISOTime(dateObj)
        const rooms = await filterRooms(date, time)
        setAvailableRooms(rooms)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          setAvailableRooms(null)
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router, highlight, userKind])

  /**
   * Translates the floor name to the current language.
   * @param {string} floor The floor name as specified in the data
   * @returns The translated floor name (or the original if not found)
   */
  function translateFloors (floor) {
    const translated = t(`rooms.map.floors.${floor.toLowerCase()}`)

    if (translated.startsWith('rooms.')) {
      return floor
    }

    return translated
  }

  /**
   * Removes focus from the search.
   */
  function unfocus (e) {
    e.preventDefault()
    searchField.current?.blur()
  }

  /**
   * Renders a room polygon.
   * @param {object} entry GeoJSON feature
   * @param {string} key Unique key that identifies the feature
   * @param {boolean} onlyAvailable Display only rooms that are currently free
   * @returns Leaflet feature object
   */
  function renderRoom (entry, key, onlyAvailable) {
    const avail = availableRooms?.find(x => x.room === entry.properties.Raum)
    if ((avail && !onlyAvailable) || (!avail && onlyAvailable)) {
      return null
    }

    const special = SPECIAL_ROOMS[entry.properties.Raum]

    let color = '#6c757d'
    if (special) {
      color = special.color
    } else if (avail) {
      color = '#8845ef'
    }

    return (
      <FeatureGroup key={key}>
        <Popup>
          <strong>
            {entry.properties.Raum}
          </strong>
          {`, ${entry.properties.Funktion}`} <br />
          {avail && (
            <>
              {t('rooms.map.free_from_until', {
                from: formatFriendlyTime(avail.from),
                until: formatFriendlyTime(avail.until)
              })}
              <br />
            </>
          )}
          {!avail && availableRooms && (
            <>
              {t('rooms.map.occupied')}
            </>
          )}
          {special?.text}
        </Popup>
        <Polygon
          positions={entry.coordinates}
          pathOptions={{
            ...entry.options,
            color
          }}
        />
      </FeatureGroup>
    )
  }

  /**
   * Renders an entire floor.
   * @param {string} floorName The floor name as specified in the data
   * @returns Leaflet layer group
   */
  function renderFloor (floorName) {
    const floorRooms = filteredRooms
      .filter(x => x.properties.Etage === floorName)

    return (
      <LayerGroup>
        <>{floorRooms.map((entry, j) => renderRoom(entry, j, false))}</>
        {/* we first render all gray rooms and then the colored ones to make
            sure the colored border overlap the gray ones */}
        <>{floorRooms.map((entry, j) => renderRoom(entry, j, true))}</>
      </LayerGroup>
    )
  }

  return (
    <>
      <Form className={styles.searchForm} onSubmit={e => unfocus(e)}>
        <Form.Control
          as="input"
          placeholder={t('rooms.map.search_placeholder')}
          value={searchText}
          onChange={e => setSearchText(e.target.value.toUpperCase())}
          isInvalid={filteredRooms.length === 0}
          ref={searchField}
        />
        <div className={styles.links}>
          <Link href="/rooms/search">
            <a className={styles.linkToSearch}>
              {t('rooms.map.extended_search')}
            </a>
          </Link>
          {userKind !== USER_GUEST &&
            <>
              <> · </>
              <Link href="/rooms/suggestions">
                <a className={styles.linkToSearch}>
                  {t('rooms.map.automatic_suggestion')}
                </a>
              </Link>
            </>
          }
        </div>
      </Form>

      <MapContainer
        center={center}
        zoom={filteredRooms.length === 1 ? 19 : 17}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className={styles.mapContainer}
        // set tap=false to work around weird popup behavior on iOS
        // https://github.com/Leaflet/Leaflet/issues/3184
        tap={false}
      >
        <TileLayer
          attribution={t('rooms.map.attribution')}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={21}
        />

        <AttributionControl position="bottomleft" />

        <div className="leaflet-bottom leaflet-right">
          <div className={`leaflet-control leaflet-bar ${styles.legendControl}`}>
            {availableRooms && (
              <>
                <div className={styles.legendFree}>{` ${t('rooms.map.legend.free')}`}</div>
                <div className={styles.legendTaken}>{` ${t('rooms.map.legend.occupied')}`}</div>
              </>
            )}
            {!availableRooms && <div className={styles.legendTaken}>{` ${t('rooms.map.legend.occupancy_unknown')}`}</div>}
            <div>
              {SPECIAL_COLORS.map(color => (
                <span key={color} className={styles.legendSpecial} style={{ '--legend-color': color }}>
                </span>
              ))}
              {` ${t('rooms.map.legend.special_equipment')}`}
            </div>
          </div>
        </div>

        <LayersControl position="topright" collapsed={false}>
          {FLOOR_ORDER
            .filter(name => filteredRooms.some(x => x.properties.Etage === name))
            .map((floorName, i, filteredFloorOrder) => (
              <LayersControl.BaseLayer
                key={floorName + (searchText || 'empty-search')}
                name={translateFloors(floorName)}
                checked={i === filteredFloorOrder.length - 1}
              >
                <LayerGroup>
                  {renderFloor(floorName)}
                </LayerGroup>
              </LayersControl.BaseLayer>
            ))}
        </LayersControl>

        {location &&
          <CircleMarker
            center={[location.latitude, location.longitude]}
            fillOpacity={1.0}
            color='#ffffff'
            fillColor='rgb(51, 136, 255)'
            radius={8}
            weight={3}
            className={styles.locationMarker}
          />
        }
      </MapContainer>
    </>
  )
}
RoomMap.propTypes = {
  highlight: PropTypes.string
}
