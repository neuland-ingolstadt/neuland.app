import React, { useContext, useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { faExclamationTriangle, faFilter, faThumbsUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT, useUserKind } from '../lib/hooks/user-kind'
import FilterFoodModal from '../components/modal/FilterFoodModal'
import { FoodFilterContext } from './_app'
import { buildLinedWeekdaySpan } from '../lib/date-utils'
import { loadFoodEntries } from '../lib/backend-utils/food-utils'

import SwipeableTabs, { SwipeableTab } from '../components/SwipeableTabs'
import allergenMap from '../data/allergens.json'
import flagMap from '../data/mensa-flags.json'
import styles from '../styles/Mensa.module.css'

const CURRENCY_LOCALE = 'de'
const COLOR_WARN = '#bb0000'
const COLOR_GOOD = '#00bb00'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

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
  const [foodDays, setFoodDays] = useState(null)
  const [showMealDetails, setShowMealDetails] = useState(null)
  const userKind = useUserKind()

  useEffect(() => {
    async function load () {
      try {
        const days = await loadFoodEntries(selectedRestaurants)
        setFoodDays(days.slice(0, 5))
      } catch (e) {
        console.error(e)
        alert(e)
      }
    }

    load()
  }, [selectedRestaurants])

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
    return x?.toLocaleString(CURRENCY_LOCALE, { style: 'currency', currency: 'EUR' })
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
   * Formats a float for the German locale.
   * @param {number} x
   * @returns {string}
   */
  function formatFloat (x) {
    return x?.toString().replace('.', ',')
  }

  /**
   * Renders a meal entry.
   * @param {object} meal
   * @param {any} key
   * @returns {JSX.Element}
   */
  function renderMealEntry (meal, key) {
    return (
      <ListGroup.Item
        key={key}
        className={styles.item}
        onClick={() => setShowMealDetails(meal)}
        action
      >
        <div>
          <div className={styles.name}>
            {meal.name}
          </div>
          <div className={styles.room}>
            <span className={styles.indicator} style={{ color: containsSelectedAllergen(meal.allergens) && COLOR_WARN }}>
              {!meal.allergens && 'Unbekannte Zutaten / Allergene'}
              {containsSelectedAllergen(meal.allergens) && (
                <span>
                  <FontAwesomeIcon title="Allergiewarnung" icon={faExclamationTriangle} color={COLOR_WARN} />
                  {' '}
                </span>
              )}
              {!containsSelectedAllergen(meal.allergens) && containsSelectedPreference(meal.flags) && (
                <span>
                  <FontAwesomeIcon title="Bevorzugtes Essen" icon={faThumbsUp} color={COLOR_GOOD} />
                  {' '}
                </span>
              )}
              {meal.flags && meal.flags.map(flag => flagMap[flag]).join(', ')}
              {meal.flags?.length > 0 && meal.allergens?.length > 0 && '; '}
              {meal.allergens && meal.allergens.join(', ')}
            </span>
          </div>
        </div>
        <div className={styles.details}>
          {getUserSpecificPrice(meal)}
        </div>
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
    const soups = day.meals.filter(x => x.category === 'Suppe')
    const food = day.meals.filter(x => x.restaurant === 'Mensa' && x.category !== 'Suppe')
    const reimanns = day.meals.filter(x => x.restaurant === 'Reimanns')

    return (
      <SwipeableTab title={buildLinedWeekdaySpan(day.timestamp)} key={key}>
        {mensa.length > 0 && (
          <>
            <h4 className={styles.kindHeader}>Mensa</h4>
            {food.length > 0 && (
              <>
                {soups.length > 0 && (
                  <h5 className={styles.kindHeader}>Gerichte</h5>
                )}
                <ListGroup>
                  {food.map((meal, idx) => renderMealEntry(meal, `food-${idx}`))}
                </ListGroup>
              </>
            )}
            {soups.length > 0 && (
              <>
                {food.length > 0 && (
                  <h5 className={styles.kindHeader}>Suppen</h5>
                )}
                <ListGroup>
                  {soups.map((meal, idx) => renderMealEntry(meal, `soup-${idx}`))}
                </ListGroup>
              </>
            )}
          </>
        )}

        {reimanns.length > 0 && (
          <>
            <h4 className={styles.kindHeader}>Reimanns</h4>
            <ListGroup>
              {reimanns.map((meal, idx) => renderMealEntry(meal, `reimanns-${idx}`))}
            </ListGroup>
          </>
        )}
      </SwipeableTab>
    )
  }

  return (
    <AppContainer>
      <AppNavbar title="Essen" showBack={'desktop-only'}>
        <AppNavbar.Button onClick={() => setShowFoodFilterModal(true)}>
          <FontAwesomeIcon title="Filter" icon={faFilter} fixedWidth/>
        </AppNavbar.Button>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={foodDays}>
          <SwipeableTabs className={styles.tab}>
            {foodDays && foodDays.map((day, idx) => renderMealDay(day, idx))}
          </SwipeableTabs>
        </ReactPlaceholder>

        <br/>

        <Modal show={showMealDetails} onHide={() => setShowMealDetails(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Erläuterung</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h5>Anmerkungen</h5>
            {showMealDetails?.flags === null && 'Unbekannt.'}
            {showMealDetails?.flags?.length === 0 && 'Keine.'}
            <ul>
              {showMealDetails?.flags?.map(flag => (
                <li key={flag} style={{ color: containsSelectedPreference([flag]) && COLOR_GOOD }}>
                  {containsSelectedPreference([flag]) && (
                    <span>
                          <FontAwesomeIcon icon={faThumbsUp} color={COLOR_GOOD}/>{' '}
                        </span>
                  )}
                  {' '}
                  <strong>{flag}</strong>
                  {' – '}
                  {flagMap[flag] || FALLBACK_ALLERGEN}
                </li>
              ))}
            </ul>

            <h5>Allergene</h5>
            {showMealDetails?.allergens === null && 'Unbekannt.'}
            {showMealDetails?.allergens?.length === 0 && 'Keine.'}
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
                  {allergenMap[key] || FALLBACK_ALLERGEN}
                </li>
              ))}
            </ul>

            <h5>Nährwerte</h5>

            {(showMealDetails?.nutrition && (

              <ul>
                <li>
                  <strong>Energie</strong>:{' '}
                  {showMealDetails?.nutrition.kj ? showMealDetails?.nutrition.kj + ' kJ' : ''} / &nbsp;
                  {showMealDetails?.nutrition.kcal ? showMealDetails?.nutrition.kcal + ' kcal' : ''}
                </li>
                <li>
                  <strong>Fett</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.fat)}
                  <br/><strong>davon gesättigte
                  Fettsäuren</strong>: {formatGram(showMealDetails?.nutrition.fatSaturated)}
                </li>
                <li>
                  <strong>Kohlenhydrate</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.carbs)}
                  <br/><strong>davon Zucker</strong>: {formatGram(showMealDetails?.nutrition.sugar)}
                </li>
                <li>
                  <strong>Ballaststoffe</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.fiber)}
                </li>
                <li>
                  <strong>Eiweiß</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.protein)}
                </li>
                <li>
                  <strong>Salz</strong>:{' '}
                  {formatGram(showMealDetails?.nutrition.salt)}
                </li>
              </ul>)) || (
              <p>Unbekannt.</p>
            )}

            <h5>Preise</h5>
            <ul>
              <li>
                <strong>Studierende</strong>:{' '}
                {formatPrice(showMealDetails?.prices.student)}
              </li>
              <li>
                <strong>Mitarbeitende</strong>:{' '}
                {formatPrice(showMealDetails?.prices.employee)}
              </li>
              <li>
                <strong>Gäste</strong>:{' '}
                {formatPrice(showMealDetails?.prices.guest)}
              </li>
            </ul>

            <p>
              <strong>Angaben ohne Gewähr. </strong>
              <br/>
              Bitte prüfe die Angaben auf den Infobildschirmen, bevor du etwas konsumiert.
              Die Nährwertangaben beziehen sich auf eine durchschnittliche Portion.
            </p>
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
}
