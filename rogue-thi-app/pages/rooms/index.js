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

// import RoomMap without SSR because react-leaflet really does not like SSR
const RoomMap = dynamic(() => import('../../components/RoomMap'), { ssr: false })

export default function Rooms () {
  const router = useRouter()
  const { highlight } = router.query

  return (
    <AppContainer className={styles.container}>
      <AppNavbar title="Raumplan" showBack={'desktop-only'}>
        <Dropdown.Item variant="link" href="/rooms/search">
          Erweiterte Suche
        </Dropdown.Item>
        <Dropdown.Item variant="link" href="/rooms/list">
          Listenansicht
        </Dropdown.Item>
      </AppNavbar>

      <AppBody className={styles.body}>
        <RoomMap highlight={highlight} />
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
