import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import Link from 'next/link'

import Form from 'react-bootstrap/Form'
import Container from 'react-bootstrap/Container'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/AppBody'
import AppNavbar from '../../components/AppNavbar'
import AppTabbar from '../../components/AppTabbar'
import roomData from '../../data/rooms.json'

import { callWithSession, NoSessionError } from '../../lib/thi-backend/thi-session-handler'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../../lib/date-utils'
import { getNextValidDate, filterRooms } from './search'

import styles from '../../styles/RoomsMap.module.css'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(x => x.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(x => x.TileLayer), { ssr: false })
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
  'EG',
  '1',
  '1.5',
  '2',
  '3',
  '4'
]

const floors = {}
roomData.features.forEach(feature => {
  const { properties, geometry } = feature

  if (!geometry || !geometry.coordinates || geometry.type !== 'Polygon') {
    return
  }

  if (properties.Etage in floorSubstitutes) {
    properties.Etage = floorSubstitutes[properties.Etage]
  }

  if (floorOrder.indexOf(properties.Etage) === -1) {
    floorOrder.push(properties.Etage)
  }
  if (!(properties.Etage in floors)) {
    floors[properties.Etage] = []
  }

  geometry.coordinates.forEach(points => {
    floors[properties.Etage].push({
      properties,
      coordinates: points.map(([lon, lat]) => [lat, lon]),
      options: { }
    })
  })
})

export default function RoomMap () {
  const router = useRouter()
  const { highlight } = router.query
  const [searchText, setSearchText] = useState(highlight ? highlight.toUpperCase() : '')
  const [availableRooms, setAvailableRooms] = useState([])

  let center = [48.76677, 11.43322]
  let filteredFloors = {}

  const filteredFloorOrder = floorOrder.slice(0)
  if (!searchText) {
    filteredFloors = floors
  } else {
    Object.assign(filteredFloors, floors)

    const invalidFloorIndices = []
    floorOrder.forEach((floor, i) => {
      filteredFloors[floor] = filteredFloors[floor].filter(entry =>
        searchedProperties.some(x => entry.properties[x].toUpperCase().indexOf(searchText) !== -1)
      )

      if (filteredFloors[floor].length === 0) {
        invalidFloorIndices.unshift(i)
      }
    })

    invalidFloorIndices.forEach(i => filteredFloorOrder.splice(i, 1))

    let lon = 0
    let lat = 0
    let count = 0
    Object.values(filteredFloors).forEach(floor => floor.forEach(x => {
      lon += x.coordinates[0][0]
      lat += x.coordinates[0][1]
      count += 1
    }))

    center = [lon / count, lat / count]
  }

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

  return (
    <Container className={styles.container}>
      <AppNavbar title="Raumplan" showBack={'desktop-only'} />

      <AppBody className={styles.body}>
        <Form className={styles.searchForm}>
          <Form.Control
            as="input"
            placeholder="Suche nach 'W003', 'Toilette', 'Bibliothek', ..."
            value={searchText}
            onChange={e => setSearchText(e.target.value.toUpperCase())}
          />

          <span className={styles.coloredBall}></span>
          <span className={styles.ballText}> Freie Räume</span>
          <span className={styles.grayBall}></span>
          <span className={styles.ballText}> Belegte Räume</span>
          <div className={styles.linkToSearch}>
            <Link href="/rooms/search">Textansicht</Link>
          </div>
        </Form>

        <MapContainer center={center} zoom={18} scrollWheelZoom={true} className={styles.mapContainer}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>-Mitwirkende'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={21}
          />

          <LayersControl position="topleft" collapsed={false}>
            {filteredFloorOrder.map((floorName, i) => (
              <BaseLayersControl name={floorName} key={floorName} checked={i === 0}>
                <LayerGroup>
                  {filteredFloors[floorName].map((entry, j) => (
                    renderRoom(entry, j, false)
                  ))}
                  {/* we first render all gray rooms and then the colored ones to make
                      sure the colored border overlapthe gray ones */}
                  {filteredFloors[floorName].map((entry, j) => (
                    renderRoom(entry, j, true)
                  ))}
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
