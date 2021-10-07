import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import {
  faExclamationTriangle,
  faQrcode,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'
import QRCodeCanvas from '../components/QRCodeCanvas'

import { OS_IOS, useOperatingSystem } from '../lib/os-hook'
import {
  formatISODate,
  formatISOTime,
  formatNearDate
} from '../lib/date-utils'
import API from '../lib/thi-backend/authenticated-api'
import MensaAPI from '../lib/mensa-booking-api'
import NeulandAPI from '../lib/neuland-api'

import styles from '../styles/Mensa.module.css'

import allergenMap from '../data/allergens.json'

const CURRENCY_LOCALE = 'de'
const COLOR_WARN = '#bb0000'
const FALLBACK_ALLERGEN = 'Unbekannt (Das ist schlecht.)'

// delete comments
Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

export default function Mensa () {
  const router = useRouter()
  const { reserve } = router.query
  const os = useOperatingSystem()

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
  const [reservationResult, setReservationResult] = useState(null)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(null)
  const [verificationError, setVerificationError] = useState(null)
  const [verificationCorrect, setVerificationCorrect] = useState(false)
  const [savedVerificationEmail, setSavedVerificationEmail] = useState(null)

  useEffect(() => {
    async function load () {
      try {
        const data = await NeulandAPI.getMensaPlan()
        setMensaPlan(data)

        const { mensaReservationEmail, mensaReservationCode } = localStorage
        if (mensaReservationEmail && mensaReservationCode &&
          await MensaAPI.checkVerificationCode(mensaReservationEmail, mensaReservationCode)
        ) {
          setSavedVerificationEmail(localStorage.mensaReservationEmail)
        }
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
          city
        })
      } catch (e) {
        // ignore
      }
    }

    if (reservationDate && !reservationParams?.firstName) {
      load()
    }
  }, [reservationDate, reservationParams])

  useEffect(() => {
    async function check () {
      try {
        const success = await MensaAPI.checkVerificationCode(verificationEmail, verificationCode)
        setVerificationCorrect(success)
        setVerificationError(success ? null : 'Ungültiger Verifizierungscode')

        if (success) {
          localStorage.mensaReservationEmail = verificationEmail
          localStorage.mensaReservationCode = verificationCode
        }
      } catch (e) {
        setVerificationError(e.toString())
      }
    }

    if (verificationCode && verificationCode.length === 5 && verificationEmail) {
      check()
    }
  }, [verificationEmail, verificationCode])

  function saveAllergenSelection () {
    localStorage.selectedAllergens = JSON.stringify(allergenSelection)
    setShowAllergenSelection(false)
  }

  function containsSelectedAllergen (allergens) {
    return allergens.some(x => allergenSelection[x])
  }

  function resetReservationEntries () {
    setReservationDate(null)
    setReservationTime(null)
    setReservationParams({})
    setReservationResult(null)
    setVerificationEmail(null)
    setVerificationCode(null)
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
  function useSavedEmail () {
    setVerificationEmail(savedVerificationEmail)
    setVerificationCode(localStorage.mensaReservationCode)
    setVerificationCorrect(true)
  }

  async function createSeatReservation () {
    try {
      const dateStr = formatISODate(reservationDate)
      const timestamp = new Date(`${dateStr}T${reservationTime}`)

      const result = await MensaAPI.reserveSeat({
        ...reservationParams,
        email: verificationEmail,
        code: verificationCode,
        timestamp
      })

      setReservationResult(result)
      localStorage[`reservation-${dateStr}`] = JSON.stringify(result)
    } catch (e) {
      console.error(e)
      alert(e)
      resetReservationEntries()
    }
  }

  async function cancelReservationResult () {
    if (!reservationResult) {
      return
    }
    if (!confirm('Reservierung wirklich stonieren?')) {
      return
    }

    try {
      await MensaAPI.cancelReservation(reservationResult)

      const dateStr = formatISODate(reservationResult.start)
      localStorage.removeItem(`reservation-${dateStr}`)

      resetReservationEntries()
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }

  function showStoredReservation (date) {
    const reservation = JSON.parse(localStorage[`reservation-${date}`])
    reservation.start = new Date(reservation.start)
    reservation.end = new Date(reservation.end)
    setReservationResult(reservation)
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
                {localStorage[`reservation-${day.timestamp}`] &&
                  <Button
                    variant="outline-secondary"
                    className={styles.reserve}
                    onClick={() => showStoredReservation(day.timestamp)}
                  >
                    <FontAwesomeIcon icon={faQrcode} fixedWidth />
                  </Button>
                }
                {!localStorage[`reservation-${day.timestamp}`] &&
                  <Button
                    variant="outline-secondary"
                    className={styles.reserve}
                    onClick={() => setReservationDate(new Date(day.timestamp))}
                  >
                    Reservieren
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
                    {meal.prices.slice(0, 2).map(x => // show only student and employee pricing
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

        <Modal show={reservationDate || reservationResult} onHide={() => resetReservationEntries()}>
          <Modal.Header closeButton>
            <Modal.Title>Sitzplatz reservieren</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {!reservationTime && !reservationResult && (
              <Form className={styles.reservationForm}>
                {[
                  '11:00', '11:10', '11:20', '11:30', '11:40', '11:50',
                  '12:00', '12:10', '12:20', '12:30', '12:40', '12:50',
                  '13:00', '13:10', '13:20'
                ].map((time, idx) =>
                  <Button key={idx} variant="outline-primary" className={styles.reservationTime} onClick={() => setReservationTime(time)}>
                    {time}
                  </Button>
                )}
              </Form>
            )}
            {reservationTime && verificationCode === null && !verificationCorrect && (
              <Form>
                <Form.Group>
                  <Form.Label>E-Mail:</Form.Label>
                  <Form.Control
                    as="input"
                    value={verificationEmail}
                    onChange={event => setVerificationEmail(event.target.value)}
                    />
                  {savedVerificationEmail === verificationEmail && (
                    <Form.Text className="text-muted">
                      Die Adresse wurde bereits verifiziert
                    </Form.Text>
                  )}
                </Form.Group>

                {savedVerificationEmail === verificationEmail && (
                  <Button variant="primary" onClick={useSavedEmail}>
                    Fortfahren
                  </Button>
                )}
                {savedVerificationEmail !== verificationEmail && (
                  <Button variant="primary" onClick={sendVerificationMail}>
                    Verifizierungscode anfordern
                  </Button>
                )}

                {verificationError && <br />}
                {verificationError}
              </Form>
            )}
            {reservationTime && verificationCode !== null && !verificationCorrect && (
              <Form>
                <Form.Group>
                  <Form.Label>Verifizierungscode aus der E-Mail:</Form.Label>
                  <Form.Control
                    as="input"
                    value={verificationCode}
                    onChange={event => setVerificationCode(event.target.value)}
                    isInvalid={verificationError}
                    />
                  <Form.Text className="text-muted">
                    Sollte soeben an die angegebene E-Mail-Adresse verschickt worden sein.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {verificationError}
                  </Form.Control.Feedback>
                </Form.Group>
              </Form>
            )}
            {reservationTime && verificationCorrect && !reservationResult && (
              <Form>
                <Form.Group>
                  <Form.Label>Vorname</Form.Label>
                  <Form.Control
                    as="input"
                    value={reservationParams.firstName}
                    onChange={event => setReservationParams({ ...reservationParams, firstName: event.target.value })}
                    />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Nachname</Form.Label>
                  <Form.Control
                    as="input"
                    value={reservationParams.lastName}
                    onChange={event => setReservationParams({ ...reservationParams, lastName: event.target.value })}
                    />
                </Form.Group>
                <Form.Group>
                  <Form.Label>E-Mail</Form.Label>
                  <Form.Control
                    as="input"
                    value={verificationEmail}
                    disabled
                    />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    as="input"
                    value={reservationParams.address}
                    onChange={event => setReservationParams({ ...reservationParams, address: event.target.value })}
                    />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Postleitzahl</Form.Label>
                  <Form.Control
                    as="input"
                    value={reservationParams.postcode}
                    onChange={event => setReservationParams({ ...reservationParams, postcode: event.target.value })}
                    />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Ort</Form.Label>
                  <Form.Control
                    as="input"
                    value={reservationParams.city}
                    onChange={event => setReservationParams({ ...reservationParams, city: event.target.value })}
                    />
                </Form.Group>

                <Button variant="primary" onClick={createSeatReservation}>
                  Sitzplatz reservieren
                </Button>
              </Form>
            )}
            {reservationResult && (
              <>
                <p>
                  {reservationResult.message}
                </p>
                <p>
                  <strong>Uhrzeit:</strong> {formatISOTime(new Date(reservationResult.start))} <br />
                  <strong>Tisch:</strong> {reservationResult.table} <br />
                  <strong>Reservierungsnummer:</strong> {reservationResult.code}
                </p>
                <QRCodeCanvas className={styles.qrCode} width={1024} height={1024} value={reservationResult.code} />
              </>
            )}
          </Modal.Body>
          {reservationResult && (
            <Modal.Footer>
              {os === OS_IOS && (
                <Button
                  variant="secondary"
                  href={reservationResult.walletUrl}
                  className={styles.wallet}
                  target="_blank"
                  rel="noreferrer"
                >
                  Zu Apple Wallet hinzufügen
                </Button>
              )}
              <Button variant="secondary" onClick={cancelReservationResult}>
                Stonieren
              </Button>
            </Modal.Footer>
          )}
        </Modal>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
