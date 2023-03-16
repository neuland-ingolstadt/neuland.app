import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import { faCalendarMinus } from '@fortawesome/free-solid-svg-icons'

import { formatFriendlyTime, formatNearDate } from '../../lib/date-utils'
import { getFriendlyTimetable, getTimetableEntryName } from '../../lib/backend-utils/timetable-utils'
import BaseCard from './BaseCard'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import { useTime } from '../../lib/hooks/time-hook'

/**
 * Dashboard card for the timetable.
 */
export default function TimetableCard () {
  const time = useTime()
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)

  useEffect(() => {
    async function load () {
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
    load()
  }, [router, time])

  return (
    <BaseCard
      icon={faCalendarMinus}
      title="Stundenplan"
      link="/timetable"
    >
      <ReactPlaceholder type="text" rows={5} ready={timetable || timetableError}>
        <ListGroup variant="flush">
          {(timetable && timetable.slice(0, 2).map((x, i) => (
            <ListGroup.Item key={i}>
              <div>
                {getTimetableEntryName(x).shortName} in {x.raum}
              </div>
              {((x.startDate < new Date() && x.endDate > new Date()) &&
                (x.endDate - new Date()) <= 30 * 60 * 1000 &&
                <div className="text-muted">Endet in {Math.round((x.endDate - new Date()) / 1000 / 60)} min</div>) ||
                ((x.startDate < new Date() && x.endDate > new Date()) &&
                  (x.endDate - new Date()) > 30 * 60 * 1000 &&
                  <div className="text-muted">Endet um {formatFriendlyTime(x.endDate)}</div>) ||
                ((x.startDate > new Date() && new Date(x.startDate) <= new Date(new Date().getTime() + 30 * 60 * 1000)) &&
                  <div className="text-muted">Beginnt in {Math.round((x.startDate - new Date()) / 1000 / 60)} min</div>) ||
                ((x.startDate > new Date() && new Date(x.startDate) > new Date(new Date().getTime() + 30 * 60 * 1000)) &&
                  <div className="text-muted">{formatNearDate(x.startDate)} um {formatFriendlyTime(x.startDate)}</div>) ||
                null}
            </ListGroup.Item>
          ))) ||
            (timetable && timetable.length === 0 &&
              <ListGroup.Item>Du hast heute keine Vorlesungen mehr.</ListGroup.Item>) ||
            (timetableError &&
              <ListGroup.Item>Fehler beim Abruf des Stundenplans.</ListGroup.Item>)}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
