import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { formatFriendlyTime, formatNearDate } from '../lib/date-utils'
import API from '../lib/backend/authenticated-api'
import { NoSessionError, UnavailableSessionError } from '../lib/backend/thi-session-handler'

import styles from '../styles/Library.module.css'

export default function Library () {
  const [reservations, setReservations] = useState(null)
  const [available, setAvailable] = useState([])
  const [reservationDay, setReservationDay] = useState(false)
  const [reservationTime, setReservationTime] = useState(false)
  const [reservationRoom, setReservationRoom] = useState(1)
  const [reservationSeat, setReservationSeat] = useState(-1)
  const router = useRouter()

  async function refreshData () {
    const available = await API.getAvailableLibrarySeats()
    setAvailable(available)

    const response = await API.getLibraryReservations()
    response.forEach(x => {
      x.start = new Date(x.reservation_begin.replace(' ', 'T'))
      x.end = new Date(x.reservation_end.replace(' ', 'T'))
    })
    setReservations(response)
  }

  function hideReservationModal () {
    setReservationDay(null)
    setReservationTime(null)
  }

  async function deleteReservation (id) {
    await API.removeLibraryReservation(id)
    await refreshData()
  }

  async function addReservation () {
    await API.addLibraryReservation(
      reservationRoom,
      reservationDay.date,
      reservationTime.from,
      reservationTime.to,
      reservationSeat
    )
    await refreshData()
    hideReservationModal()
  }

  useEffect(() => {
    async function load () {
      try {
        await refreshData()
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=library')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  return (
    <AppContainer>
      <AppNavbar title="Bibliothek" />

      <AppBody>
        <Modal show={!!reservationDay && !!reservationTime} onHide={hideReservationModal}>
          <Modal.Header closeButton>
            <Modal.Title>Sitzplatz reservieren</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Tag: {reservationDay && reservationDay.date}<br />
            Start: {reservationTime && reservationTime.from}<br />
            Ende: {reservationTime && reservationTime.to}<br />
            <Form.Group>
              <Form.Label>Ort:</Form.Label>
              <Form.Control as="select" onChange={event => setReservationRoom(event.target.value)}>
              {reservationTime && Object.entries(reservationTime.resources).map(([roomId, room], idx) =>
                <option key={idx} value={roomId.toString()}>
                  {room.room_name}
                </option>
              )}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Sitz:</Form.Label>
              <Form.Control as="select" onChange={event => setReservationSeat(event.target.value)}>
                <option value={-1}>Egal</option>
              {reservationTime && reservationRoom &&
                Object.values(reservationTime.resources[reservationRoom].seats).map((x, idx) =>
                <option key={idx} value={x}>
                  {x}
                </option>
                )
              }
              </Form.Control>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={addReservation}>
              Reservieren
            </Button>
            <Button variant="secondary" onClick={hideReservationModal}>
              Abbrechen
            </Button>
          </Modal.Footer>
        </Modal>

        <h4 className={styles.heading}>
          Deine Reservierungen
        </h4>
        <ReactPlaceholder type="text" rows={3} ready={reservations}>
          <ListGroup>
            {reservations && reservations.length === 0 &&
              <ListGroup.Item>
                Du hast keine Reservierungen.
              </ListGroup.Item>
            }
            {reservations && reservations.map((x, i) =>
              <ListGroup.Item key={i}>
                <div className={styles.floatRight}>
                  <Button variant="danger" onClick={() => deleteReservation(x.reservation_id)}>
                    <FontAwesomeIcon title="Löschen" icon={faTrashAlt} />
                  </Button>
                </div>

                <strong>{x.rcategory}</strong>, Platz {x.resource}, Reservierung {x.reservation_id}<br />
                {formatNearDate(x.start)}: {formatFriendlyTime(x.start)} - {formatFriendlyTime(x.end)}
              </ListGroup.Item>
            )}
          </ListGroup>
        </ReactPlaceholder>

        <h4 className={styles.heading}>
          Verfügbare Plätze
        </h4>
        <ReactPlaceholder type="text" rows={20} ready={available && available.length > 0}>
          <ListGroup>
            {available && available.map((day, i) =>
              day.resource.map((time, j) =>

                <ListGroup.Item key={i + '-' + j}>
                  <Button variant="outline-secondary" className={styles.floatRight} onClick={() => {
                    setReservationDay(day)
                    setReservationTime(time)
                  }}>Reservieren</Button>

                  {formatNearDate(new Date(day.date + 'T' + time.from))}
                  {', '}
                  {formatFriendlyTime(new Date(day.date + 'T' + time.from))}
                  {' - '}
                  {formatFriendlyTime(new Date(day.date + 'T' + time.to))}
                  <br />
                  <div className="text-muted">
                    {Object.values(time.resources).reduce((acc, room) => acc + room.num_seats, 0)}
                    {' / '}
                    {Object.values(time.resources).reduce((acc, room) => acc + room.maxnum_seats, 0)}
                    {' verfügbar'}
                  </div>
                </ListGroup.Item>
              )
            )}
          </ListGroup>
        </ReactPlaceholder>

        <AppTabbar />
      </AppBody>
    </AppContainer>
  )
}
