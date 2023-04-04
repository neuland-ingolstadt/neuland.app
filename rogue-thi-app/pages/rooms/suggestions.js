import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { faArrowRight, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyTime, isSameDay } from '../../lib/date-utils'
import { findSuggestedRooms } from '../../lib/backend-utils/rooms-utils'

import styles from '../../styles/RoomsSearch.module.css'

import { USER_STUDENT, useUserKind } from '../../lib/hooks/user-kind'
import { getFriendlyTimetable, getTimetableEntryName, getTimetableGaps } from '../../lib/backend-utils/timetable-utils'

const TUX_ROOMS = ['G308']

/**
 * Page containing the room search.
 */
export default function RoomSearch () {
  const router = useRouter()

  const [suggestions, setSuggestions] = useState(null)

  const userKind = useUserKind()

  useEffect(() => {
    async function load () {
      try {
        // get timeable and filter for today
        const timetable = await getFriendlyTimetable(new Date(), false)
        const today = timetable.filter(x => isSameDay(x.startDate, new Date()))

        if (today.length < 1) {
          // no lectures today -> no rooms to show
          setSuggestions([])
          return
        }

        const gaps = getTimetableGaps(today)
        if (gaps.length < 1) {
          // no gaps today -> no rooms to show
          setSuggestions([])
          return
        }

        const suggestions = await Promise.all(gaps.map(async (gap) => {
          const rooms = await findSuggestedRooms(gap.endLecture.raum, gap.startDate, gap.endDate)

          return (
            {
              gap,
              rooms: rooms.slice(0, 4)
            }
          )
        }))

        setSuggestions(suggestions)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=rooms%2Fsuggestions')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }

    if (userKind === USER_STUDENT) {
      load()
    }
  }, [router, userKind])

  return (
    <AppContainer>
      <AppNavbar title={'Raum Vorschläge'} />

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={suggestions || userKind !== USER_STUDENT}>
          {suggestions && suggestions.map((result, idx) =>
            <div key={idx}>
              <div className={styles.suggestion}>
                {result.gap.startLecture ? getTimetableEntryName(result.gap.startLecture).shortName : 'Jetzt'}
                <FontAwesomeIcon icon={faArrowRight} className={styles.icon} />
                {getTimetableEntryName(result.gap.endLecture).shortName}

                <div className={styles.time}>
                  {'Pause von '}
                  {result.gap.startLecture ? formatFriendlyTime(result.gap.startLecture.endDate) : 'Jetzt'}
                  {' bis '}
                  {formatFriendlyTime(result.gap.endLecture.startDate)}
                </div>
              </div>
              <ListGroup>
                {result.rooms.map((roomResult, idx) =>
                  <ListGroup.Item key={idx} className={styles.item}>
                    <div className={styles.left}>
                      <Link href={`/rooms?highlight=${roomResult.room}`}>
                        {roomResult.room}
                      </Link>
                      {TUX_ROOMS.includes(roomResult.room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                      <div className={styles.details}>
                        {roomResult.type}
                      </div>
                    </div>
                    <div className={styles.right}>
                      frei ab {formatFriendlyTime(roomResult.from)}<br />
                      bis {formatFriendlyTime(roomResult.until)}
                    </div>
                  </ListGroup.Item>
                )}
                {result.rooms.length === 0 &&
                  <ListGroup.Item className={styles.item}>
                    Keine freien Räume gefunden.
                  </ListGroup.Item>
                }
              </ListGroup>
            </div>
          )}
        </ReactPlaceholder>

        {suggestions && suggestions.length === 0 &&
          <div className={styles.noSuggestions}>
            <FontAwesomeIcon icon={faCalendar} size="xl" style={ { marginBottom: '15px' } } />
            <br />
            Keine Vorschläge verfügbar
          </div>
        }
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
