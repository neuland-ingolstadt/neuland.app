import React from 'react'
import dynamic from 'next/dynamic'

import Container from 'react-bootstrap/Container'
import AppNavbar from '../lib/AppNavbar'

import roomData from '../data/rooms.json'

import styles from '../styles/Map.module.css'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(x => x.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(x => x.TileLayer), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(x => x.Polygon), { ssr: false })

const roomOptions = {
  Büro: { color: '#005a9b' },
  Treppenhaus: { color: 'grey' },
  Flur: { color: 'grey' },
  'Kleiner Hörsaal  (40-79 Plätze)': { color: 'orange' },
  'Großer Hörsaal (80-200 Plätze)': { color: 'darkorange' }
  // TODO more, see cat rooms.json | jq '.features[].properties.Funktion' | sort | uniq -c
}

export default function Room () {
  return (
    <Container className={styles.container}>
      <AppNavbar title="Raumplan" />

      <MapContainer center={[48.76677, 11.43322]} zoom={15} scrollWheelZoom={true} className={styles.mapContainer}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {roomData && roomData.features.map((feature, i) => feature.geometry && feature.geometry.coordinates && (
          <Polygon
            key={i}
            positions={feature.geometry.coordinates}
            pathOptions={roomOptions[feature.properties.Funktion] || { color: 'green' }}
          />
        ))}
      </MapContainer>
    </Container>
  )
}
