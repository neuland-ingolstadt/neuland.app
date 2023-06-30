import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { useRouter } from 'next/router'

import { faCalendarMinus } from '@fortawesome/free-solid-svg-icons'

import { formatFriendlyTime, formatNearDate } from '../../lib/date-utils'
import { getFriendlyTimetable, getTimetableEntryName } from '../../lib/backend-utils/timetable-utils'
import BaseCard from './BaseCard'
import { NoSessionError } from '../../lib/backend/thi-session-handler'
import { useTranslation } from 'next-i18next'

/**
 * Dashboard card for the timetable.
 */
export default function TimetableCard () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [timetableError, setTimetableError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { t } = useTranslation('dashboard')

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
      i18nKey="timetable"
      link="/timetable"
    >
      <ReactPlaceholder type="text" rows={5} ready={timetable || timetableError}>
        <ListGroup variant="flush">
          {(timetable && timetable.slice(0, 2).map((x, i) => {
            const isSoon = (x.begin > currentTime && new Date(x.begin) <= new Date(currentTime.getTime() + 30 * 60 * 1000))
            const isOngoing = x.begin < currentTime && x.end > currentTime
            const isEndingSoon = isOngoing && (x.end - currentTime) <= 30 * 60 * 1000
            const isNotSoonOrOngoing = !isSoon && !isOngoing

            let text = null
            if (isEndingSoon) {
              text = <div className="text-muted">{t('timetable.text.endingSoon', { mins: Math.ceil((x.end - currentTime) / 1000 / 60) })}</div>
            } else if (isOngoing) {
              text = <div className="text-muted">{t('timetable.text.ongoing', { time: formatFriendlyTime(x.end) })}</div>
            } else if (isSoon) {
              text = <div className="text-muted">
                {t('timetable.text.startingSoon', {
                  mins: Math.ceil((x.begin - currentTime) / 1000 / 60)
                }
                )}
              </div>
            } else if (isNotSoonOrOngoing) {
              text = <div className="text-muted">{formatNearDate(x.begin)} {t('timetable.text.future')} {formatFriendlyTime(x.begin)}</div>
            }

            return (
              <ListGroup.Item key={i}>
                <div>
                  {getTimetableEntryName(x).shortName} in {x.rooms.join(', ')}
                </div>
                {text}
              </ListGroup.Item>
            )
          }))}
          {(timetable && timetable.length === 0) &&
              <ListGroup.Item>Du hast heute keine Vorlesungen mehr.</ListGroup.Item>
          }
          {(timetableError &&
              <ListGroup.Item>Fehler beim Abruf des Stundenplans.</ListGroup.Item>)
          }
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
