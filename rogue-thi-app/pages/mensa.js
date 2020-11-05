import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'

import styles from '../styles/Timetable.module.css'

import { obtainSession, getMensaPlan } from '../lib/thi-api-client'
import { formatFriendlyDate } from '../lib/date-utils'

function parseGermanDate(str) {
  const match = str.match(/^\w+ (\d{2}).(\d{2}).(\d{4})$/)
  const [_, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Timetable () {
  const router = useRouter()
  const [mensaPlan, setMensaPlan] = useState(null)

  useEffect(async () => {
    const today = new Date()

    const session = await obtainSession(router)
    const data = await getMensaPlan(session)

    const days = data.map(x => ({
        date: parseGermanDate(x.tag),
        meals: Object.entries(x.gerichte).map(([index, meal]) => ({
          name: meal.name[1],
          prices: meal.name.slice(2, 5),
          supplements: meal.zusatz.replace(/,/g, ", "),
        })),
    }))

    setMensaPlan(days)
  }, [])

  return (
    <Container>
      {mensaPlan && mensaPlan.map((day, idx) =>
        <ListGroup key={idx}>
          <h4 className={styles.dateBoundary}>
            {formatFriendlyDate(day.date)}
          </h4>

          {day.meals.map((meal, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                <div className={styles.name}>
                  {meal.name}
                </div>
                <div className={styles.room}>
                  {meal.supplements}
                </div>
              </div>
              <div className={styles.right}>
                {meal.prices.join(" / ")}
              </div>
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
      <br />
    </Container>
  )
}
