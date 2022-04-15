import React, { useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

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
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)
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
    setShowAllergenSelection(false)
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
  function getUserSpecificPrice (meal) {
    const price = isStudent ? meal.prices.student : meal.prices.employee
    return formatPrice(price)
  }

  return (
    <AppContainer>
      <AppNavbar title="Essen" showBack={'desktop-only'}>
        <AppNavbar.Overflow>
          <AppNavbar.Overflow.Link variant="link" onClick={() => setShowAllergenSelection(true)}>
            Allergene auswählen
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => toggleSelectedRestaurant('mensa')}>
            Mensa {selectedRestaurants.includes('mensa') ? 'ausblenden' : 'einblenden'}
          </AppNavbar.Overflow.Link>
          <AppNavbar.Overflow.Link variant="link" onClick={() => toggleSelectedRestaurant('reimanns')}>
            Reimanns {selectedRestaurants.includes('reimanns') ? 'ausblenden' : 'einblenden'}
          </AppNavbar.Overflow.Link>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={foodEntries}>
          {foodEntries && foodEntries.map((day, idx) =>
            <ListGroup key={idx}>
              <h4 className={styles.dateBoundary}>
                {formatNearDate(day.timestamp)}
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
              Bitte prüfe die Angaben auf den Infobildschirmen, bevor du etwas konsumiert.
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowMealDetails(null)}>OK</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAllergenSelection} onHide={() => setShowAllergenSelection(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Allergene auswählen</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p>
              Wähle die Allergene aus, bei denen du gesondert gewarnt werden möchtest. Deine Angaben werden nur lokal auf deinem Gerät gespeichert und nicht übermittelt. (Auch nicht an die THI.)
            </p>

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

          <Modal.Footer>
            <Button variant="primary" onClick={() => saveAllergenSelection()}>OK</Button>
          </Modal.Footer>
        </Modal>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
