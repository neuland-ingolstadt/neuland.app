import PropTypes from 'prop-types'
import React from 'react'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import styles from '../../styles/Rooms.module.css'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

import RoomMap from '../../components/map/RoomMap'

const ROOM_DATA_URL = 'https://assets.neuland.app/rooms_neuland_v2.4.geojson'

/**
 * Page containing the room map.
 */
export default function Rooms({ roomData, highlight }) {
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

export async function getServerSideProps({ locale, query }) {
  const response = await fetch(ROOM_DATA_URL)
  const roomData = await response.json()

  const highlight = query.highlight || null

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'rooms',
        'common',
        'api-translations',
      ])),
      roomData,
      highlight,
    },
  }
}
