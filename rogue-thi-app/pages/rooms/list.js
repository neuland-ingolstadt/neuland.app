import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyTime, formatNearDate } from '../../lib/date-utils'
import API from '../../lib/backend/authenticated-api'

import styles from '../../styles/RoomsList.module.css'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

const TUX_ROOMS = ['G308']

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'rooms',
      'common'
    ]))
  }
})

/**
 * Page containing a textual representation of the room openings.
 */
export default function RoomList () {
  const router = useRouter()
  const [freeRooms, setFreeRooms] = useState(null)

  const { t } = useTranslation('rooms')

  useEffect(() => {
    async function load () {
      try {
        const now = new Date()
        const data = await API.getFreeRooms(now)

        const days = data.rooms.map(day => {
          const result = {}
          result.date = new Date(day.datum)
          result.hours = {}

          day.rtypes.forEach(roomType => Object.entries(roomType.stunden).forEach(([hIndex, hour]) => {
            const to = new Date(day.datum + 'T' + hour.bis)
            if (to < now) { return }

            if (!result.hours[hIndex]) {
              result.hours[hIndex] = {
                from: new Date(day.datum + 'T' + hour.von),
                to: new Date(day.datum + 'T' + hour.bis),
                roomTypes: {}
              }
            }

            result.hours[hIndex].roomTypes[roomType.raumtyp] = hour.raeume.split(', ')
          }))

          return result
        })
          .filter(day => Object.entries(day.hours) !== 0)

        setFreeRooms(days)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=rooms%2Flist')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  return (
    <AppContainer>
      <AppNavbar title={t('rooms.list.appbar.title')} />

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={freeRooms}>
          {freeRooms && freeRooms.map((day, i) =>
            Object.values(day.hours).map((hour, j) =>
              <ListGroup key={i + '-' + j}>
                <h4 className={styles.dateBoundary}>
                  {formatNearDate(day.date)}, {formatFriendlyTime(hour.from)} - {formatFriendlyTime(hour.to)}
                </h4>

                {Object.entries(hour.roomTypes).map(([roomName, rooms], idx) =>
                  <ListGroup.Item key={idx} className={styles.item}>
                    <div className={styles.left}>
                      <div className={styles.name}>
                        {roomName}
                      </div>
                      <div className={styles.room}>
                        {rooms.map((room, idx) =>
                          <span key={idx}>
                            <Link href={`/rooms?highlight=${room}`}>
                              {room}
                            </Link>
                            {TUX_ROOMS.includes(room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                            {idx === rooms.length - 1 ? '' : ', '}
                          </span>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            )
          )}
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
