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

import { NoSessionError, UnavailableSessionError } from '../lib/backend/thi-session-handler'
import { formatFriendlyTime, formatNearDate } from '../lib/date-utils'
import API from '../lib/backend/authenticated-api'

import styles from '../styles/Library.module.css'

import { Trans, useTranslation } from 'next-i18next'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

/**
 * Page for reserving library seats.
 */
export default function Library () {
  const [reservations, setReservations] = useState(null)
  const [available, setAvailable] = useState([])
  const [reservationDay, setReservationDay] = useState(false)
  const [reservationTime, setReservationTime] = useState(false)
  const [reservationRoom, setReservationRoom] = useState(1)
  const [reservationSeat, setReservationSeat] = useState(-1)
  const router = useRouter()
  const { t } = useTranslation('library')

  /**
   * Fetches and displays the reservation data.
   */
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

  /**
   * Closes the reservation popup.
   */
  function hideReservationModal () {
    setReservationDay(null)
    setReservationTime(null)
  }

  /**
   * Cancels a reservation.
   * @param {string} id Reservation ID
   */
  async function deleteReservation (id) {
    await API.removeLibraryReservation(id)
    await refreshData()
  }

  /**
   * Creates a new reservation.
   */
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
      <AppNavbar title={t('library.title')} />

      <AppBody>
        <Modal show={!!reservationDay && !!reservationTime} onHide={hideReservationModal}>
          <Modal.Header closeButton>
            <Modal.Title>{t('library.modal.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('library.modal.details.day')}: {reservationDay && reservationDay.date}<br />
            {t('library.modal.details.start')}: {reservationTime && reservationTime.from}<br />
            {t('library.modal.details.end')}: {reservationTime && reservationTime.to}<br />
            <br />
            <Form.Group>
              <Form.Label>{t('library.modal.details.location')}:</Form.Label>
              <Form.Control as="select" onChange={event => setReservationRoom(event.target.value)}>
              {reservationTime && Object.entries(reservationTime.resources).map(([roomId, room], idx) =>
                <option key={idx} value={roomId.toString()}>
                  {room.room_name}
                </option>
              )}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>{t('library.modal.details.seat')}:</Form.Label>
              <Form.Control as="select" onChange={event => setReservationSeat(event.target.value)}>
                <option value={-1}>{t('library.modal.seatSelection.any')}</option>
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
              {t('library.modal.actions.reserve')}
            </Button>
            <Button variant="secondary" onClick={hideReservationModal}>
              {t('library.modal.actions.cancel')}
            </Button>
          </Modal.Footer>
        </Modal>

        <h4 className={styles.heading}>
          {t('library.yourReservations')}
        </h4>
        <ReactPlaceholder type="text" rows={3} ready={reservations}>
          <ListGroup>
            {reservations && reservations.length === 0 &&
              <ListGroup.Item>
                {t('library.details.noReservations')}
              </ListGroup.Item>
            }
            {reservations && reservations.map((x, i) =>
              <ListGroup.Item key={i}>
                <div className={styles.floatRight}>
                  <Button variant="danger" onClick={() => deleteReservation(x.reservation_id)}>
                    <FontAwesomeIcon title={t('library.actions.delete')} icon={faTrashAlt} />
                  </Button>
                </div>

                <Trans
                  i18nKey="library.details.reservationDetails"
                  ns='library'
                  values={{
                    category: x.rcategory,
                    seat: x.resource,
                    reservation_id: x.reservation_id
                  }}
                  components={{
                    strong: <strong />
                  }}
                />
                <br />
                {formatNearDate(x.start)}: {formatFriendlyTime(x.start)} - {formatFriendlyTime(x.end)}
              </ListGroup.Item>
            )}
          </ListGroup>
        </ReactPlaceholder>

        <h4 className={styles.heading}>
          {t('library.availableSeats')}
        </h4>
        <ReactPlaceholder type="text" rows={20} ready={available && available.length > 0}>
          <ListGroup>
            {available && available.map((day, i) =>
              day.resource.map((time, j) =>

                <ListGroup.Item key={i + '-' + j}>
                  <Button variant="outline-secondary" className={styles.floatRight} onClick={() => {
                    setReservationDay(day)
                    setReservationTime(time)
                  }}>{t('library.actions.reserve')}</Button>

                  {formatNearDate(new Date(day.date + 'T' + time.from))}
                  {', '}
                  {formatFriendlyTime(new Date(day.date + 'T' + time.from))}
                  {' - '}
                  {formatFriendlyTime(new Date(day.date + 'T' + time.to))}
                  <br />
                  <div className="text-muted">
                    {t('library.details.seatsAvailable', {
                      available: Object.values(time.resources).reduce((acc, room) => acc + room.num_seats, 0),
                      total: Object.values(time.resources).reduce((acc, room) => acc + room.maxnum_seats, 0)
                    })}
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

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'library',
      'common'
    ]))
  }
})
