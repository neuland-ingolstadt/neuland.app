import React, { useEffect, useState } from 'react'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'

import {
  formatISODate,
  formatNearDate
} from '../lib/date-utils'
import NeulandAPI from '../lib/neuland-api'

import styles from '../styles/Mensa.module.css'

import allergenMap from '../data/allergens.json'

const CURRENCY_LOCALE = 'de'
const COLOR_WARN = '#bb0000'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'
const MENSA_CHECKIN_LINK = process.env.NEXT_PUBLIC_MENSA_CHECKIN_LINK

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

export async function loadFoodEntries (restaurants) {
  const entries = []
  if (restaurants.includes('mensa')) {
    const data = await NeulandAPI.getMensaPlan()
    data.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Mensa'
    }))
    entries.push(data)
  }
  if (restaurants.includes('reimanns')) {
    const data = await NeulandAPI.getReimannsPlan()

    const startOfToday = new Date(formatISODate(new Date())).getTime()
    const filteredData = data.filter(x => (new Date(x.timestamp)).getTime() >= startOfToday)

    filteredData.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Reimanns'
    }))
    entries.push(filteredData)
  }

  const days = entries.flatMap(r => r.map(x => x.timestamp))
  const uniqueDays = [...new Set(days)]

  return uniqueDays.map(day => {
    const dayEntries = entries.flatMap(r => r.find(x => x.timestamp === day)?.meals || [])
    return {
      timestamp: day,
      meals: dayEntries
    }
  })
}

export default function Mensa () {
  const [foodEntries, setFoodEntries] = useState(null)
  const [selectedRestaurants, setSelectedRestaurants] = useState(['mensa'])
  const [showAllergenDetails, setShowAllergenDetails] = useState(false)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)

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

  return (
    <AppContainer>
      <AppNavbar title="Essen" showBack={'desktop-only'}>
        <AppNavbar.Overflow>
          <Dropdown.Item variant="link" onClick={() => setShowAllergenSelection(true)}>
            Allergene auswählen
          </Dropdown.Item>
          <Dropdown.Item variant="link" onClick={() => toggleSelectedRestaurant('mensa')}>
            Mensa {selectedRestaurants.includes('mensa') ? 'ausblenden' : 'einblenden'}
          </Dropdown.Item>
          <Dropdown.Item variant="link" onClick={() => toggleSelectedRestaurant('reimanns')}>
            Reimanns {selectedRestaurants.includes('reimanns') ? 'ausblenden' : 'einblenden'}
          </Dropdown.Item>
        </AppNavbar.Overflow>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={foodEntries}>
          {foodEntries && foodEntries.map((day, idx) =>
            <ListGroup key={idx}>
              <h4 className={styles.dateBoundary}>
                {formatNearDate(day.timestamp)}
                {day.timestamp === formatISODate(new Date()) && selectedRestaurants.includes('mensa') &&
                  <Button
                    href={MENSA_CHECKIN_LINK}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline-secondary"
                    className={styles.checkin}
                  >
                    Einchecken
                  </Button>
                }
              </h4>

              {day.meals.map((meal, idx) =>
                <ListGroup.Item
                  key={idx}
                  className={styles.item}
                  onClick={() => setShowAllergenDetails(meal.allergens)}
                  action
                >
                  <div className={styles.left}>
                    <div className={styles.name}>
                      {meal.name}
                    </div>
                    <div className={styles.room}>
                      <small style={{ color: containsSelectedAllergen(meal.allergens) && COLOR_WARN }}>
                        {!meal.allergens && 'unbekannte Allergene'}
                        {containsSelectedAllergen(meal.allergens) && (
                          <span>
                            <FontAwesomeIcon title="Warnung" icon={faExclamationTriangle} color={COLOR_WARN} />
                            {' '}
                          </span>
                        )}
                        {meal.allergens && meal.allergens.map((supplement, idx) => (
                          <span key={idx}>
                            {idx !== 0 && ', '}
                            <span>
                              {supplement}
                            </span>
                          </span>
                        ))}
                      </small>
                    </div>
                  </div>
                  <div className={styles.right}>
                    {[meal.prices.student, meal.prices.employee].map(x =>
                      x?.toLocaleString(CURRENCY_LOCALE, { style: 'currency', currency: 'EUR' })
                    ).join(' / ')}
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

        <Modal show={showAllergenDetails} onHide={() => setShowAllergenDetails(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Erläuterung</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <ul>
              {showAllergenDetails && showAllergenDetails.map(key => (
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
            <p>
              <strong>Angaben ohne Gewähr. </strong>
              Bitte prüfe die Angaben auf den Infobildschirmen, bevor du etwas konsumiert.
            </p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowAllergenDetails(false)}>OK</Button>
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
