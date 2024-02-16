import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import Link from 'next/link'
import { useRouter } from 'next/router'

import Form from 'react-bootstrap/Form'

import {
  AttributionControl,
  CircleMarker,
  FeatureGroup,
  LayerGroup,
  LayersControl,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import {
  NoSessionError,
  UnavailableSessionError,
} from '../lib/backend/thi-session-handler'
import {
  TUX_ROOMS,
  filterRooms,
  getNextValidDate,
  getRoomAvailability,
  getRoomCapacity,
  getRoomWithCapacity,
  getTranslatedRoomFunction,
} from '../lib/backend-utils/rooms-utils'

import { USER_GUEST, useUserKind } from '../lib/hooks/user-kind'
import {
  formatFriendlyTime,
  formatISODate,
  formatISOTime,
} from '../lib/date-utils'
import { useLocation } from '../lib/hooks/geolocation'

import styles from '../styles/RoomMap.module.css'
import { useTranslation } from 'next-i18next'

const SPECIAL_ROOMS = {
  G308: { text: 'Linux PC-Pool', color: '#F5BD0C' },
}
const SEARCHED_PROPERTIES = ['Gebaeude', 'Raum']
const FLOOR_SUBSTITUTES = {
  0: 'EG', // room G0099
  OG: '1', // floor 1 in H (Carissma)
  AG: '1.5', // floor 1.5 in A
  G: '1.5', // floor 1.5 in H (Reimanns)
  null: '4', // floor 4 in Z (Arbeitsamt),
}
const FLOOR_ORDER = ['4', '3', '2', '1.5', '1', 'EG', '-1']
const INGOLSTADT_CENTER = [48.7663, 11.4333]
const NEUBURG_CENTER = [48.73227, 11.17261]

const SPECIAL_COLORS = [
  ...new Set(Object.values(SPECIAL_ROOMS).map((x) => x.color)),
]

/**
 * Updates the map position based on a property.
 * Necessary since the position of a map can only be set from within the maps context.
 * @see https://react-leaflet.js.org/docs/api-map/
 */
const UpdatePosition = ({ position }) => {
  const map = useMap()
  useEffect(() => {
      map.setView(position)
  }, [map, position])
  return null
}

/**
 * Room map based on Leaflet.
 * Implemented as a component because this is the best way to bypass SSR, which is incompatible with Leaflet.
 */
export default function RoomMap({ highlight, roomData }) {
  const router = useRouter()
  const searchField = useRef()
  const location = useLocation()
  const { userKind, userFaculty } = useUserKind()
  const [searchText, setSearchText] = useState(highlight || '')
  const [availableRooms, setAvailableRooms] = useState(null)
  const [roomAvailabilityList, setRoomAvailabilityList] = useState({})
  const [roomCapacity, setRoomCapacity] = useState({})

  const { t, i18n } = useTranslation(['rooms', 'api-translations'])

  const mapCenter =
    userFaculty && userFaculty === 'Nachhaltige Infrastruktur'
      ? NEUBURG_CENTER
      : INGOLSTADT_CENTER
  /**
   * WILL BE USED WITH NEW TILE SERVICE
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [theme] = useContext(ThemeContext)

  function isDark () {
    const themeSettings = themes.filter(item => item.style === theme)[0].mapTheme ?? 'system'
    if (themeSettings === 'system') {
      return systemDark
    } else {
      return themeSettings === 'dark'
    }
  }
  */

  /**
   * Preprocessed room data for Leaflet.
   */
  const allRooms = useMemo(() => {
    return roomData.features
      .map((feature) => {
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

        return geometry.coordinates.map((points) => ({
          properties,
          coordinates: points.map(([lon, lat]) => [lat, lon]),
          options: {},
        }))
      })
      .flat()
  }, [roomData])

  async function loadRoomAvailability() {
    const roomAvailabilityData = await getRoomAvailability()
    const roomAvailabilityList = Object.fromEntries(
      Object.entries(roomAvailabilityData).map(([room, openings]) => {
        const availability = openings.filter(
          (opening) => new Date(opening.until) > new Date()
        )
        return [room, availability]
      })
    )

    setRoomAvailabilityList(roomAvailabilityList)
  }

  async function loadRoomCapacity() {
    const roomCapacityData = await getRoomCapacity()

    setRoomCapacity(roomCapacityData)
  }

  /**
   * Preprocessed and filtered room data for Leaflet.
   */
  const [filteredRooms, center] = useMemo(() => {
    const searchedProperties = [
      ...SEARCHED_PROPERTIES,
      `Funktion_${i18n.language}`,
    ]

    if (Object.keys(roomAvailabilityList).length === 0) {
      loadRoomAvailability()
    }
    if (Object.keys(roomCapacity).length === 0) {
      loadRoomCapacity()
    }

    if (!searchText) {
      return [allRooms, mapCenter]
    }

    const cleanedText = searchText.toUpperCase().trim()

    const getProp = (room, prop) => {
      return room.properties[prop]?.toUpperCase()
    }

    const fullTextSearcher = (room) =>
      searchedProperties.some((prop) =>
        getProp(room, prop)?.includes(cleanedText)
      )
    const roomOnlySearcher = (room) =>
      getProp(room, 'Raum').startsWith(cleanedText)
    const filtered = allRooms.filter(
      /^[A-Z](G|[0-9E]\.)?\d*$/.test(cleanedText)
        ? roomOnlySearcher
        : fullTextSearcher
    )

    // this doesn't affect the search results itself, but ensures that the map is centered on the correct campus
    const showNeuburg =
      userFaculty === 'Nachhaltige Infrastruktur' || cleanedText.includes('N')
    const campusRooms = filtered.filter(
      (x) => x.properties.Raum.includes('N') === showNeuburg
    )

    const centerRooms = campusRooms.length > 0 ? campusRooms : filtered

    let lon = 0
    let lat = 0
    let count = 0
    centerRooms.forEach((x) => {
      lon += x.coordinates[0][0]
      lat += x.coordinates[0][1]
      count += 1
    })
    const filteredCenter = count > 0 ? [lon / count, lat / count] : mapCenter

    return [filtered, filteredCenter]
  }, [
    roomAvailabilityList,
    roomCapacity,
    searchText,
    allRooms,
    userFaculty,
    mapCenter,
    i18n.language,
  ])

  useEffect(() => {
    async function load() {
      try {
        const dateObj = getNextValidDate()
        const date = formatISODate(dateObj)
        const time = formatISOTime(dateObj)
        const rooms = await filterRooms(date, time)
        setAvailableRooms(rooms)
      } catch (e) {
        if (
          e instanceof NoSessionError ||
          e instanceof UnavailableSessionError
        ) {
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
  function translateFloors(floor) {
    const translated = t(`rooms.map.floors.${floor.toLowerCase()}`)

    if (translated.startsWith('rooms.')) {
      return floor
    }

    return translated
  }

  function getRoomFunction(room) {
    const name =
      room?.properties?.[`Funktion_${i18n.language}`] ||
      room?.properties?.Funktion_de ||
      getTranslatedRoomFunction(room?.properties?.['Funktion_de']) ||
      ''
    return name ? name.replace(/\s+/g, ' ') : null
  }

  /**
   * Removes focus from the search.
   */
  function unfocus(e) {
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
  function renderRoom(entry, key, onlyAvailable) {
    const avail = availableRooms?.find((x) => x.room === entry.properties.Raum)
    if ((avail && !onlyAvailable) || (!avail && onlyAvailable)) {
      return null
    }

    const special = SPECIAL_ROOMS[entry.properties.Raum]
    const availabilityData = (
      roomAvailabilityList[entry.properties.Raum] || []
    ).slice(0, 1)

    return (
      <FeatureGroup key={key}>
        <Popup className={styles.popup}>
          <strong>{entry.properties.Raum}</strong>
          {` ${getRoomWithCapacity(
            getRoomFunction(entry),
            roomCapacity[entry.properties.Raum],
            t
          )}`}
          {avail && (
            <>
              <br />
              {t('rooms.map.freeFromUntil', {
                from: formatFriendlyTime(avail.from),
                until: formatFriendlyTime(avail.until),
              })}
            </>
          )}
          {!avail && availableRooms && (
            <>
              <br />
              {t('rooms.map.occupied')}
              <br />

              {availabilityData &&
                availabilityData.map((opening) => (
                  <>
                    {t('rooms.map.freeFromUntil', {
                      from: formatFriendlyTime(opening.from),
                      until: formatFriendlyTime(opening.until),
                    })}
                    <br />
                  </>
                ))}
            </>
          )}
          {special && (
            <>
              <br />
              {special.text}
              {TUX_ROOMS.includes(entry.properties.Raum) && (
                <>
                  {' '}
                  <FontAwesomeIcon
                    title="Linux"
                    icon={faLinux}
                    fontSize={12}
                  />
                </>
              )}
            </>
          )}
        </Popup>
        <Polygon
          positions={entry.coordinates}
          pathOptions={{
            ...entry.options,
            color: special && avail ? special.color : null,
            className: `${
              avail
                ? !special
                  ? styles.roomAvailable
                  : ''
                : styles.roomOccupied
            }`,
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
  function renderFloor(floorName) {
    const floorRooms = filteredRooms.filter(
      (x) => x.properties.Etage === floorName
    )

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
      <Form
        className={styles.searchForm}
        onSubmit={(e) => unfocus(e)}
      >
        <Form.Control
          as="input"
          placeholder={t('rooms.map.searchPlaceholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          isInvalid={filteredRooms.length === 0}
          ref={searchField}
        />

        <div className={styles.openings}>
          {(roomAvailabilityList[searchText] &&
            roomAvailabilityList[searchText].length &&
            t('rooms.map.freeFromUntil', {
              from: formatFriendlyTime(
                roomAvailabilityList[searchText][0].from
              ),
              until: formatFriendlyTime(
                roomAvailabilityList[searchText][0].until
              ),
            })) ||
            ''}
        </div>

        <div className={styles.links}>
          <Link href="/rooms/search">
            <a className={styles.linkToSearch}>
              {t('rooms.map.extendedSearch')}
            </a>
          </Link>
          {userKind !== USER_GUEST && (
            <>
              <> · </>
              <Link href="/rooms/suggestions">
                <a className={styles.linkToSearch}>
                  {t('rooms.map.automaticSuggestion')}
                </a>
              </Link>
            </>
          )}
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
        <UpdatePosition position={center} />

        <TileLayer
          attribution={t('rooms.map.attribution')}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={21}
        />

        <AttributionControl position="bottomleft" />

        <div className="leaflet-bottom leaflet-right">
          <div
            className={`leaflet-control leaflet-bar ${styles.legendControl}`}
          >
            {availableRooms && (
              <>
                <div className={styles.legendFree}>{` ${t(
                  'rooms.map.legend.free'
                )}`}</div>
                <div className={styles.legendTaken}>{` ${t(
                  'rooms.map.legend.occupied'
                )}`}</div>
              </>
            )}
            {!availableRooms && (
              <div className={styles.legendTaken}>{` ${t(
                'rooms.map.legend.occupancyUnknown'
              )}`}</div>
            )}
            <div>
              {SPECIAL_COLORS.map((color) => (
                <span
                  key={color}
                  className={styles.legendSpecial}
                  style={{ '--legend-color': color }}
                ></span>
              ))}
              {` ${t('rooms.map.legend.specialEquipment')}`}
            </div>
          </div>
        </div>

        <LayersControl
          position="topright"
          collapsed={false}
        >
          {FLOOR_ORDER.filter((name) =>
            filteredRooms.some((x) => x.properties.Etage === name)
          ).map((floorName, i, filteredFloorOrder) => (
            <LayersControl.BaseLayer
              key={floorName + (searchText || 'empty-search')}
              name={translateFloors(floorName)}
              checked={
                i ===
                (filteredFloorOrder.indexOf('EG') !== -1
                  ? filteredFloorOrder.indexOf('EG')
                  : filteredFloorOrder.length - 1)
              }
            >
              <LayerGroup>{renderFloor(floorName)}</LayerGroup>
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>

        {location && (
          <CircleMarker
            center={[location.latitude, location.longitude]}
            fillOpacity={1.0}
            color="#ffffff"
            radius={8}
            weight={3}
            className={styles.locationMarker}
          />
        )}
      </MapContainer>
    </>
  )
}
RoomMap.propTypes = {
  highlight: PropTypes.string,
}
