import React, { useEffect, useState } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'
import { Utensils } from 'lucide-react'

import { Trans, useTranslation } from 'next-i18next'
import BaseCard from './BaseCard'
import { TextBlock } from 'react-placeholder/lib/placeholders'
import { formatISODate } from '../../lib/date-utils'
import { loadFoodEntries } from '../../lib/backend-utils/food-utils'

import styles from '../../styles/Home.module.css'
import { useFoodFilter } from '../../lib/providers/FoodFilterProvider'

/**
 * Dashboard card for Mensa and Reimanns food plans.
 */
export default function FoodCard() {
  const [foodEntries, setFoodEntries] = useState(null)
  const [foodCardTitle, setFoodCardTitle] = useState('Essen')
  const [foodError, setFoodError] = useState(null)
  const {
    selectedRestaurants,
    selectedLanguageFood,
    preferencesSelection,
    allergenSelection,
  } = useFoodFilter()
  const { i18n, t } = useTranslation(['dashboard', 'food'])

  const languageFood =
    selectedLanguageFood && selectedLanguageFood !== 'default'
      ? selectedLanguageFood
      : i18n.languages[0]

  useEffect(() => {
    async function load() {
      const restaurants = localStorage.selectedRestaurantList
        ? JSON.parse(localStorage.selectedRestaurantList)
        : ['IngolstadtMensa']
      if (restaurants.length !== 1) {
        setFoodCardTitle('food')
      } else {
        switch (restaurants[0]) {
          case 'IngolstadtMensa':
            setFoodCardTitle('mensaIngolstadt')
            break
          case 'NeuburgMensa':
            setFoodCardTitle('mensaNeuburg')
            break
          case 'Reimanns':
            setFoodCardTitle('reimanns')
            break
          case 'Canisius':
            setFoodCardTitle('canisius')
            break
          default:
            setFoodCardTitle('food')
            break
        }
      }

      const today = formatISODate(new Date())
      try {
        const userMealRating = (meal) => {
          if (meal.allergens?.some((x) => allergenSelection[x])) {
            return -1
          } else if (meal.flags?.some((x) => preferencesSelection[x])) {
            return 2
          } else if (
            !meal.allergens &&
            Object.keys(allergenSelection).some((x) => allergenSelection[x])
          ) {
            return 0
          } else {
            return 1
          }
        }

        const entries = await loadFoodEntries(restaurants, false)
        const todayEntries = entries
          .find((x) => x.timestamp === today)
          ?.meals.filter(
            (x) =>
              x.category !== 'soup' &&
              x.category !== 'salad' &&
              selectedRestaurants.includes(x.restaurant)
          )

        todayEntries?.sort((a, b) => userMealRating(b) - userMealRating(a))

        if (!todayEntries) {
          setFoodEntries([])
        } else if (todayEntries.length > 2) {
          setFoodEntries([
            todayEntries[0].name[languageFood],
            `${t('food.text.additional', { count: todayEntries.length - 1 })}`,
          ])
        } else {
          setFoodEntries(todayEntries.map((x) => x.name[languageFood]))
        }
      } catch (e) {
        console.error(e)
        setFoodError(e)
      }
    }
    load()
  }, [
    selectedRestaurants,
    preferencesSelection,
    allergenSelection,
    t,
    i18n,
    languageFood,
  ])

  const placeholder = (
    <ListGroup variant="flush">
      <ListGroup.Item>
        <TextBlock
          rows={2}
          className={styles.placeholder_3_0}
        />
      </ListGroup.Item>
      <ListGroup.Item>
        <TextBlock
          rows={1}
          className={styles.placeholder_3_0}
        />
      </ListGroup.Item>
    </ListGroup>
  )

  return (
    <BaseCard
      icon={Utensils}
      i18nKey={`food.location.${foodCardTitle}`}
      link="/food"
    >
      <ReactPlaceholder
        ready={foodEntries || foodError}
        customPlaceholder={placeholder}
      >
        <ListGroup variant="flush">
          {foodEntries &&
            foodEntries.map((x, i) => (
              <ListGroup.Item key={i}>{x}</ListGroup.Item>
            ))}
          {foodEntries && foodEntries.length === 0 && (
            <ListGroup.Item>{t('food.error.empty')}</ListGroup.Item>
          )}
          {foodError && (
            <ListGroup.Item>
              <Trans
                i18nKey="food.error.generic"
                ns="dashboard"
                components={{ br: <br /> }}
              />
            </ListGroup.Item>
          )}
        </ListGroup>
      </ReactPlaceholder>
    </BaseCard>
  )
}
