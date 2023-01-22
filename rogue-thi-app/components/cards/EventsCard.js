import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useRouter } from 'next/router'

import { faUserGroup } from '@fortawesome/free-solid-svg-icons'

import BaseCard from './BaseCard'

import NeulandAPI from '../../lib/backend/neuland-api'

export default function CalendarCard () {
  const router = useRouter()
  const [calendar, setCalendar] = useState([])

  useEffect(() => {
    async function load () {
      try {
        const events = await NeulandAPI.getCampusLifeEvents()
        setCalendar(events)
      } catch (e) {
        // directly notifying the user about the error is not necessary here
        console.error(e)
      }
    }
    load()
  }, [router])

  return (
    <BaseCard
      icon={faUserGroup}
      title="Veranstaltungen"
      link="/events"
    >
      <ListGroup variant="flush">
        {calendar.slice(0, 2).map((x, i) => (
          <ListGroup.Item key={i}>
            <div>
              {x.title}
            </div>
            <div className="text-muted">
              von {x.organizer}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </BaseCard>
  )
}
