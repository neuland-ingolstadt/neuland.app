import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Dropdown from 'react-bootstrap/Dropdown'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/AppBody'
import AppNavbar from '../../components/AppNavbar'
import AppTabbar from '../../components/AppTabbar'
import roomData from '../../data/rooms.json'

import { callWithSession, NoSessionError } from '../../lib/thi-backend/thi-session-handler'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../../lib/date-utils'
import { getNextValidDate, filterRooms } from './search'

import 'leaflet/dist/leaflet.css'
import styles from '../../styles/Rooms.module.css'

const MapContainer = dynamic(() => import('react-leaflet').then(x => x.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(x => x.TileLayer), { ssr: false })
const AttributionControl = dynamic(() => import('react-leaflet').then(x => x.AttributionControl), { ssr: false })
const LayersControl = dynamic(() => import('react-leaflet').then(x => x.LayersControl), { ssr: false })
const BaseLayersControl = dynamic(() => import('react-leaflet').then(x => x.LayersControl.BaseLayer), { ssr: false })
const LayerGroup = dynamic(() => import('react-leaflet').then(x => x.LayerGroup), { ssr: false })
const FeatureGroup = dynamic(() => import('react-leaflet').then(x => x.FeatureGroup), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(x => x.Popup), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(x => x.Polygon), { ssr: false })

const TUX_ROOMS = ['G308']

const searchedProperties = [
  'Gebaeude',
  'Raum',
  'Funktion'
]
const floorSubstitutes = {
  OG: '1', // floor 1 in H (Carissma)
  AG: '1.5', // floor 1.5 in A
  G: '1.5', // floor 1.5 in H (Reimanns)
  null: '4' // floor 4 in Z (Arbeitsamt)
}
const floorOrder = [
  '4',
  '3',
  '2',
  '1.5',
  '1',
  'EG'
]

const allRooms = roomData.features
  .map(feature => {
    const { properties, geometry } = feature

    if (!geometry || !geometry.coordinates || geometry.type !== 'Polygon') {
      return []
    }

    if (properties.Etage in floorSubstitutes) {
      properties.Etage = floorSubstitutes[properties.Etage]
    }
    if (floorOrder.indexOf(properties.Etage) === -1) {
      floorOrder.push(properties.Etage)
    }

    return geometry.coordinates.map(points => ({
      properties,
      coordinates: points.map(([lon, lat]) => [lat, lon]),
      options: { }
    }))
  })
  .flat()

export default function RoomMap () {
  const router = useRouter()
  const { highlight } = router.query
  const [searchText, setSearchText] = useState(highlight ? highlight.toUpperCase() : '')
  const [availableRooms, setAvailableRooms] = useState([])
  const [noSsrFloorOrder, setNoSsrFloorOrder] = useState([])

  const [filteredRooms, center] = useMemo(() => {
    const defaultCenter = [48.76677, 11.43322]
    if (!searchText) {
      return [allRooms, defaultCenter]
    }

    const getProp = (room, prop) => room.properties[prop].toUpperCase()
    const filtered = allRooms
      .filter(room => searchedProperties.some(x => getProp(room, x).indexOf(searchText) !== -1))

    let lon = 0
    let lat = 0
    let count = 0
    filtered.forEach(x => {
      lon += x.coordinates[0][0]
      lat += x.coordinates[0][1]
      count += 1
    })
    const filteredCenter = count > 0 ? [lon / count, lat / count] : defaultCenter

    return [filtered, filteredCenter]
  }, [searchText])

  useEffect(async () => {
    try {
      const dateObj = getNextValidDate()
      const date = formatISODate(dateObj)
      const time = formatISOTime(dateObj)
      const rooms = await callWithSession(session => filterRooms(session, date, time))
      setAvailableRooms(rooms)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }

    setNoSsrFloorOrder(floorOrder)
  }, [])

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
            sure the colored border overlapthe gray ones */}
        <>{floorRooms.map((entry, j) => renderRoom(entry, j, true))}</>
      </LayerGroup>
    )
  }

  return (
    <Container className={styles.container}>
      <AppNavbar title="Raumplan" showBack={'desktop-only'}>
        <Dropdown.Item variant="link" href="/rooms/search">
          Erweiterte Suche
        </Dropdown.Item>
        <Dropdown.Item variant="link" href="/rooms/list">
          Listenansicht
        </Dropdown.Item>
      </AppNavbar>

      <AppBody className={styles.body}>
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
            {noSsrFloorOrder
              .filter(name => filteredRooms.some(x => x.properties.Etage === name))
              .map((floorName, i, filteredFloorOrder) => (
                <BaseLayersControl
                  key={floorName + searchText}
                  name={floorName}
                  checked={i === filteredFloorOrder.length - 1}
                >
                  <LayerGroup>
                    {renderFloor(floorName)}
                  </LayerGroup>
                </BaseLayersControl>
              ))}
          </LayersControl>
        </MapContainer>
      </AppBody>

      <AppTabbar />
    </Container>
  )
}
