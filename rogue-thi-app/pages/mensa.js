import React, { useEffect, useState } from 'react'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Dropdown from 'react-bootstrap/Dropdown'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

import styles from '../styles/Timetable.module.css'

import AppNavbar from '../components/AppNavbar'
import { getMensaPlan } from '../lib/reimplemented-api-client'
import { formatNearDate } from '../lib/date-utils'

import allergenMap from '../data/allergens.json'

const COLOR_WARN = '#bb0000'
const LOCALSTORAGE_SELECTED_ALLERGENS = 'selectedAllergens'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

export default function Timetable () {
  const [mensaPlan, setMensaPlan] = useState(null)
  const [showAllergenDetails, setShowAllergenDetails] = useState(false)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)

  useEffect(async () => {
    try {
      const data = await getMensaPlan()
      setMensaPlan(data)
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }, [])

  useEffect(() => {
    if (localStorage[LOCALSTORAGE_SELECTED_ALLERGENS]) {
      setAllergenSelection(JSON.parse(localStorage[LOCALSTORAGE_SELECTED_ALLERGENS]))
    }
  }, [])

  function saveAllergenSelection () {
    localStorage[LOCALSTORAGE_SELECTED_ALLERGENS] = JSON.stringify(allergenSelection)
    setShowAllergenSelection(false)
  }

  function containsSelectedAllergen (allergens) {
    return allergens.some(x => allergenSelection[x])
  }

  return (
    <Container>
      <AppNavbar title="Mensa">
        <Dropdown.Item variant="link" onClick={() => setShowAllergenSelection(true)}>
          Allergene auswählen
        </Dropdown.Item>
      </AppNavbar>

      <ReactPlaceholder type="text" rows={20} color="#eeeeee" ready={mensaPlan}>
        {mensaPlan && mensaPlan.map((day, idx) =>
          <ListGroup key={idx}>
            <h4 className={styles.dateBoundary}>
              {formatNearDate(day.timestamp)}
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
                  {meal.prices.join(' / ')}
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        )}
        {mensaPlan && mensaPlan.length === 0 &&
          <ListGroup variant="flush">
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

    </Container>
  )
}
