import React, { useContext, useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Nav from 'react-bootstrap/Nav'
import ReactPlaceholder from 'react-placeholder'

import { faChevronLeft, faChevronRight, faExclamationTriangle, faFilter, faHeartCircleCheck, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { buildLinedWeekdaySpan, getAdjustedDay, getFriendlyWeek } from '../../lib/date-utils'
import FilterFoodModal from '../../components/modal/FilterFoodModal'
import { FoodFilterContext } from '../_app'
import { loadFoodEntries } from '../../lib/backend-utils/food-utils'
import { useUserKind } from '../../lib/hooks/user-kind'

import { SwipeableTab } from '../../components/SwipeableTabs'
import allergenMap from '../../data/allergens.json'
import flagMap from '../../data/mensa-flags.json'
import styles from '../../styles/Mensa.module.css'

import SwipeableViews from 'react-swipeable-views'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { containsSelectedAllergen, containsSelectedPreference, getAdjustedFoodLocale, getMatchingAllergens, getMatchingPreferences, getUserSpecificPrice } from '../../lib/food-utils'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

/**
 * Page showing the current Mensa / Reimanns meal plan.
 */
export default function Mensa () {
  const {
    selectedRestaurants,
    selectedLanguageFood,
    preferencesSelection,
    allergenSelection,
    setShowFoodFilterModal
  } = useContext(FoodFilterContext)
  const [currentFoodDays, setCurrentFoodDays] = useState(null)
  const [futureFoodDays, setFutureFoodDays] = useState(null)
  const [currentDay, setCurrentDay] = useState(0)
  const [futureDay, setFutureDay] = useState(0)
  const [week, setWeek] = useState(0)
  const { userKind } = useUserKind()
  const router = useRouter()
  const { i18n, t } = useTranslation('food')

  const currentLocale = getAdjustedFoodLocale(selectedLanguageFood, i18n)

  useEffect(() => {
    async function load () {
      try {
        const days = await loadFoodEntries(selectedRestaurants)

        setCurrentFoodDays(days.slice(0, 5))
        setFutureFoodDays(days?.slice(5, days.length))

        setCurrentDay(getAdjustedDay(new Date()).getDay() - 1)
      } catch (e) {
        console.error(e)
        alert(e)
      }
    }

    load()
  }, [selectedRestaurants, router])

  /**
   * Renders styled ListGroup.Item
   * @param {string} title
   * @param {string} content
   * @param {string} key
   * @returns {JSX.Element}
   */
  function ListGroupItem ({ title, content, key }) {
    return (
      <ListGroup.Item key={key}>
        <div className={styles.variation}>
          <div className={styles.name}>
            {title}
          </div>

          <div className={styles.details}>
            {content}
          </div>
        </div>
      </ListGroup.Item>
    )
  }

  /**
   * Renders the variants of a meal in a list.
   * @param {object} meal
   * @returns {JSX.Element}
   **/
  function renderFoodVariants (meal) {
    return meal?.variants?.length > 0 && (
      <p>
        <ListGroup className={styles.variants}>
          {meal?.variants?.map((variant, idx) => (
            <ListGroupItem
              title={variant.name[currentLocale]}
              content={`${variant.additional ? '+ ' : ''}${getUserSpecificPrice(variant, userKind)}`}
              key={idx}
            />
          ))}
        </ListGroup>
      </p>
    )
  }

  /**
   * Renders a meal entry.
   * @param {object} meal
   * @param {any} key
   * @returns {JSX.Element}
   */
  function renderMealEntry (meal, key) {
    const userAllergens = getMatchingAllergens(meal, allergenSelection, allergenMap, currentLocale)
    const userPreferences = getMatchingPreferences(meal, preferencesSelection, flagMap, currentLocale)

    return (
      <ListGroup.Item
        key={key}
        className={styles.item}
        onClick={
          () => router.push('/food/[mealId]', `/food/${meal.id}`)
        }
        action
      >
        <div>
          <div className={styles.variation}>
            <div className={styles.name}>
              {meal.name[currentLocale]}
            </div>

            <div className={styles.details}>
              {getUserSpecificPrice(meal, userKind)}
            </div>
          </div>

          <div>
            <div className={styles.indicator}>
              {/* {!meal.allergens && t('warning.unknownIngredients.text')} */}
              {containsSelectedAllergen(meal.allergens, allergenSelection) && (
                <span className={`${styles.box} ${styles.warn}`}>
                  <FontAwesomeIcon title={t('warning.unknownIngredients.iconTitle')} icon={faExclamationTriangle} className={styles.icon}/>
                  {t('preferences.warn')}
                </span>
              )}
              {!containsSelectedAllergen(meal.allergens, allergenSelection) && containsSelectedPreference(meal.flags, preferencesSelection) && (
                <span className={`${styles.box} ${styles.match}`}>
                  <FontAwesomeIcon title={t('preferences.iconTitle')} icon={faHeartCircleCheck} className={styles.icon}/>
                  {t('preferences.match')}
                </span>
              )}
              {userPreferences?.join(', ')}
              {userPreferences?.length > 0 && userAllergens?.length > 0 && ' • '}
              {userAllergens?.join(', ')}
            </div>
          </div>
        </div>

        {/* variants of meal */}
        {renderFoodVariants(meal)}
      </ListGroup.Item>
    )
  }

  /**
   * Renders a meal entry.
   * @param {object} meal
   * @param {any} key
   * @returns {JSX.Element}
   */
  function renderMealDay (day, key) {
    const includeStaticReimanns = selectedRestaurants.includes('reimanns-static')

    const mensa = day.meals.filter(x => x.restaurant === 'mensa')
    const mensaSoups = mensa.filter(x => x.category.includes('soup'))
    const mensaFood = mensa.filter(x => !x.category.includes('soup'))

    const reimanns = day.meals.filter(x => x.restaurant === 'reimanns').filter(x => !x.static || x.static === includeStaticReimanns)
    const reimannsFood = reimanns.filter(x => !x.category.includes('salad'))
    const reimannsSalad = reimanns.filter(x => x.category.includes('salad'))

    const canisius = day.meals.filter(x => x.restaurant === 'canisius')
    const canisiusSalads = canisius.filter(x => x.category.includes('salad'))
    const canisiusFood = canisius.filter(x => !x.category.includes('salad'))

    const noData = mensa.length === 0 && reimanns.length === 0 && canisius.length === 0

    return (
      <SwipeableTab key={key} className={styles.container}>
        {mensa.length > 0 && (
          <>
            <h4 className={styles.restaurantHeader}>{t('list.titles.cafeteria')}</h4>
            {mensaFood.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.meals')}</h5>
                <ListGroup className={styles.meals}>
                  {mensaFood.map((meal, idx) => renderMealEntry(meal, `mensa-food-${idx}`))}
                </ListGroup>
              </>
            )}
            {mensaSoups.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.soups')}</h5>
                <ListGroup className={styles.meals}>
                  {mensaSoups.map((meal, idx) => renderMealEntry(meal, `mensa-soup-${idx}`))}
                </ListGroup>
              </>
            )}
          </>
        )}

        {reimanns.length > 0 && (
          <>
            <h4 className={styles.restaurantHeader}>Reimanns</h4>
            {reimannsFood.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.meals')}</h5>
                <ListGroup className={styles.meals}>
                  {reimannsFood.map((meal, idx) => renderMealEntry(meal, `reimanns-food-${idx}`))}
                </ListGroup>
              </>
            )}
            {reimannsSalad.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.salads')}</h5>
                <ListGroup className={styles.meals}>
                  {reimannsSalad.map((meal, idx) => renderMealEntry(meal, `reimanns-salad-${idx}`))}
                </ListGroup>
              </>
            )}
          </>
        )}

        {canisius.length > 0 && (
          <>
            <h4 className={styles.restaurantHeader}>Canisiuskonvikt</h4>
            {canisiusFood.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.meals')}</h5>
                <ListGroup className={styles.meals}>
                  {canisiusFood.map((meal, idx) => renderMealEntry(meal, `canisius-food-${idx}`))}
                </ListGroup>
              </>
            )}
            {canisiusSalads.length > 0 && (
              <>
                <h5 className={styles.kindHeader}>{t('list.titles.salads')}</h5>
                <ListGroup className={styles.meals}>
                  {canisiusSalads.map((meal, idx) => renderMealEntry(meal, `canisius-salad-${idx}`))}
                </ListGroup>
              </>
            )}
          </>
        )}

        {noData && (
          <div className={styles.noMealInfo}>
            <FontAwesomeIcon icon={faUtensils} size="xl" style={ { marginBottom: '15px' } }/>
            <br />
            {t('error.dataUnavailable')}
          </div>
        )}
      </SwipeableTab>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title={t('list.titles.meals')} showBack={'desktop-only'}>
        <AppNavbar.Button onClick={() => setShowFoodFilterModal(true)}>
          <FontAwesomeIcon title={t('filter')} icon={faFilter} fixedWidth/>
        </AppNavbar.Button>
      </AppNavbar>

      <AppBody>
        <div className={styles.weekSelector}>
          <Button className={styles.prevWeek} variant="link" onClick={() => setWeek(0)} disabled={week === 0}>
            <FontAwesomeIcon title={t('navigation.weeks.previous')} icon={faChevronLeft} />
          </Button>
          <div className={styles.weekText}>
            {week === 0 && getFriendlyWeek(new Date(currentFoodDays?.[0]?.timestamp))}
            {week === 1 && getFriendlyWeek(new Date(futureFoodDays?.[0]?.timestamp))}
          </div>
          <Button className={styles.nextWeek} variant="link" onClick={() => setWeek(1)} disabled={week === 1}>
            <FontAwesomeIcon title={t('navigation.weeks.next')} icon={faChevronRight} />
          </Button>
        </div>

        <ReactPlaceholder type="text" rows={20} ready={currentFoodDays && futureFoodDays}>
          <SwipeableViews index={week} onChangeIndex={idx => setWeek(idx)}>
            <WeekTab foodEntries={currentFoodDays} index={currentDay} setIndex={setCurrentDay} />
            <WeekTab foodEntries={futureFoodDays} index={futureDay} setIndex={setFutureDay} />
          </SwipeableViews>
        </ReactPlaceholder>

        <FilterFoodModal/>
      </AppBody>

      <AppTabbar/>
    </AppContainer>
  )

  /**
   * Renders the week tab.
   * @param {Array} foodEntries Array of food entries
   * @param {number} index Index of the currently selected tab
   * @param {function} setIndex Callback to set the index
   * @returns {JSX.Element}
   */
  function WeekTab ({ foodEntries, index, setIndex }) {
    return (
      <div className={styles.tab}>
        <Nav
          variant="pills"
          activeKey={index.toString()}
          onSelect={key => setIndex(parseInt(key))}
          className={styles.nav}
        >
          {foodEntries && foodEntries.map((child, idx) => <Nav.Item key={idx}>
            <Nav.Link eventKey={idx.toString()} className={`${index === idx ? styles.active : ''} ${child.meals.length === 0 ? styles.noMeals : ''}`}>
              {buildLinedWeekdaySpan(child.timestamp)}
            </Nav.Link>
          </Nav.Item>
          )}
        </Nav>
        <SwipeableViews index={index} onChangeIndex={idx => setIndex(idx)}>
          {foodEntries && foodEntries.map((day, idx) => renderMealDay(day, idx))}
        </SwipeableViews>
      </div>
    )
  }
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'food',
      'common'
    ]))
  }
})
