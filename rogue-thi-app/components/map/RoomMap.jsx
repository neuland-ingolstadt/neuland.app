import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import Link from 'next/link'
import { useRouter } from 'next/router'

import Form from 'react-bootstrap/Form'

import {
  featureCollection as createFeatureCollection,
  polygon as createPolygon,
  distance as getDistance,
  bbox as getFeatureBounds,
  center as getFeatureCenter,
} from '@turf/turf'

import {
  NoSessionError,
  UnavailableSessionError,
} from '../../lib/backend/thi-session-handler'
import {
  filterRooms,
  getNextValidDate,
  getRoomAvailability,
  getRoomCapacity,
  getRoomWithCapacity,
  getTranslatedRoomFunction,
} from '../../lib/backend-utils/rooms-utils'

import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/maplibre'

import { USER_GUEST, useUserKind } from '../../lib/hooks/user-kind'
import {
  formatFriendlyTime,
  formatISODate,
  formatISOTime,
} from '../../lib/date-utils'
import { useLocation } from '../../lib/hooks/geolocation'

import { Trans, useTranslation } from 'next-i18next'
import AttributionControl from './AttributionControl'
import FloorControl from './FloorControl'
import { X } from 'lucide-react'
import styles from '../../styles/RoomMap.module.css'
import { useTheme } from '../../lib/providers/ThemeProvider'

const SEARCHED_PROPERTIES = ['Gebaeude', 'Raum']
const FLOOR_SUBSTITUTES = {
  EG: ['0', 0],
  1: ['OG'],
  1.5: ['AG', 'G'],
  '-1': ['UG'],
}

const FLOOR_ORDER = ['4', '3', '2', '1.5', '1', 'EG', '-1']
const INGOLSTADT_CENTER = [48.7663, 11.4333]
const NEUBURG_CENTER = [48.73227, 11.17261]

/**
 * Room map based on MapLibre.
 */
