import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

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

import API from '../lib/thi-backend/authenticated-api'
import MensaAPI from '../lib/mensa-booking-api'
import NeulandAPI from '../lib/neuland-api'
import { formatNearDate } from '../lib/date-utils'

import styles from '../styles/Mensa.module.css'

import allergenMap from '../data/allergens.json'

const COLOR_WARN = '#bb0000'
const LOCALSTORAGE_SELECTED_ALLERGENS = 'selectedAllergens'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

export default function Mensa () {
  const router = useRouter()
  const { reserve } = router.query

  const [mensaPlan, setMensaPlan] = useState(null)
  const [showAllergenDetails, setShowAllergenDetails] = useState(false)
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)

  // seat reservation related states
  let initialReservationDate = null
  if (reserve === 'today') {
    initialReservationDate = new Date()
  } else if (reserve) {
    initialReservationDate = new Date(reserve)
  }
  const [reservationDate, setReservationDate] = useState(initialReservationDate)
  const [reservationTime, setReservationTime] = useState(null)
  const [reservationParams, setReservationParams] = useState({})
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(null)
  const [verificationError, setVerificationError] = useState(null)
  const [verificationCorrect, setVerificationCorrect] = useState(false)

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
    if (localStorage[LOCALSTORAGE_SELECTED_ALLERGENS]) {
      setAllergenSelection(JSON.parse(localStorage[LOCALSTORAGE_SELECTED_ALLERGENS]))
    }
  }, [])

  useEffect(() => {
    async function load () {
      try {
        const data = await API.getPersonalData()
        const {
          name: lastName,
          vname: firstName,
          plz: postcode,
          ort: city,
          str: address,
          fhmail: email
        } = data.persdata

        setVerificationEmail(email)
        setReservationParams({
          firstName,
          lastName,
          address,
          postcode,
          city,
          email
        })
      } catch (e) {
        // ignore
      }
    }

    if (reservationTime && !verificationEmail) {
      load()
    }
  }, [reservationTime, verificationEmail])

  useEffect(() => {
    async function check () {
      try {
        const success = await MensaAPI.checkVerificationCode(verificationEmail, verificationCode)
        setVerificationCorrect(success)
        setVerificationError(success ? null : 'Ungültiger Verifizierungscode')
      } catch (e) {
        setVerificationError(e.toString())
      }
    }

    if (verificationCode && verificationCode.length === 5 && verificationEmail) {
      check()
    }
  }, [verificationEmail, verificationCode])

  function saveAllergenSelection () {
    localStorage[LOCALSTORAGE_SELECTED_ALLERGENS] = JSON.stringify(allergenSelection)
    setShowAllergenSelection(false)
  }

  function containsSelectedAllergen (allergens) {
    return allergens.some(x => allergenSelection[x])
  }

  function resetReservationEntries () {
    setReservationDate(null)
    setReservationTime(null)
    setReservationParams({})
    setVerificationCorrect(false)
  }

  async function sendVerificationMail () {
    try {
      await MensaAPI.requestVerificationEmail(verificationEmail)
      setVerificationCode('')
    } catch (e) {
      setVerificationError(e.toString())
    }
  }

  async function createSeatReservation () {
    alert('not yet implemented')
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

        <Modal show={!!reservationDate} onHide={() => resetReservationEntries()}>
          <Modal.Header closeButton>
            <Modal.Title>Sitzplatz Reservieren</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form>
              {!reservationTime && (
                <>
                  <h4>Wähle eine Uhrzeit</h4>
                  {[
                    '11:00',
                    '11:10',
                    '11:20',
                    '11:30',
                    '11:40',
                    '11:50',
                    null,
                    '12:00',
                    '12:10',
                    '12:20',
                    '12:30',
                    '12:40',
                    '12:50',
                    null,
                    '13:00',
                    '13:10',
                    '13:20'
                  ].map((time, i) => time
                    ? <>
                        <Button key={i} variant="primary" onClick={() => setReservationTime(time)}>
                          {time}
                        </Button>
                        {' '}
                      </>
                    : <br />
                  )}
                </>
              )}
              {reservationTime && verificationCode === null && !verificationCorrect && (
                <>
                  <Form.Label>E-Mail:</Form.Label>
                  <Form.Control
                    as="input"
                    value={verificationEmail}
                    onChange={event => setVerificationEmail(event.target.value)}
                    />

                  <Button variant="primary" onClick={sendVerificationMail}>
                    Verifizierungs E-Mail versenden
                  </Button>

                  {verificationError && <br />}
                  {verificationError}

                  {/* TODO: display all other fields from reservationParams which will be sent to the server */}
                </>
              )}
              {reservationTime && verificationEmail && verificationCode !== null && (
                <>
                  <Form.Label>Verifizierungs Code aus der E-Mail:</Form.Label>
                  <Form.Control
                    as="input"
                    value={verificationCode}
                    onChange={event => setVerificationCode(event.target.value)}
                    />

                  {verificationError && <br />}
                  {verificationError}

                  {verificationCorrect && (
                    <Button variant="primary" onClick={createSeatReservation}>
                      Sitzplatz verbindlich reservieren
                    </Button>
                  )}
                </>
              )}
            </Form>
          </Modal.Body>
        </Modal>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
