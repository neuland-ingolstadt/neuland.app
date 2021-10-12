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

export default function Mensa () {
  const [mensaPlan, setMensaPlan] = useState(null)
  const [showAllergenDetails, setShowAllergenDetails] = useState(false)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)

  useEffect(() => {
    async function load () {
      try {
        const data = await NeulandAPI.getMensaPlan()
        setMensaPlan(data)
      } catch (e) {
        console.error(e)
        alert(e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (localStorage.selectedAllergens) {
      setAllergenSelection(JSON.parse(localStorage.selectedAllergens))
    }
  }, [])

  function saveAllergenSelection () {
    localStorage.selectedAllergens = JSON.stringify(allergenSelection)
    setShowAllergenSelection(false)
  }

  function containsSelectedAllergen (allergens) {
    return allergens.some(x => allergenSelection[x])
  }

  return (
    <AppContainer>
      <AppNavbar title="Mensa" showBack={'desktop-only'}>
        <Dropdown.Item variant="link" onClick={() => setShowAllergenSelection(true)}>
          Allergene auswählen
        </Dropdown.Item>
      </AppNavbar>

      <AppBody>
        <ReactPlaceholder type="text" rows={20} ready={mensaPlan}>
          {mensaPlan && mensaPlan.map((day, idx) =>
            <ListGroup key={idx}>
              <h4 className={styles.dateBoundary}>
                {formatNearDate(day.timestamp)}
                {day.timestamp === formatISODate(new Date()) &&
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
                        {containsSelectedAllergen(meal.allergens) && (
                          <span>
                            <FontAwesomeIcon icon={faExclamationTriangle} color={COLOR_WARN} />
                            {' '}
                          </span>
                        )}
                        {meal.allergens.map((supplement, idx) => (
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
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          )}
          {mensaPlan && mensaPlan.length === 0 &&
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
