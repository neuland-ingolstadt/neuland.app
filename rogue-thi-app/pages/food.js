import React, { useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { faExclamationTriangle, faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { formatNearDate } from '../lib/date-utils'
import { loadFoodEntries } from '../lib/backend-utils/food-utils'

import styles from '../styles/Mensa.module.css'

import allergenMap from '../data/allergens.json'
import flagMap from '../data/mensa-flags.json'

const CURRENCY_LOCALE = 'de'
const COLOR_WARN = '#bb0000'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

export default function Mensa () {
  const [foodEntries, setFoodEntries] = useState(null)
  const [selectedRestaurants, setSelectedRestaurants] = useState(['mensa'])
  const [showMealDetails, setShowMealDetails] = useState(null)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showFilterSelection, setShowFilterSelection] = useState(false)
  const [isStudent, setIsStudent] = useState(true)

  useEffect(() => {
    async function load () {
      try {
        setFoodEntries(await loadFoodEntries(selectedRestaurants))
      } catch (e) {
        console.error(e)
        alert(e)
      }
    }
    load()
  }, [selectedRestaurants])

  useEffect(() => {
    if (localStorage.selectedAllergens) {
      setAllergenSelection(JSON.parse(localStorage.selectedAllergens))
    }
    if (localStorage.selectedRestaurants) {
      setSelectedRestaurants(JSON.parse(localStorage.selectedRestaurants))
    }
    if (localStorage.isStudent === 'false') {
      setIsStudent(false)
    }
  }, [])

  function toggleSelectedRestaurant (name) {
    const checked = selectedRestaurants.includes(name)
    const newSelection = selectedRestaurants.filter(x => x !== name)
    if (!checked) {
      newSelection.push(name)
    }

    setSelectedRestaurants(newSelection)
    localStorage.selectedRestaurants = JSON.stringify(newSelection)
  }

  function saveAllergenSelection () {
    localStorage.selectedAllergens = JSON.stringify(allergenSelection)
    setShowFilterSelection(false)
  }

  function containsSelectedAllergen (allergens) {
    if (!allergens) {
      return false
    }
    return allergens.some(x => allergenSelection[x])
  }

  function formatPrice (x) {
    return x?.toLocaleString(CURRENCY_LOCALE, { style: 'currency', currency: 'EUR' })
  }

  function formatGram (x) {
    return x ? `${formatFloat(x)} g` : x
  }

  function getUserSpecificPrice (meal) {
    const price = isStudent ? meal.prices.student : meal.prices.employee
    return formatPrice(price)
  }

  function formatFloat (x) {
    return x?.toString().replace('.', ',')
  }

  return (
      <AppContainer>
        <AppNavbar title="Essen" showBack={'desktop-only'}>
          <AppNavbar.Button onClick={() => setShowFilterSelection(true)}>
            <FontAwesomeIcon title="Personalisieren" icon={faFilter} fixedWidth />
          </AppNavbar.Button>
        </AppNavbar>

        <AppBody>
          <ReactPlaceholder type="text" rows={20} ready={foodEntries}>
            {foodEntries && foodEntries.map((day, idx) =>
                <ListGroup key={idx}>
                  <h4 className={styles.dateBoundary}>
                    <div className={styles.left}>
                      {formatNearDate(day.timestamp)}
                    </div>
                  </h4>

                  {day.meals.map((meal, idx) =>
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
                            <FontAwesomeIcon title="Warnung" icon={faExclamationTriangle} color={COLOR_WARN} />
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
                          {getUserSpecificPrice(meal)}
                          <br />
                          {meal.restaurant}
                        </div>
                      </ListGroup.Item>
                  )}
                </ListGroup>
            )}
            {foodEntries && foodEntries.length === 0 &&
                <ListGroup>
                  <ListGroup.Item>
                    Der Speiseplan ist leer.
                  </ListGroup.Item>
                </ListGroup>
            }
          </ReactPlaceholder>

          <br />

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
                    <li key={flag}>
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
                      <FontAwesomeIcon icon={faExclamationTriangle} color={COLOR_WARN} />
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
                      <br /><strong>davon gesättigte Fettsäuren</strong>: {formatGram(showMealDetails?.nutrition.fatSaturated)}
                    </li>
                    <li>
                      <strong>Kohlenhydrate</strong>:{' '}
                      {formatGram(showMealDetails?.nutrition.carbs)}
                      <br /><strong>davon Zucker</strong>: {formatGram(showMealDetails?.nutrition.sugar)}
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
                <br />
                Bitte prüfe die Angaben auf den Infobildschirmen, bevor du etwas konsumiert.
                Die Nährwertangaben beziehen sich auf eine durchschnittliche Portion.
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={() => setShowMealDetails(null)}>OK</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showFilterSelection} onHide={() => setShowFilterSelection(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Filter</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Modal.Header>
                Restaurant
              </Modal.Header>

              <Form>
                <Modal.Body>
                  <Form.Check
                      id={'restaurant-checkbox-mensa'}
                      label={<span><strong>Mensa</strong></span>}
                      checked={selectedRestaurants.includes('mensa')}
                      onChange={() => toggleSelectedRestaurant('mensa')}
                  />
                  <Form.Check
                      id={'restaurant-checkbox-reimanns'}
                      label={<span><strong>Reimanns</strong></span>}
                      checked={selectedRestaurants.includes('reimanns')}
                      onChange={() => toggleSelectedRestaurant('reimanns')}
                  />
                </Modal.Body>
              </Form>

              <Modal.Header>
                  Allergene
              </Modal.Header>

              <Modal.Body>
                <Form>
                  {Object.entries(allergenMap).map(([key, value]) => (
                      <Form.Check
                          key={key}
                          id={'allergen-checkbox-' + key}
                          label={<span><strong>{key}</strong>{' – '}{value}</span>}
                          checked={allergenSelection[key] || false}
                          onChange={e => setAllergenSelection({ ...allergenSelection, [key]: e.target.checked })}
                      />
                  ))}
                </Form>
              </Modal.Body>

              {/** Modal.Header: Essenspezifisch */}
              <p>
                Wähle deine Präferenzen aus. Deine Angaben werden nur lokal auf deinem Gerät gespeichert und nicht übermittelt. (Auch nicht an die THI.)
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" onClick={() => saveAllergenSelection()}>OK</Button>
            </Modal.Footer>
          </Modal>
        </AppBody>

        <AppTabbar />
      </AppContainer>
  )
}
