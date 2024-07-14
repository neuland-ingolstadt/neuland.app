import PropTypes from 'prop-types'
import React from 'react'
import { useRouter } from 'next/router'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import styles from '../../styles/Rooms.module.css'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

import RoomMap from '../../components/map/RoomMap'

const ROOMDATA_URL = 'https://assets.neuland.app/rooms_neuland_v2.4.geojson'

// import RoomMap without SSR because react-leaflet really does not like SSR
// const RoomMap = dynamic(() => import('../../components/RoomMap'), {
//   ssr: false,
// })

export async function getStaticProps({ locale }) {
  const response = await fetch(ROOMDATA_URL)
  const roomData = await response.json()
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'rooms',
        'common',
        'api-translations',
      ])),
      roomData,
    },
  }
}

/**
 * Page containing the room map.
 */
export default function Rooms({ roomData }) {
  const router = useRouter()
  const { highlight } = router.query

  const { t } = useTranslation('rooms')

  return (
    <AppContainer className={styles.container}>
      <AppNavbar
        title={t('rooms.map.appbar.title')}
        showBack={'desktop-only'}
      >
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link
            variant="link"
            href="/rooms/list"
          >
            {t('rooms.overflow.hourlyPlan')}
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link
            variant="link"
            onClick={() => window.open('https://ophase.neuland.app/', '_blank')}
          >
            {t('rooms.overflow.campusCityTour')}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody className={styles.body}>
        <RoomMap
          roomData={roomData}
          highlight={highlight}
        />
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
Rooms.propTypes = {
  roomData: PropTypes.object,
}
