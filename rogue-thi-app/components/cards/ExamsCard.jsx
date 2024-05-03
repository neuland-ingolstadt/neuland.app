import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { USER_STUDENT, useUserKind } from '../../lib/hooks/user-kind'
import BaseCard from './BaseCard'
import { formatFriendlyRelativeTime } from '../../lib/date-utils'
import { loadExamList } from '../../lib/backend-utils/calendar-utils'
import { useTime } from '../../lib/hooks/time-hook'

import { GraduationCap } from 'lucide-react'

import { NoSessionError } from '../../lib/backend/thi-session-handler'

/**
 * Dashboard card for semester and exam dates.
 */
export default function ExamsCard() {
  const router = useRouter()
  const time = useTime()
  const [exams, setExams] = useState(null)
  const { userKind } = useUserKind()

  useEffect(() => {
    async function load() {
      try {
        let examList = await loadExamList()

        // filter out exams that are already over
        examList = examList.filter((x) => x.date > Date.now())

        // filter out exams that are not more than 30 days in the future
        examList = examList.filter(
          (x) => x.date < Date.now() + 1000 * 60 * 60 * 24 * 30
        )

        setExams(examList)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
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

  // return nothing if there are no exams
  if (!exams || exams.length === 0) {
    return null
  }

  return (
    <BaseCard
      icon={GraduationCap}
      i18nKey="exams"
      link="/calendar?focus=exams"
    >
      <ListGroup variant="flush">
        {exams &&
          exams.slice(0, 2).map((x, i) => (
            <ListGroup.Item key={i}>
              <div>{x.name}</div>
              <div className="text-muted">
                {x.seat}
                {' - '}
                {formatFriendlyRelativeTime(x.date, time)}
              </div>
            </ListGroup.Item>
          ))}
      </ListGroup>
    </BaseCard>
  )
}
