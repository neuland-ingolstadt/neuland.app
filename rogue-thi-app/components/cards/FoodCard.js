import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'

import BaseCard from './BaseCard'
import { formatISODate } from '../../lib/date-utils'
import { loadFoodEntries } from '../../lib/backend-utils/food-utils'

/**
 * Dashboard card for Mensa and Reimanns food plans.
 */
export default function FoodCard () {
  const [foodEntries, setFoodEntries] = useState(null)
  const [foodCardTitle, setFoodCardTitle] = useState('Essen')
  const [foodError, setFoodError] = useState(null)

  useEffect(() => {
    async function load () {
      const restaurants = localStorage.selectedRestaurants
        ? JSON.parse(localStorage.selectedRestaurants)
        : ['mensa']
      if (restaurants.length === 1 && restaurants[0] === 'mensa') {
        setFoodCardTitle('Mensa')
      } else if (restaurants.length === 1 && restaurants[0] === 'reimanns') {
        setFoodCardTitle('Reimanns')
      } else {
        setFoodCardTitle('Essen')
      }

      const today = formatISODate(new Date())
      try {
        const entries = await loadFoodEntries(restaurants)
        const todayEntries = entries.find(x => x.timestamp === today)?.meals
        if (!todayEntries) {
          setFoodEntries([])
        } else if (todayEntries.length > 2) {
          setFoodEntries([
            todayEntries[0].name,
            `und ${todayEntries.length - 1} weitere Gerichte`
          ])
        } else {
          setFoodEntries(todayEntries.map(x => x.name))
        }
      } catch (e) {
        console.error(e)
        setFoodError(e)
      }
    }
    load()
  }, [])

  return (
    <BaseCard
      icon={faUtensils}
      title={foodCardTitle}
      link="/food"
    >
      <ReactPlaceholder type="text" rows={5} ready={foodEntries || foodError}>
        <ListGroup variant="flush">
          {foodEntries && foodEntries.map((x, i) => <ListGroup.Item key={i}>
            {x}
          </ListGroup.Item>
          )}
          {foodEntries && foodEntries.length === 0 &&
            <ListGroup.Item>
              Der heutige Speiseplan ist leer.
            </ListGroup.Item>}
          {foodError &&
            <ListGroup.Item>
              Fehler beim Abruf des Speiseplans.<br />
              Irgendetwas scheint kaputt zu sein. :(
            </ListGroup.Item>}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>

  )
}
