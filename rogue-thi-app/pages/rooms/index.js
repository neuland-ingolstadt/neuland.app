import PropTypes from 'prop-types'
import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import 'leaflet/dist/leaflet.css'
import styles from '../../styles/Rooms.module.css'

const ASSETSERVER_URL = process.env.NEXT_PUBLIC_ASSETSERVER_URL
const ROOMDATA_URL = `${ASSETSERVER_URL}/manual/rooms_neuland.geojson`

// import RoomMap without SSR because react-leaflet really does not like SSR
const RoomMap = dynamic(() => import('../../components/RoomMap'), { ssr: false })

export async function getStaticProps () {
  const response = await fetch(ROOMDATA_URL)
  const roomData = await response.json()
  return {
    props: {
      roomData
    }
  }
}

/**
 * Page containing the room map.
 */
export default function Rooms ({ roomData }) {
  const router = useRouter()
  const { highlight } = router.query

  return (
    <AppContainer className={styles.container}>
      <AppNavbar title="Raumplan" showBack={'desktop-only'}>
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link variant="link" href="/rooms/list">
            Stündlicher Plan
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => window.open('https://ophase.neuland.app/', '_blank')}>
            Campus- {'&'} Stadtführung
          </AppNavbar.Overflow.Link>
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
