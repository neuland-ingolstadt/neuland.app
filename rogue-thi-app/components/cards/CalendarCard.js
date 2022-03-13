import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons'

import { calendar, loadExamList } from '../../lib/backend-utils/calendar-utils'
import BaseCard from './BaseCard'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyRelativeTime } from '../../lib/date-utils'
import { useTime } from '../../lib/hooks/time-hook'

export default function CalendarCard () {
  const router = useRouter()
  const time = useTime()
  const [mixedCalendar, setMixedCalendar] = useState(calendar)

  useEffect(() => {
    async function load () {
      let exams = []
      try {
        exams = (await loadExamList())
          .filter(x => !!x.date) // remove exams without a date
          .map(x => ({ name: `Prüfung ${x.titel}`, begin: x.date }))
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else if (e.message === 'Query not possible') {
          // ignore, leaving examList empty
        } else {
          console.error(e)
        }
      }

      const combined = [...calendar, ...exams]
        .sort((a, b) => a.begin - b.begin)
        .filter(x => x.begin > Date.now() || x.end > Date.now())
      setMixedCalendar(combined)
    }
    load()
  }, [router])

  return (
    <BaseCard
      icon={faCalendarAlt}
      title="Termine"
      link="/calendar"
    >
      <ListGroup variant="flush">
        {mixedCalendar && mixedCalendar.slice(0, 2).map((x, i) => (
          <ListGroup.Item key={i}>
            <div>
              {x.name}
            </div>
            <div className="text-muted">
              {(x.end && x.begin < time)
                ? 'endet ' + formatFriendlyRelativeTime(x.end)
                : 'beginnt ' + formatFriendlyRelativeTime(x.begin)}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </BaseCard>
  )
}
