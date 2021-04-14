import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import Form from 'react-bootstrap/Form'

import AppBody from '../../components/AppBody'
import AppNavbar from '../../components/AppNavbar'
import roomData from '../../data/rooms.json'

import styles from '../../styles/Map.module.css'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(x => x.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(x => x.TileLayer), { ssr: false })
const LayersControl = dynamic(() => import('react-leaflet').then(x => x.LayersControl), { ssr: false })
const BaseLayersControl = dynamic(() => import('react-leaflet').then(x => x.LayersControl.BaseLayer), { ssr: false })
const LayerGroup = dynamic(() => import('react-leaflet').then(x => x.LayerGroup), { ssr: false })
const FeatureGroup = dynamic(() => import('react-leaflet').then(x => x.FeatureGroup), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(x => x.Popup), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(x => x.Polygon), { ssr: false })

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
      options: { color: '#005a9b' }
    })
  })
})

export default function RoomMap () {
  const router = useRouter()
  const { highlight } = router.query
  const [searchText, setSearchText] = useState(highlight ? highlight.toUpperCase() : '')

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
  }

  return (
    <>
      <AppNavbar title="Raumplan" />

      <AppBody className={styles.container}>
        <Form className={styles.searchForm}>
          <Form.Control
            as="input"
            placeholder="Suche nach 'W003', 'Toilette', 'Bibliothek', ..."
            value={searchText}
            onChange={e => setSearchText(e.target.value.toUpperCase())}
          />
        </Form>

        <MapContainer center={[48.76677, 11.43322]} zoom={18} scrollWheelZoom={true} className={styles.mapContainer}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={21}
          />

          <LayersControl position="topleft" collapsed={false}>
            {filteredFloorOrder.map((floorName, i) => (
              <BaseLayersControl name={floorName} key={floorName} checked={i === 0}>
                <LayerGroup>
                  {filteredFloors[floorName].map((entry, j) => (
                    <FeatureGroup key={j}>
                      <Popup>
                        <strong>{entry.properties.Raum}</strong>,{' '}
                        {entry.properties.Funktion}{' '}
                        (Campus {entry.properties.Standort} Gebäude {entry.properties.Gebaeude})
                      </Popup>
                      <Polygon
                        positions={entry.coordinates}
                        pathOptions={entry.options}
                      />
                    </FeatureGroup>
                  ))}
                </LayerGroup>
              </BaseLayersControl>
            ))}
          </LayersControl>
        </MapContainer>
      </AppBody>
    </>
  )
}
