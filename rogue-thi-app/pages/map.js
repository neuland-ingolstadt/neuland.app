import React, { useEffect, useState } from 'react'

import Container from 'react-bootstrap/Container'
import AppNavbar from '../lib/AppNavbar'

import styles from '../styles/Common.module.css'

import roomData from '../data/rooms.json'

const roomOptions = {
  "Büro": { color: "#005a9b" },
  "Treppenhaus": { color: "grey" },
  "Flur": { color: "grey" },
  "Kleiner Hörsaal  (40-79 Plätze)": { color: "orange" },
  "Großer Hörsaal (80-200 Plätze)": { color: "darkorange" },
  // TODO more, see cat rooms.json | jq '.features[].properties.Funktion' | sort | uniq -c
};

export default function Room () {

  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => setIsRunning(true))

  if(!isRunning || !process.browser)
    return (<></>)

  const { MapContainer, TileLayer, Polygon } = require('react-leaflet')

  return (
    <Container>
      <AppNavbar title="Raumplan">
      </AppNavbar>

      
      <div>
        <MapContainer center={[48.76677, 11.43322]} zoom={15} scrollWheelZoom={true}>
          <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {roomData && roomData.features.map((feature, i) => feature.geometry && feature.geometry.coordinates && (
            <Polygon key={i} positions={feature.geometry.coordinates}
            pathOptions={roomOptions[feature.properties.Funktion] || { color: "green" }}>

            </Polygon>
          ))}
        </MapContainer>
      </div>
    </Container>
  )
}
