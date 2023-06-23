import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { BUILDINGS_ALL, DURATION_PRESET, filterRooms, getNextValidDate } from '../../lib/backend-utils/rooms-utils'
import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../../lib/date-utils'

import styles from '../../styles/RoomsSearch.module.css'

import { Trans, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const BUILDINGS = ['A', 'B', 'BN', 'C', 'CN', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'M', 'P', 'W', 'Z']
const DURATIONS = ['00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45', '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45', '06:00']
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
 * Page containing the room search.
 */
export default function RoomSearch () {
  const router = useRouter()
  const startDate = getNextValidDate()

  const [building, setBuilding] = useState(BUILDINGS_ALL)
  const [date, setDate] = useState(formatISODate(startDate))
  const [time, setTime] = useState(formatISOTime(startDate))
  const [duration, setDuration] = useState(DURATION_PRESET)

  const [searching, setSearching] = useState(false)
  const [filterResults, setFilterResults] = useState(null)

  const { t } = useTranslation('rooms')

  /**
   * Searches and displays rooms with the specified filters.
   */
  const filter = useCallback(async () => {
    setSearching(true)
    setFilterResults(null)

    const rooms = await filterRooms(date, time, building, duration)

    console.log(`Found ${rooms.length} results`)
    setFilterResults(rooms)
  }, [building, date, duration, time])

  useEffect(() => {
    async function load () {
      try {
        await filter()
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=rooms%2Fsearch')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [filter, router])

  return (
    <AppContainer>
      <AppNavbar title={t('rooms.search.appbar.title')} />

      <AppBody>
        <Form>
          <div className={styles.searchForm}>
            <Form.Group>
              <Form.Label>
                {t('rooms.search.building')}
              </Form.Label>
              <Form.Control
                as="select"
                value={building}
                onChange={e => setBuilding(e.target.value)}
              >
                <option key={BUILDINGS_ALL}>{t('rooms.search.buildingsAll')}</option>
                {BUILDINGS.map(b => <option key={b}>{b}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>
                {t('rooms.search.date')}
              </Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                {t('rooms.search.time')}
              </Form.Label>
              <Form.Control
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                {t('rooms.search.duration')}
              </Form.Label>
              <Form.Control
                as="select"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              >
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </Form.Control>
            </Form.Group>
          </div>
          <Button onClick={() => filter()}>
            {t('rooms.search.search')}
          </Button>
        </Form>

        <br />

        {searching &&
          <ReactPlaceholder type="text" rows={10} ready={filterResults}>
            <ListGroup>
              {filterResults && filterResults.map((result, idx) =>
                <ListGroup.Item key={idx} className={styles.item}>
                  <div className={styles.left}>
                    <Link href={`/rooms?highlight=${result.room}`}>
                      {result.room}
                    </Link>
                    {TUX_ROOMS.includes(result.room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                    <div className={styles.details}>
                      {result.type}
                    </div>
                  </div>
                  <div className={styles.right}>
                    <Trans
                      i18nKey="rooms.common.availableFromUntil"
                      ns='rooms'
                      values={{
                        from: formatFriendlyTime(result.from),
                        until: formatFriendlyTime(result.until)
                      }}
                      components={{
                        br: <br />
                      }}
                    />
                  </div>
                </ListGroup.Item>
              )}
              {filterResults && filterResults.length === 0 &&
                <ListGroup.Item className={styles.item}>
                  {t('rooms.search.results.noAvailableRooms')}
                </ListGroup.Item>
              }
            </ListGroup>
          </ReactPlaceholder>
        }
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
