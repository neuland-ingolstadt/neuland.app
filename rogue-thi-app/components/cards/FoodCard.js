import React, { useContext, useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'

import { Trans, useTranslation } from 'next-i18next'
import BaseCard from './BaseCard'
import { FoodFilterContext } from '../../pages/_app'
import { formatISODate } from '../../lib/date-utils'
import { loadFoodEntries } from '../../lib/backend-utils/food-utils'

/**
 * Dashboard card for Mensa and Reimanns food plans.
 */
export default function FoodCard () {
  const [foodEntries, setFoodEntries] = useState(null)
  const [foodCardTitle, setFoodCardTitle] = useState('Essen')
  const [foodError, setFoodError] = useState(null)
  const {
    selectedRestaurants,
    preferencesSelection,
    allergenSelection
  } = useContext(FoodFilterContext)
  const { i18n, t } = useTranslation(['dashboard', 'food'])

  useEffect(() => {
    async function load () {
      const restaurants = localStorage.selectedRestaurants
        ? JSON.parse(localStorage.selectedRestaurants)
        : ['mensa']
      if (restaurants.length !== 1) {
        setFoodCardTitle('food')
      } else {
        switch (restaurants[0]) {
          case 'mensa':
            setFoodCardTitle('cafeteria')
            break
          case 'reimanns':
            setFoodCardTitle('reimanns')
            break
          case 'canisius':
            setFoodCardTitle('canisius')
            break
          default:
            setFoodCardTitle('food')
            break
        }
      }

      const today = formatISODate(new Date())
      try {
        function userMealRating (meal) {
          if (meal.allergens?.some(x => allergenSelection[x])) {
            return -1
          } else if (meal.flags?.some(x => preferencesSelection[x])) {
            return 2
          } else if (!meal.allergens && Object.keys(allergenSelection).some(x => allergenSelection[x])) {
            return 0
          } else {
            return 1
          }
        }

        const entries = await loadFoodEntries(restaurants)
        const todayEntries = entries
          .find(x => x.timestamp === today)
          ?.meals
          .filter(x => (x.category !== 'Suppe' && x.category !== 'Salat') && selectedRestaurants.includes(x.restaurant.toLowerCase()))

        todayEntries?.sort((a, b) => userMealRating(b) - userMealRating(a))

        if (!todayEntries) {
          setFoodEntries([])
        } else if (todayEntries.length > 2) {
          setFoodEntries([
            todayEntries[0].name[i18n.languages[0]],
            `${t('food.text.additional', { count: todayEntries.length - 1 })}`
          ])
        } else {
          setFoodEntries(todayEntries.map(x => x.name[i18n.languages[0]]))
        }
      } catch (e) {
        console.error(e)
        setFoodError(e)
      }
    }
    load()
  }, [selectedRestaurants, preferencesSelection, allergenSelection, t, i18n])

  return (
    <BaseCard
      icon={faUtensils}
      i18nKey={`food.location.${foodCardTitle}`}
      link="/food"
    >
      <ReactPlaceholder type="text" rows={5} ready={foodEntries || foodError}>
        <ListGroup variant="flush">
          {foodEntries && foodEntries.map((x, i) => (
            <ListGroup.Item key={i}>
              {x}
            </ListGroup.Item>
          ))}
          {foodEntries && foodEntries.length === 0 &&
            <ListGroup.Item>
              {t('food.error.empty')}
            </ListGroup.Item>}
          {foodError &&
            <ListGroup.Item>
              <Trans
                i18nKey='food.error.generic'
                ns='dashboard'
                components={{ br: <br /> }}
              />
            </ListGroup.Item>}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>

  )
}
