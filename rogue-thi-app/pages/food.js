import React, { useContext, useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Nav from 'react-bootstrap/Nav'
import ReactPlaceholder from 'react-placeholder'

import { faChevronLeft, faChevronRight, faExclamationTriangle, faFilter, faHeartCircleCheck, faUtensils, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT, useUserKind } from '../lib/hooks/user-kind'
import { buildLinedWeekdaySpan, getAdjustedDay, getFriendlyWeek } from '../lib/date-utils'
import FilterFoodModal from '../components/modal/FilterFoodModal'
import { FoodFilterContext } from './_app'
import { loadFoodEntries } from '../lib/backend-utils/food-utils'

import { SwipeableTab } from '../components/SwipeableTabs'
import allergenMap from '../data/allergens.json'
import flagMap from '../data/mensa-flags.json'
import styles from '../styles/Mensa.module.css'

import SwipeableViews from 'react-swipeable-views'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { getAdjustedLocale } from '../lib/locale-utils'

const COLOR_WARN = '#bb0000'
const COLOR_GOOD = '#00bb00'

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
    preferencesSelection,
    allergenSelection,
    setShowFoodFilterModal
  } = useContext(FoodFilterContext)
  const [currentFoodDays, setCurrentFoodDays] = useState(null)
  const [futureFoodDays, setFutureFoodDays] = useState(null)
  const [currentDay, setCurrentDay] = useState(0)
  const [futureDay, setFutureDay] = useState(0)
  const [showMealDetails, setShowMealDetails] = useState(null)
  const [week, setWeek] = useState(0)
  const userKind = useUserKind()
  const router = useRouter()
  const { i18n, t } = useTranslation('food')
  const currentLocale = i18n.languages[0]

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
   * Checks whether the user should be allergens.
   * @param {string[]} allergens Selected allergens
   * @returns {boolean}
   */
  function containsSelectedAllergen (allergens) {
    if (!allergens) {
      return false
    }
    return allergens.some(x => allergenSelection[x])
  }

  function containsSelectedPreference (flags) {
    if (!flags) {
      return false
    }
    return flags.some(x => preferencesSelection[x])
  }

  /**
   * Formats a price in euros.
   * @param {number} x Price
   * @returns {string}
   */
  function formatPrice (x) {
    return x?.toLocaleString(getAdjustedLocale(), { style: 'currency', currency: 'EUR' })
  }

  /**
   * Formats a weight in grams.
   * @param {number} x Weight
   * @returns {string}
   */
  function formatGram (x) {
    return x ? `${formatFloat(x)} g` : x
  }

  /**
   * Formats a price according to the users group (student, employee or guest).
   * @param {object} meal Parsed meal object
   * @returns {string}
   */
  function getUserSpecificPrice (meal) {
    const prices = {
      [USER_GUEST]: meal.prices.guest,
      [USER_EMPLOYEE]: meal.prices.employee,
      [USER_STUDENT]: meal.prices.student
    }
    return formatPrice(prices[userKind])
  }

  /**
   * Formats a float for the current locale.
   * @param {number} x
   * @returns {string}
   */
  function formatFloat (x) {
    return (new Intl.NumberFormat(getAdjustedLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })).format(x)
  }

  /**
   * Renders the variations of a meal in a list.
   * @param {object} meal
   * @returns {JSX.Element}
   **/
  function renderFoodVariations (meal) {
    return meal?.variations?.length > 0 && (<ListGroup className={styles.variations}>
      {meal?.variations?.map((variant, idx) => (
        <ListGroup.Item
          key={idx}
        >
          <div className={styles.variation}>
            <div className={styles.name}>
              {variant.name[i18n.languages[0]]}
            </div>

            <div className={styles.details}>
              {`${variant.additional ? '+ ' : ''}${getUserSpecificPrice(variant)}`}
            </div>
          </div>

        </ListGroup.Item>
      ))}
    </ListGroup>)
  }

  /**
   * Renders a meal entry.
   * @param {object} meal
   * @param {any} key
   * @returns {JSX.Element}
   */
  function renderMealEntry (meal, key) {
    const userAllergens = meal.allergens && meal.allergens.filter(x => allergenSelection[x]).map(x => allergenMap[x]?.[currentLocale])
    const userPreferences = meal.flags && meal.flags.filter(x => preferencesSelection[x] || ['veg', 'V'].includes(x))?.map(x => flagMap[x]?.[currentLocale])

    return (
      <ListGroup.Item
        key={key}
        className={styles.item}
        onClick={() => setShowMealDetails(meal)}
        action
      >
        <div>
          <div className={styles.variation}>
            <div className={styles.name}>
              {meal.name[i18n.languages[0]]}
            </div>

            <div className={styles.details}>
              {getUserSpecificPrice(meal)}
            </div>
          </div>

          <div>
            <div className={styles.indicator}>
              {/* {!meal.allergens && t('warning.unknownIngredients.text')} */}
              {containsSelectedAllergen(meal.allergens) && (
                <span className={`${styles.box} ${styles.warn}`}>
                  <FontAwesomeIcon title={t('warning.unknownIngredients.iconTitle')} icon={faExclamationTriangle} className={styles.icon}/>
                  {t('preferences.warn')}
                </span>
              )}
              {!containsSelectedAllergen(meal.allergens) && containsSelectedPreference(meal.flags) && (
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

        {/* Variations of meal */}
        {renderFoodVariations(meal)}
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
    const mensa = day.meals.filter(x => x.restaurant === 'Mensa')
    const mensaSoups = mensa.filter(x => x.category === 'Suppe')
    const mensaFood = mensa.filter(x => x.category !== 'Suppe')

    const reimanns = day.meals.filter(x => x.restaurant === 'Reimanns')
    const reimannsFood = reimanns.filter(x => x.category !== 'Salat')
    const reimannsSalad = reimanns.filter(x => x.category === 'Salat')

    const canisius = day.meals.filter(x => x.restaurant === 'Canisius')
    const canisiusSalads = canisius.filter(x => x.category === 'Salat')
    const canisiusFood = canisius.filter(x => x.category !== 'Salat')

    const noData = mensa.length === 0 && reimanns.length === 0 && canisius.length === 0

    return (
      <SwipeableTab key={key} >
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

  const isTranslated = (meal) => meal?.originalLanguage !== i18n.languages[0]

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

        <br/>

        <Modal show={showMealDetails} onHide={() => setShowMealDetails(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('foodModal.header')}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h4 className={styles.modalTitle}>{showMealDetails?.name[i18n.languages[0]]}</h4>

            <h5>{t('foodModal.flags.title')}</h5>
            {showMealDetails?.flags === null && `${t('foodModal.flags.unkown')}`}
            {showMealDetails?.flags?.length === 0 && `${t('foodModal.flags.empty')}`}
            <ul>
              {showMealDetails?.flags?.map(flag => (
                <li key={flag} style={{ color: containsSelectedPreference([flag]) && COLOR_GOOD }}>
                  {containsSelectedPreference([flag]) && (
                    <span>
                          <FontAwesomeIcon icon={faHeartCircleCheck} color={COLOR_GOOD}/>{' '}
                        </span>
                  )}
                  {' '}
                  <strong>{flag}</strong>
                  {' – '}
                  {flagMap[flag]?.[currentLocale] || `${t('foodModal.allergens.fallback')}`}
                </li>
              ))}
            </ul>

            <h5>{t('foodModal.allergens.title')}</h5>
            {showMealDetails?.allergens === null && `${t('foodModal.allergens.unkown')}`}
            {showMealDetails?.allergens?.length === 0 && `${t('foodModal.flags.empty')}`}
            <ul>
              {showMealDetails?.allergens?.map(key => (
                <li key={key} style={{ color: containsSelectedAllergen([key]) && COLOR_WARN }}>
                  {containsSelectedAllergen([key]) && (
                    <span>
                      <FontAwesomeIcon icon={faExclamationTriangle} color={COLOR_WARN}/>
                      {' '}
                    </span>
                  )}
                  {' '}
                  <strong>{key}</strong>
                  {' – '}
                  {allergenMap[key]?.[currentLocale] || `${t('foodModal.allergens.fallback')}`}
                </li>
              ))}
            </ul>

            <h5>{t('foodModal.nutrition.title')}</h5>

            {(showMealDetails?.nutrition && (

              <ul>
                <li>
                  <strong>{t('foodModal.nutrition.energy.title')}</strong>:{' '}
                  {showMealDetails?.nutrition.kj ? showMealDetails?.nutrition.kj + ' kJ' : ''} / &nbsp;
                  {showMealDetails?.nutrition.kcal ? showMealDetails?.nutrition.kcal + ' kcal' : ''}
                </li>
                <li>
                  <strong>{t('foodModal.nutrition.fat.title')}</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.fat)}
                  <br/><strong>{t('foodModal.nutrition.fat.saturated')}</strong>: {formatGram(showMealDetails?.nutrition.fatSaturated)}
                </li>
                <li>
                  <strong>{t('foodModal.nutrition.carbohydrates.title')}</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.carbs)}
                  <br/><strong>{t('foodModal.nutrition.carbohydrates.sugar')}</strong>: {formatGram(showMealDetails?.nutrition.sugar)}
                </li>
                <li>
                  <strong>{t('foodModal.nutrition.fiber.title')}</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.fiber)}
                </li>
                <li>
                  <strong>{t('foodModal.nutrition.protein.title')}</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.protein)}
                </li>
                <li>
                  <strong>{t('foodModal.nutrition.salt.title')}</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.salt)}
                </li>
              </ul>)) || (
              <p>{t('foodModal.nutrition.unkown.title')}</p>
            )}

            <h5>{t('foodModal.prices.title')}</h5>
            <ul>
              <li>
                <strong>{t('foodModal.prices.students')}</strong>:{' '}
                {formatPrice(showMealDetails?.prices.student)}
              </li>
              <li>
                <strong>{t('foodModal.prices.employees')}</strong>:{' '}
                {formatPrice(showMealDetails?.prices.employee)}
              </li>
              <li>
                <strong>{t('foodModal.prices.guests')}</strong>:{' '}
                {formatPrice(showMealDetails?.prices.guest)}
              </li>
            </ul>

            {/* Variations of meal */}
            {renderFoodVariations(showMealDetails)}
            {showMealDetails?.variations?.length > 0 && (<br />)}

            <p>
              <strong>{t('foodModal.warning.title')}</strong>
              <br/>
              {t('foodModal.warning.text')}
            </p>

            {isTranslated(showMealDetails) && (
              <p>
                <FontAwesomeIcon icon={faWandMagicSparkles} className={styles.translated} />
                <strong>{` ${t('foodModal.translation.title')}`}</strong>
                <br/>

                {` ${t('foodModal.translation.warning')}`}

                <br/>
                <ul>
                  <li>
                    <strong>{t('foodModal.translation.originalName')}</strong>:{' '}
                    {showMealDetails?.name[showMealDetails?.originalLanguage]}
                  </li>
                  <li>
                    <strong>{t('foodModal.translation.translatedName')}</strong>:{' '}
                    {showMealDetails?.name[i18n.languages[0]]}
                  </li>
                </ul>
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowMealDetails(null)}>OK</Button>
          </Modal.Footer>
        </Modal>

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
    return <div className={styles.tab}>
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
