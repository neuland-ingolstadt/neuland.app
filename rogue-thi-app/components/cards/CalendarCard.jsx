import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { Calendar } from 'lucide-react'

import { calendar, loadExamList } from '../../lib/backend-utils/calendar-utils'
import BaseCard from './BaseCard'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import { formatFriendlyRelativeTime } from '../../lib/date-utils'
import { useTime } from '../../lib/hooks/time-hook'

import { i18n, useTranslation } from 'next-i18next'
/**
 * Dashboard card for semester and exam dates.
 */
export default function CalendarCard() {
  const router = useRouter()
  const time = useTime()
  const [mixedCalendar, setMixedCalendar] = useState(calendar)
  const { t } = useTranslation('dashboard')

  useEffect(() => {
    async function load() {
      let exams = []
      try {
        exams = (await loadExamList())
          .filter((x) => !!x.date) // remove exams without a date
          .map((x) => ({
            name: `${t('calendar.exam')} ${x.name}`,
            begin: x.date,
          }))
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
        .filter((x) => x.begin > Date.now() || x.end > Date.now())
      setMixedCalendar(combined)
    }
    load()
  }, [router, t])

  return (
    <BaseCard
      icon={Calendar}
      i18nKey="calendar"
      link="/calendar"
    >
      <ListGroup variant="flush">
        {mixedCalendar &&
          mixedCalendar.slice(0, 2).map((x, i) => (
            <ListGroup.Item key={i}>
              <div>
                {typeof x.name === 'object'
                  ? x.name[i18n.languages[0]]
                  : x.name}
              </div>
              <div className="text-muted">
                {x.end && x.begin < time
                  ? t('calendar.date.ends') +
                    ' ' +
                    formatFriendlyRelativeTime(x.end)
                  : t('calendar.date.starts') +
                    ' ' +
                    formatFriendlyRelativeTime(x.begin)}
              </div>
            </ListGroup.Item>
          ))}
      </ListGroup>
    </BaseCard>
  )
}
