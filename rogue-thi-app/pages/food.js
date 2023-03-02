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

import FilterFoodModal from '../components/modal/FilterFoodModal'
import { ShowFoodFilterModal } from './_app'
import { buildLinedWeekdaySpan } from '../lib/date-utils'
import { loadFoodEntries } from '../lib/backend-utils/food-utils'
import { useFoodFilter } from '../lib/hooks/food-filter'

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
    isStudent
  } = useFoodFilter()
  const [isGuest, setIsGuest] = useState(true)
  const [, setShowFoodFilterModal] = useContext(ShowFoodFilterModal)
  const [foodEntries, setFoodEntries] = useState(null)
  const [showMealDetails, setShowMealDetails] = useState(null)
  const slicedEntries = foodEntries && foodEntries.slice(0, 5)

  useEffect(() => {
    async function load () {
      setIsGuest(localStorage.session === 'guest')
      try {
        setFoodEntries(await loadFoodEntries(selectedRestaurants))
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
    const price = isStudent && !isGuest ? meal.prices.student : !isStudent && !isGuest ? meal.prices.employee : meal.prices.guest
    return formatPrice(price)
  }

  /**
   * Formats a float for the German locale.
   * @param {number} x
   * @returns {string}
   */
  function formatFloat (x) {
    return x?.toString().replace('.', ',')
  }

  return (
    <AppContainer>
      <AppNavbar title="Essen" showBack={'desktop-only'}>
        <AppNavbar.Button onClick={() => setShowFoodFilterModal(true)}>
          <FontAwesomeIcon title="Filter" icon={faFilter} fixedWidth/>
        </AppNavbar.Button>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={foodEntries}>
          <SwipeableTabs className={styles.tab}>
            {slicedEntries && slicedEntries.map((day, idx) =>
              <SwipeableTab title={buildLinedWeekdaySpan(day.timestamp)} key={idx}>
                <ListGroup>
                  {slicedEntries && slicedEntries[idx].meals.map((meal, idx) =>
                    <ListGroup.Item
                      key={idx}
                      className={styles.item}
                      onClick={() => setShowMealDetails(meal)}
                      action
                    >
                      <div className={styles.left}>
                        <div className={styles.name}>
                          {meal.name}
                        </div>
                        <div className={styles.room}>
                          <small style={{ color: containsSelectedAllergen(meal.allergens) && COLOR_WARN }}>
                            {!meal.allergens && 'Unbekannte Zutaten / Allergene'}
                            {containsSelectedAllergen(meal.allergens) && (
                              <span>
                                    <FontAwesomeIcon title="Allergiewarnung" icon={faExclamationTriangle}
                                                     color={COLOR_WARN}/>
                                {' '}
                                  </span>
                            )}
                            {!containsSelectedAllergen(meal.allergens) && containsSelectedPreference(meal.flags) && (
                              <span>
                                      <FontAwesomeIcon title="Bevorzugtes Essen" icon={faThumbsUp} color={COLOR_GOOD}/>
                                {' '}
                                  </span>
                            )}
                            {meal.flags && meal.flags.map((flag, idx) => (
                              <span key={idx}>
                                    {idx > 0 && ', '}
                                <span>
                                      {flagMap[flag]}
                                    </span>
                                  </span>
                            ))}
                            {meal.allergens && meal.allergens.map((supplement, idx) => (
                              <span key={idx}>
                                    {(idx > 0 || meal.flags?.length > 0) && ', '}
                                <span>
                              {supplement}
                            </span>
                          </span>
                            ))}
                          </small>
                        </div>
                      </div>
                      <div className={styles.right}>
                        {meal.restaurant}
                        <br/>
                        <br/>
                        <span className={styles.price}>{getUserSpecificPrice(meal)}</span>
                        <br/>
                        {isStudent && !isGuest && <span className={styles.indicator}>für Studierende</span>}
                        {!isStudent && !isGuest && <span className={styles.indicator}>für Mitarbeitende</span>}
                        {isGuest && <span className={styles.indicator}>für Gäste</span>}
                      </div>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </SwipeableTab>
            )}
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
