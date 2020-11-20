import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

import styles from '../styles/Timetable.module.css'

import { obtainSession, getMensaPlan } from '../lib/thi-api-client'
import { formatFriendlyDate } from '../lib/date-utils'

import allergenMap from '../data/allergens.json'

const COLOR_WARN = '#bb0000'
const LOCALSTORAGE_SELECTED_ALLERGENS = 'selectedAllergens'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

function parseGermanDate (str) {
  const match = str.match(/^\w+ (\d{2}).(\d{2}).(\d{4})$/)
  const [, day, month, year] = match
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Timetable () {
  const router = useRouter()
  const [mensaPlan, setMensaPlan] = useState(null)
  const [showAllergenDetails, setShowAllergenDetails] = useState(false)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)

  useEffect(async () => {
    const session = await obtainSession(router)
    const data = await getMensaPlan(session)

    const days = data.map(x => ({
      date: parseGermanDate(x.tag),
      meals: Object.values(x.gerichte).map(meal => ({
        name: meal.name[1],
        prices: meal.name.slice(2, 5),
        supplements: meal.zusatz.split(',')
      }))
    }))

    setMensaPlan(days)
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

  function containsSelectedAllergen (supplements) {
    return supplements.some(x => allergenSelection[x])
  }

  return (
    <Container>
      <h1>Mensa</h1>

      <Button variant="secondary" onClick={() => setShowAllergenSelection(true)}>
        Allergene auswählen
      </Button>

      {mensaPlan && mensaPlan.map((day, idx) =>
        <ListGroup key={idx}>
          <h4 className={styles.dateBoundary}>
            {formatFriendlyDate(day.date)}
          </h4>

          {day.meals.map((meal, idx) =>
            <ListGroup.Item
              key={idx}
              className={styles.item}
              onClick={() => setShowAllergenDetails(meal.supplements)}
              action
            >
              <div className={styles.left}>
                <div className={styles.name}>
                  {meal.name}
                </div>
                <div className={styles.room}>
                  <small style={{ color: containsSelectedAllergen(meal.supplements) && COLOR_WARN }}>
                    {containsSelectedAllergen(meal.supplements) && (
                      <span>
                        <FontAwesomeIcon icon={faExclamationTriangle} color={COLOR_WARN} />
                        {' '}
                      </span>
                    )}
                    {meal.supplements.map((supplement, idx) => (
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
