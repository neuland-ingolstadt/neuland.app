import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { faDoorOpen } from '@fortawesome/free-solid-svg-icons'

import BaseCard from './BaseCard'

import { getNextValidDate, searchRooms } from '../../lib/backend-utils/rooms-utils'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import ReactPlaceholder from 'react-placeholder/lib'
import { formatFriendlyTime } from '../../lib/date-utils'
import { getFriendlyTimetable } from '../../lib/backend-utils/timetable-utils'

import { USER_STUDENT, useUserKind } from '../../lib/hooks/user-kind'

/**
 * Dashboard card for semester and exam dates.
 */
export default function RoomCard () {
  const router = useRouter()
  const [filterResults, setFilterResults] = useState(null)
  const userKind = useUserKind()

  useEffect(() => {
    async function load () {
      try {
        // get timeable and filter for today
        const timetable = await getFriendlyTimetable(new Date(), false)
        const today = timetable.filter(x => x.startDate.getDate() === new Date().getDate())

        if (today.length < 1) {
          // no lectures today -> no rooms to show
          setFilterResults([])
          return
        }

        /**
         * If only one lecture is left, find gap between now and start of last lecture.
         * Else: find gap between end of next (or current) lecture and start of next lecture.
         */
        const startDate = today.length === 1 ? getNextValidDate() : today[0].endDate
        const endDate = today.length === 1 ? today[0].startDate : today[1].startDate

        if (startDate.getTime() > endDate.getTime()) {
          // last lecture of the day is already running -> no need to show rooms
          setFilterResults([])
          return
        }

        // filter for suitable rooms
        const roomRegex = /^[a-zA-Z]+/
        const building = roomRegex.exec((today.length > 1 ? today[1] : today[0]).raum)[0]
        let rooms = await searchRooms(startDate, endDate)

        // filter for building
        const sameBuilding = rooms.filter(x => x.room.startsWith(building))
        const sameFloor = rooms.filter(x => x.room.startsWith(building + today[0].raum[building.length]))
        rooms = sameFloor.length > 0 ? sameFloor : sameBuilding.length > 0 ? sameBuilding : rooms

        // hide Neuburg buildings if next lecture is not in Neuburg
        rooms = rooms.filter(x => x.room.includes('N') === building.includes('N'))

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
      title="Räume"
      link="/rooms"
    >
      <ReactPlaceholder type="text" rows={4} ready={filterResults || userKind !== USER_STUDENT}>
        <ListGroup variant="flush">
          {filterResults && filterResults.slice(0, 2).map((x, i) => {
            return (
              <ListGroup.Item key={i}>
                <div>
                  {x.room}
                </div>
                <div className="text-muted">
                  Frei von {formatFriendlyTime(x.from)} bis {formatFriendlyTime(x.until)}
                </div>
              </ListGroup.Item>
            )
          }
          )}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
