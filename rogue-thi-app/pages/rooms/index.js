import fs from 'fs'
import https from 'https'

import PropTypes from 'prop-types'
import React from 'react'
import dynamic from 'next/dynamic'

import Dropdown from 'react-bootstrap/Dropdown'

import AppBody from '../../components/AppBody'
import AppContainer from '../../components/AppContainer'
import AppNavbar from '../../components/AppNavbar'
import AppTabbar from '../../components/AppTabbar'

import 'leaflet/dist/leaflet.css'
import styles from '../../styles/Rooms.module.css'
import { useRouter } from 'next/router'

const MAP_CA = 'data/map-thi-de-chain.pem'
const ROOMDATA_URL = 'https://map.thi.de/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=mythi%3ATHI_Raeume'

// import RoomMap without SSR because react-leaflet really does not like SSR
const RoomMap = dynamic(() => import('../../components/RoomMap'), { ssr: false })

export async function getStaticProps () {
  const response = await fetch(ROOMDATA_URL, {
    // as of 2021-09-29 map.thi.de uses a cert signed by USERtrust
    // the file below includes the fullchain of that CA
    agent: new https.Agent({
      ca: fs.readFileSync(MAP_CA)
    })
  })
  const roomData = await response.json()
  return {
    props: {
      roomData
    }
  }
}

export default function Rooms ({ roomData }) {
  const router = useRouter()
  const { highlight } = router.query

  return (
    <AppContainer className={styles.container}>
      <AppNavbar title="Raumplan" showBack={'desktop-only'}>
        <AppNavbar.Overflow>
          <Dropdown.Item variant="link" href="/rooms/search">
            Erweiterte Suche
          </Dropdown.Item>
          <Dropdown.Item variant="link" href="/rooms/list">
            Listenansicht
          </Dropdown.Item>
          <Dropdown.Item variant="link" onClick={() => window.open('https://ophase.neuland.app/', '_blank')}>
            Campus- {'&'} Stadtführung
          </Dropdown.Item>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody className={styles.body}>
        <RoomMap highlight={highlight} roomData={roomData} />
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

Rooms.propTypes = {
  roomData: PropTypes.object
}
