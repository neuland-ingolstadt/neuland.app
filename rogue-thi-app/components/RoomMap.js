import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import Form from 'react-bootstrap/Form'

import { AttributionControl, FeatureGroup, LayerGroup, LayersControl, MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import { filterRooms, getNextValidDate } from '../pages/rooms/search'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../lib/date-utils'
import { NoSessionError } from '../lib/thi-backend/thi-session-handler'

import roomData from '../data/rooms.json'

import styles from '../styles/RoomMap.module.css'

const TUX_ROOMS = [
  'G308'
]
const SEARCHED_PROPERTIES = [
  'Gebaeude',
  'Raum',
  'Funktion'
]
const FLOOR_SUBSTITUTES = {
  OG: '1', // floor 1 in H (Carissma)
  AG: '1.5', // floor 1.5 in A
  G: '1.5', // floor 1.5 in H (Reimanns)
  null: '4' // floor 4 in Z (Arbeitsamt)
}
const FLOOR_ORDER = [
  '4',
  '3',
  '2',
  '1.5',
  '1',
  'EG'
]
const DEFAULT_CENTER = [48.76677, 11.43322]

const allRooms = roomData.features
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

export default function RoomMap ({ highlight }) {
  const router = useRouter()
  const [searchText, setSearchText] = useState(highlight ? highlight.toUpperCase() : '')
  const [availableRooms, setAvailableRooms] = useState([])

  const [filteredRooms, center] = useMemo(() => {
    if (!searchText) {
      return [allRooms, DEFAULT_CENTER]
    }

    const getProp = (room, prop) => room.properties[prop].toUpperCase()
    const fullTextSearcher = room => SEARCHED_PROPERTIES.some(x => getProp(room, x).indexOf(searchText) !== -1)
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
  }, [searchText])

  useEffect(() => {
    async function load () {
      try {
        const dateObj = getNextValidDate()
        const date = formatISODate(dateObj)
        const time = formatISOTime(dateObj)
        const rooms = await filterRooms(date, time)
        setAvailableRooms(rooms)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  function renderRoom (entry, key, onlyAvailable) {
    const avail = availableRooms.find(x => x.room === entry.properties.Raum)
    if ((avail && !onlyAvailable) || (!avail && onlyAvailable)) {
      return null
    }

    return (
      <FeatureGroup key={key}>
        <Popup>
          <strong>
            {TUX_ROOMS.includes(entry.properties.Raum) && <><FontAwesomeIcon icon={faLinux} /> </>}
            {entry.properties.Raum}
          </strong>
          {`, ${entry.properties.Funktion}`} <br />
          Gebäude {entry.properties.Gebaeude} <br />
          Campus {entry.properties.Standort} <br />
          {avail && (
            <>
              <strong>Frei</strong>
              {' '}von {formatFriendlyTime(avail.from)}
              {' '}bis {formatFriendlyTime(avail.until)}
            </>
          )}
        </Popup>
        <Polygon
          positions={entry.coordinates}
          pathOptions={{
            ...entry.options,
            color: avail
              ? '#8845ef'
              : '#6c757d'
          }}
        />
      </FeatureGroup>
    )
  }

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
      <Form className={styles.searchForm}>
        <Form.Control
          as="input"
          placeholder="Suche nach 'W003', 'Toilette', 'Bibliothek', ..."
          value={searchText}
          onChange={e => setSearchText(e.target.value.toUpperCase())}
          isInvalid={filteredRooms.length === 0}
        />
      </Form>

      <MapContainer
        center={center}
        zoom={filteredRooms.length === 1 ? 19 : 18}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className={styles.mapContainer}
        // set tap=false to work around weird popup behavior on iOS
        // https://github.com/Leaflet/Leaflet/issues/3184
        tap={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>-Mitwirkende'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={21}
        />

        <AttributionControl position="bottomleft" />

        <div className="leaflet-bottom leaflet-right">
          <div className={`leaflet-control leaflet-bar ${styles.legendControl}`}>
          <div className={styles.legendFree}> Freie Räume</div>
          <div className={styles.legendTaken}> Belegte Räume</div>
          </div>
        </div>

        <LayersControl position="topright" collapsed={false}>
          {FLOOR_ORDER
            .filter(name => filteredRooms.some(x => x.properties.Etage === name))
            .map((floorName, i, filteredFloorOrder) => (
              <LayersControl.BaseLayer
                key={floorName + (searchText || 'empty-search')}
                name={floorName}
                checked={i === filteredFloorOrder.length - 1}
              >
                <LayerGroup>
                  {renderFloor(floorName)}
                </LayerGroup>
              </LayersControl.BaseLayer>
            ))}
        </LayersControl>
      </MapContainer>
    </>
  )
}
RoomMap.propTypes = {
  highlight: PropTypes.string
}
