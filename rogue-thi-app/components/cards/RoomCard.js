import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { faDoorOpen } from '@fortawesome/free-solid-svg-icons'

import BaseCard from './BaseCard'

import { formatFriendlyTime, isSameDay } from '../../lib/date-utils'
import { getFriendlyTimetable, getTimetableGaps } from '../../lib/backend-utils/timetable-utils'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import ReactPlaceholder from 'react-placeholder/lib'
import { findSuggestedRooms } from '../../lib/backend-utils/rooms-utils'

import { USER_STUDENT, useUserKind } from '../../lib/hooks/user-kind'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

/**
 * Dashboard card for semester and exam dates.
 */
export default function RoomCard () {
  const router = useRouter()
  const [filterResults, setFilterResults] = useState(null)
  const userKind = useUserKind()
  const { t } = useTranslation('dashboard')

  useEffect(() => {
    async function load () {
      try {
        // get timeable and filter for today
        const timetable = await getFriendlyTimetable(new Date(), false)
        const today = timetable.filter(x => isSameDay(x.startDate, new Date()))

        if (today.length < 1) {
          // no lectures today -> no rooms to show
          setFilterResults([])
          return
        }

        const gaps = getTimetableGaps(today)
        if (gaps.length < 1) {
          // no gaps today -> no rooms to show
          setFilterResults([])
          return
        }

        // filter for suitable rooms
        const nextGap = gaps[0]
        const rooms = await findSuggestedRooms(nextGap.endLecture.raum, nextGap.startDate, nextGap.endDate)

        // idea: instead of showing the rooms that are near to the next lecture, show the rooms that are between the current lecture and the next lecture

        setFilterResults(rooms)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else if (e.message === 'Query not possible') {
          // ignore, leaving examList empty
        } else {
          console.error(e)
        }
      }
    }

    if (userKind === USER_STUDENT) {
      load()
    }
  }, [router, userKind])

  return (
    <BaseCard
      icon={faDoorOpen}
      i18nKey="rooms"
      link="/rooms"
    >
      <ReactPlaceholder type="text" rows={4} ready={filterResults || userKind !== USER_STUDENT}>
        <ListGroup variant="flush">
          {filterResults && filterResults.slice(0, 2).map((x, i) => {
            return (
              <ListGroup.Item key={i}>
                <Link href={'/rooms/suggestions'}>
                  <div>
                    <div>
                      {x.room}
                    </div>
                    <div className="text-muted">
                      {t('rooms.text', { from: formatFriendlyTime(x.from), until: formatFriendlyTime(x.until) })}
                    </div>
                  </div>
                </Link>
              </ListGroup.Item>
            )
          }
          )}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
