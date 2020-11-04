import Head from 'next/head'
import { useRouter } from 'next/router'
import styles from '../styles/Common.module.css'
import React, { useState, useEffect } from 'react'
import {
  getLibraryReservations,
  getAvailableLibrarySeats,
  addLibraryReservation,
  removeLibraryReservation
} from '../lib/thi-api-client'

import ReactPlaceholder from 'react-placeholder'
import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'

export default function Library (props) {
  const [reservations, setReservations] = useState(null);
  const [available, setAvailable] = useState([]);
  const [reservationDay, setReservationDay] = useState(false);
  const [reservationTime, setReservationTime] = useState(false);
  const [reservationRoom, setReservationRoom] = useState(1);
  const [reservationSeat, setReservationSeat] = useState(-1);
  const router = useRouter()

  const shortNames = {
    "Lesesaal Nord (alte Bibliothek)": "Nord",
    "Lesesaal Süd (neue Bibliothek)": "Süd",
    "Lesesaal Galerie": "Galerie",
  }

  function getSession () {
    const session = localStorage.session
    if(!session) {
      router.push('/login')
      throw new Error('No session available')
    }

    return session
  }

  async function refreshData () {

    const response = await getLibraryReservations(getSession())
    response.forEach(x => {
      x.start = new Date(x.reservation_begin)
      x.end = new Date(x.reservation_end)
    })
    setReservations(response)

    const available = await getAvailableLibrarySeats(getSession())
    setAvailable(available)
  }

  function hideReservationModal () {
    setReservationDay(null)
    setReservationTime(null)
  }
  async function deleteReservation (id) {
    await removeLibraryReservation(getSession(), id)
    await refreshData()
  }
  async function addReservation () {
    await addLibraryReservation(
      getSession(),
      reservationRoom,
      reservationDay.date,
      reservationTime.from,
      reservationTime.to,
      reservationSeat
    )
    await refreshData()
    hideReservationModal()
  }

  useEffect(async () => {

    await refreshData()
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Rogue-THI</title>
      </Head>

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
            {reservationTime && Object.entries(reservationTime.resources).map(([roomId, room]) =>
              <option value={roomId.toString()}>{room.room_name}</option>
            )}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Sitz:</Form.Label>
            <Form.Control as="select" onChange={event => setReservationSeat(event.target.value)}>
              <option value={-1}>Egal</option>
            {reservationTime && reservationRoom && reservationTime.resources[reservationRoom].seats.map(x =>
              <option value={x}>{x}</option>
            )}
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

      <div className={styles.main}>
        <h1 className={styles.title}>
          Bibliothek
        </h1>

        <h3>
          Deine Reservierungen
        </h3>
        <ReactPlaceholder type="text" rows={2} ready={reservations}>
          <ListGroup className={styles.wideList}>
          {reservations && reservations.map((x, i) =>
            <ListGroup.Item key={i}>
              <div className={styles.floatRight}>
                <Button variant="danger" onClick={() => deleteReservation(x.reservation_id)}>
                  <FontAwesomeIcon icon={faTrashAlt} />
                </Button>
              </div>

              <strong>{x.rcategory}</strong>, Platz {x.resource}, Reservierung {x.reservation_id}<br />
              {x.start.toLocaleDateString()}: {x.start.toLocaleTimeString()} - {x.end.toLocaleTimeString()}
            </ListGroup.Item>
          )}
          </ListGroup>
        </ReactPlaceholder>

        <h3>
          Verfügbare Plätze
        </h3>
        <ListGroup className={styles.wideList}>
          {available && available.map((day, i) =>
            day.resource.map((time, j) =>
              
              <ListGroup.Item key={i + "-" + j}>
                <div className={styles.floatRight}>
                  {Object.entries(time.resources).map(([roomId, room]) =>
                    <span>{room.num_seats}/{room.maxnum_seats} {shortNames[room.room_name]}<br /></span>
                  )}
                </div>

                {(new Date(day.date + ' ' + time.from)).toLocaleString()}
                {' '}- {(new Date(day.date + ' ' + time.to)).toLocaleTimeString()}
                <br />
                <Button variant="primary" onClick={() => {
                  setReservationDay(day)
                  setReservationTime(time)
                }}>Reservieren</Button>
              </ListGroup.Item>
            )
          )}
        </ListGroup>
      </div>

      <footer className={styles.footer}>
        <strong>unofficial thi app</strong>
      </footer>
    </div>
  )
}