export default function RoomMap({ highlight, roomData }) {
  const router = useRouter()
  const searchField = useRef()
  const location = useLocation()
  const mapRef = useRef()
  const { userKind, userFaculty } = useUserKind()
  const [searchText, setSearchText] = useState(highlight || '')
  const [availableRooms, setAvailableRooms] = useState(null)
  const [roomAvailabilityList, setRoomAvailabilityList] = useState({})
  const [roomCapacity, setRoomCapacity] = useState({})
  const [currentFloor, setCurrentFloor] = useState('EG')
  const [popup, setPopup] = useState(null)
  const { mode } = useTheme()

  const { t, i18n } = useTranslation(['rooms', 'api-translations'])

  const mapCenter =
    userFaculty && userFaculty === 'Nachhaltige Infrastruktur'
      ? NEUBURG_CENTER
      : INGOLSTADT_CENTER

  const [primaryColor, grayColor] = useMemo(() => {
    if (typeof window === 'undefined') {
      return ['#007bff', '#6c757d']
    }

    const root = document.documentElement
    const primary = getComputedStyle(root).getPropertyValue('--primary')

    const grayColor =
      mode === 'light'
        ? getComputedStyle(root).getPropertyValue('--gray')
        : getComputedStyle(root).getPropertyValue('--gray-dark')

    return [primary, grayColor]
  }, [mode])

  /**
   * Hide popup when the search text or the current floor changes.
   */
  useEffect(() => {
    setPopup(null)
  }, [searchText, currentFloor])

  /**
   * Preprocessed room data.
   */
  const allRooms = useMemo(() => {
    return roomData.features
      .map((feature) => {
        const { properties, geometry } = feature

        if (!geometry || !geometry.coordinates || geometry.type !== 'Polygon') {
          return []
        }

        return geometry.coordinates.map((points) => ({
          properties,
          coordinates: points.map(([lon, lat]) => [lat, lon]),
          options: {},
        }))
      })
      .flat()
  }, [roomData])

  const availableRoomKeys = useMemo(() => {
    if (!availableRooms) {
      return []
    }

    return availableRooms.map((x) => x.room)
  }, [availableRooms])

  const currentFloorSubstitute = useMemo(() => {
    return [currentFloor, ...(FLOOR_SUBSTITUTES[currentFloor] || [])]
  }, [currentFloor])

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
   * Preprocessed and filtered room data.
   */
  const [filteredRooms, filteredFloors] = useMemo(() => {
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
      return [allRooms, FLOOR_ORDER]
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

    const features = createFeatureCollection(
      centerRooms.map((x) => {
        return createPolygon([x.coordinates])
      })
    )

    if (features.features.length > 0) {
      const bounds = getFeatureBounds(features)

      // If position switches to the other campus, skip the animation
      const currentCenter = mapRef.current?.getMap().getCenter()
      const distance = getDistance(currentCenter.toArray(), [
        bounds[1],
        bounds[0],
      ])

      const animate = distance < 1

      mapRef.current?.fitBounds(
        [
          [bounds[1], bounds[0]],
          [bounds[3], bounds[2]],
        ],
        {
          animate,
          padding: 50,
        }
      )
    }

    const filteredFloors = FLOOR_ORDER.filter((floor) =>
      filtered.some((x) => x.properties.Etage === floor)
    )

    if (!filteredFloors.includes(currentFloor)) {
      setCurrentFloor(filteredFloors.slice(-1)[0] || 'EG')
    }

    return [filtered, filteredFloors]
  }, [
    i18n.language,
    roomAvailabilityList,
    roomCapacity,
    searchText,
    allRooms,
    userFaculty,
    currentFloor,
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

  const zoom = useMemo(() => {
    return filteredRooms?.length === 1 ? 19 : 16 || 16
  }, [filteredRooms])

  const getRoomFunction = useCallback(
    (room) => {
      const func =
        room?.properties?.[`Funktion_${i18n.language}`] ||
        room?.properties?.Funktion_de ||
        getTranslatedRoomFunction(room?.properties?.['Funktion_de']) ||
        ''
      const name = func ? func.replace(/\s+/g, ' ') : null

      return getRoomWithCapacity(name, roomCapacity[room.properties.Raum], t)
    },
    [i18n.language, roomCapacity, t]
  )

  const getPopupBody = useCallback(
    (room) => {
      const avail = availableRooms?.find((x) => x.room === room.properties.Raum)
      const availabilityData = roomAvailabilityList[room.properties.Raum] || []
      const roomAvailability = availabilityData[0] || null

      if (avail) {
        return t('rooms.map.freeFromUntil', {
          from: formatFriendlyTime(avail.from),
          until: formatFriendlyTime(avail.until),
        })
      }

      return (
        <>
          <span>{t('rooms.map.occupied')}</span>
          {availabilityData.length > 0 && (
            <span>
              {t('rooms.map.freeFromUntil', {
                from: formatFriendlyTime(roomAvailability?.from),
                until: formatFriendlyTime(roomAvailability?.until),
              })}
            </span>
          )}
        </>
      )
    },
    [availableRooms, roomAvailabilityList, t]
  )

  const filteredRoomIds = useMemo(() => {
    return filteredRooms.map((x) => x.properties.Raum)
  }, [filteredRooms])

  /**
   * Removes focus from the search.
   */
  function unfocus(e) {
    e.preventDefault()
    searchField.current?.blur()
  }

  // /**
  //  * Renders a room polygon.
  //  * @param {object} entry GeoJSON feature
  //  * @param {string} key Unique key that identifies the feature
  //  * @param {boolean} onlyAvailable Display only rooms that are currently free
  //  * @returns Leaflet feature object
  //  */
  // function renderRoom(entry, key, onlyAvailable) {
  //   const avail = availableRooms?.find((x) => x.room === entry.properties.Raum)
  //   if ((avail && !onlyAvailable) || (!avail && onlyAvailable)) {
  //     return null
  //   }

  //   // const special = SPECIAL_ROOMS[entry.properties.Raum]
  //   // const availabilityData = (
  //   //   roomAvailabilityList[entry.properties.Raum] || []
  //   // ).slice(0, 1)

  //   return (
  //     // <FeatureGroup key={key}>
  //     //   <Popup className={styles.popup}>
  //     //     <strong>{entry.properties.Raum}</strong>
  //     //     {` ${getRoomWithCapacity(
  //     //       getRoomFunction(entry),
  //     //       roomCapacity[entry.properties.Raum],
  //     //       t
  //     //     )}`}
  //     //     {avail && (
  //     //       <>
  //     //         <br />
  //     //         {t('rooms.map.freeFromUntil', {
  //     //           from: formatFriendlyTime(avail.from),
  //     //           until: formatFriendlyTime(avail.until),
  //     //         })}
  //     //       </>
  //     //     )}
  //     //     {!avail && availableRooms && (
  //     //       <>
  //     //         <br />
  //     //         {t('rooms.map.occupied')}
  //     //         <br />

  //     //         {availabilityData &&
  //     //           availabilityData.map((opening) => (
  //     //             <>
  //     //               {t('rooms.map.freeFromUntil', {
  //     //                 from: formatFriendlyTime(opening.from),
  //     //                 until: formatFriendlyTime(opening.until),
  //     //               })}
  //     //               <br />
  //     //             </>
  //     //           ))}
  //     //       </>
  //     //     )}
  //     //     {special && (
  //     //       <>
  //     //         <br />
  //     //         {special.text}
  //     //       </>
  //     //     )}
  //     //   </Popup>
  //     //   <Polygon
  //     //     positions={entry.coordinates}
  //     //     pathOptions={{
  //     //       ...entry.options,
  //     //       color: special && avail ? special.color : null,
  //     //       className: `${
  //     //         avail
  //     //           ? !special
  //     //             ? styles.roomAvailable
  //     //             : ''
  //     //           : styles.roomOccupied
  //     //       }`,
  //     //     }}
  //     //   />
  //     // </FeatureGroup>
  //     <h1>Hi</h1>
  //   )
  // }

  const clickRoom = useCallback(
    (e) => {
      const features = e.features

      if (!features || !features.length) {
        return
      }
      const feature = features[0]

      const map = mapRef.current.getMap()
      map.easeTo({
        center: getFeatureCenter(feature).geometry.coordinates,
        zoom: 19,
      })

      const room = feature.properties.Raum
      const center = getFeatureCenter(feature).geometry.coordinates

      setPopup({
        longitude: center[0],
        latitude: center[1],
        room,
        body: getPopupBody(feature),
        function: getRoomFunction(feature),
      })
    },
    [getPopupBody, getRoomFunction]
  )

  const [availableLayerFilter, occupiedLayerFilter] = useMemo(() => {
    return [
      [
        'all',
        ['in', 'Raum', ...availableRoomKeys],
        ['in', 'Etage', ...currentFloorSubstitute],
        ['in', 'Raum', ...filteredRoomIds],
      ],
      [
        'all',
        ['!in', 'Raum', ...availableRoomKeys],
        ['in', 'Etage', ...currentFloorSubstitute],
        ['in', 'Raum', ...filteredRoomIds],
      ],
    ]
  }, [availableRoomKeys, currentFloorSubstitute, filteredRoomIds])

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

      <Map
        ref={mapRef}
        reuseMaps
        mapStyle={`https://tile.neuland.app/styles/${mode}/style.json`}
        attributionControl={false}
        initialViewState={{
          latitude: mapCenter[0],
          longitude: mapCenter[1],
          zoom,
        }}
        boxZoom={false}
        maxPitch={0}
        maxZoom={19}
        minZoom={14}
        interactiveLayerIds={['available-rooms-fill', 'occupied-rooms-fill']}
        onClick={(e) => {
          const features = e.features

          if (!features || !features.length) {
            setPopup(null)
            return
          }

          clickRoom(e)
        }}
        onLoad={(e) => {
          // The map does not have a className property, so we need to access the container directly.
          const map = e.target
          map.getContainer().classList.add(styles.mapContainer)
        }}
      >
        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            closeButton={false}
            closeOnClick={false}
            className={styles.popup}
            anchor="bottom"
          >
            <div className={styles.popupContent}>
              <div className={styles.popupHeader}>
                <strong>{popup.room}</strong>
                {popup.function}
              </div>
              <div className={`${styles.popupBody} text-muted`}>
                {popup.body}
              </div>

              <span
                className={styles.popupClose}
                onClick={() => setPopup(null)}
              >
                <X size={20} />
              </span>
            </div>
          </Popup>
        )}
        {/* 
        <UpdatePosition
          position={center}
          zoom={zoom}
        /> */}

        <Source
          type="geojson"
          data={roomData}
          id="rooms"
        >
          <Layer
            source="rooms"
            id="occupied-rooms-fill"
            metadata={{}}
            type="fill"
            paint={{
              'fill-color': grayColor,
              'fill-opacity': 0.1,
            }}
            filter={occupiedLayerFilter}
          />

          <Layer
            source="rooms"
            id="occupied-rooms-line"
            metadata={{}}
            type="line"
            paint={{
              'line-color': grayColor,
            }}
            filter={occupiedLayerFilter}
          />

          <Layer
            source="rooms"
            id="available-rooms-fill"
            type="fill"
            paint={{
              'fill-color': primaryColor,
              'fill-opacity': 0.2,
            }}
            filter={availableLayerFilter}
          />

          <Layer
            source="rooms"
            id="available-rooms-line"
            type="line"
            paint={{
              'line-color': primaryColor,
            }}
            filter={availableLayerFilter}
          />
        </Source>

        <FloorControl
          floors={filteredFloors}
          currentFloor={currentFloor}
          setCurrentFloor={setCurrentFloor}
        />

        <div className="maplibregl-ctrl-bottom-left ">
          <div
            className={`maplibregl-ctrl ${styles.legendControl} ${styles.ctrlContainer}`}
          >
            {availableRooms && (
              <>
                <div className={styles.legendFree} />
                <p>{t('rooms.map.legend.free')}</p>
                <div className={styles.legendOccupied} />
                <p>{t('rooms.map.legend.occupied')}</p>
              </>
            )}
            {!availableRooms && (
              <>
                <div className={styles.legendOccupied} />
                <p>{t('rooms.map.legend.occupancyUnknown')}</p>
              </>
            )}
          </div>
        </div>

        {location && (
          <Marker
            latitude={location.latitude}
            longitude={location.longitude}
          >
            <div className={styles.locationMarker} />
          </Marker>
        )}

        <AttributionControl
          attribution={
            <Trans
              i18nKey="rooms.map.attribution"
              ns="rooms"
              components={{ a: <a /> }}
            />
          }
        />
      </Map>
    </>
  )
}
RoomMap.propTypes = {
  highlight: PropTypes.string,
}
