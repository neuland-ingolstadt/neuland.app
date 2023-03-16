import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import { faCalendarMinus } from '@fortawesome/free-solid-svg-icons'

import { formatFriendlyTime, formatNearDate } from '../../lib/date-utils'
import { getFriendlyTimetable, getTimetableEntryName } from '../../lib/backend-utils/timetable-utils'
import BaseCard from './BaseCard'
import { NoSessionError } from '../../lib/backend/thi-session-handler'

/**
 * Dashboard card for the timetable.
 */
export default function TimetableCard () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    async function loadTimetable () {
      try {
        setTimetable(await getFriendlyTimetable(new Date(), false))
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else {
          console.error(e)
          setTimetableError(e)
        }
      }
    }
    loadTimetable()
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BaseCard
      icon={faCalendarMinus}
      title="Stundenplan"
      link="/timetable"
    >
      <ReactPlaceholder type="text" rows={5} ready={timetable || timetableError}>
        <ListGroup variant="flush">
          {(timetable && timetable.slice(0, 2).map((x, i) => {
            const isSoon = (x.startDate > currentTime && new Date(x.startDate) <= new Date(currentTime.getTime() + 30 * 60 * 1000))
            const isOngoing = x.startDate < currentTime && x.endDate > currentTime
            const isEndingSoon = isOngoing && (x.endDate - currentTime) <= 30 * 60 * 1000
            const isNotSoonOrOngoing = !isSoon && !isOngoing

            let text = null
            if (isEndingSoon) {
              text = <div className="text-muted">Endet in {Math.ceil((x.endDate - currentTime) / 1000 / 60)} min</div>
            } else if (isOngoing) {
              text = <div className="text-muted">Endet um {formatFriendlyTime(x.endDate)}</div>
            } else if (isSoon) {
              text = <div className="text-muted">Beginnt in {Math.ceil((x.startDate - currentTime) / 1000 / 60)} min</div>
            } else if (isNotSoonOrOngoing) {
              text = <div className="text-muted">{formatNearDate(x.startDate)} um {formatFriendlyTime(x.startDate)}</div>
            }

            return (
              <ListGroup.Item key={i}>
                <div>
                  {getTimetableEntryName(x).shortName} in {x.raum}
                </div>
                {text}
              </ListGroup.Item>
            )
          })) ||
            (timetable && timetable.length === 0 &&
              <ListGroup.Item>Du hast heute keine Vorlesungen mehr.</ListGroup.Item>) ||
            (timetableError &&
              <ListGroup.Item>Fehler beim Abruf des Stundenplans.</ListGroup.Item>)}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
