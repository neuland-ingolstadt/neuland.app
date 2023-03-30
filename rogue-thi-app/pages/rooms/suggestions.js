import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../../lib/backend/thi-session-handler'
import { findSuggestedRooms } from '../../lib/backend-utils/rooms-utils'
import { formatFriendlyTime } from '../../lib/date-utils'

import styles from '../../styles/RoomsSearch.module.css'

import { USER_GUEST, USER_STUDENT, useUserKind } from '../../lib/hooks/user-kind'
import { getFriendlyTimetable, getTimetableEntryName, getTimetableGaps } from '../../lib/backend-utils/timetable-utils'

const TUX_ROOMS = ['G308']
const TITLE = 'Raum Vorschläge'

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
        const today = timetable.filter(x => x.startDate.getDate() === new Date().getDate())

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
              rooms: rooms.slice(0, 3)
            }
          )
        }))

        console.log(suggestions)

        // idea: instead of showing the rooms that are near to the next lecture, show the rooms that are between the current lecture and the next lecture

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

  if (userKind === USER_GUEST) {
    return (
      <AppContainer>
      <AppNavbar title={TITLE} />

      <AppBody >
        <div className={ styles.login }>
          <p>Bitte logge dich ein, um diese Funktion zu nutzen.</p>
          <br />
          <Link href="/login?redirect=rooms%2Fsuggestions">
            <Button variant="primary">Login</Button>
          </Link>
        </div>
      </AppBody>

      <AppTabbar />
    </AppContainer>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={TITLE} />

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
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
