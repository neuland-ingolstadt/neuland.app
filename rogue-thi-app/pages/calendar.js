import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import ReactPlaceholder from 'react-placeholder'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getExams } from '../lib/thi-backend/thi-api-client'
import { formatFriendlyDate, formatFriendlyDateTime, formatFriendlyRelativeTime } from '../lib/date-utils'
import { parse as parsePostgresArray } from 'postgres-array'

import rawCalendar from '../data/calendar.json'

import styles from '../styles/Calendar.module.css'

const now = new Date()
const calendar = rawCalendar.map(x => ({
  ...x,
  begin: new Date(x.begin),
  end: x.end && new Date(x.end)
}))
  .filter(x => (x.end && x.end > now) || x.begin > now)
  .sort((a, b) => a.end - b.end)
  .sort((a, b) => a.begin - b.begin)

export default function Calendar () {
  const router = useRouter()
  const [exams, setExams] = useState(null)
  const [focusedExam, setFocusedExam] = useState(null)

  useEffect(async () => {
    try {
      const examList = await callWithSession(getExams)

      setExams(examList
        .map(x => {
          if (x.exm_date && x.exam_time) {
            const [, day, month, year] = x.exm_date.match(/(\d{1,})\.(\d{1,})\.(\d{4})/)
            x.date = new Date(`${year}-${month}-${day}T${x.exam_time}`)
          } else {
            x.date = null
          }

          x.anmeldung = new Date(x.anm_date + 'T' + x.anm_time)
          x.allowed_helpers = parsePostgresArray(x.hilfsmittel)
            .filter((v, i, a) => a.indexOf(v) === i)

          return x
        })
      )
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else if (e.message === 'Query not possible') {
        setExams([])
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  return (
    <>
      <AppNavbar title="Termine" />

      <AppBody>
        <Modal show={!!focusedExam} onHide={() => setFocusedExam(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedExam && focusedExam.titel}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <strong>Art</strong>: {focusedExam && focusedExam.pruefungs_art}<br />
            <strong>Raum</strong>: {focusedExam && (focusedExam.exam_rooms || 'TBD')}<br />
            <strong>Sitzplatz</strong>: {focusedExam && (focusedExam.exam_seat || 'TBD')}<br />
            <strong>Termin</strong>: {focusedExam && (focusedExam.date ? formatFriendlyDateTime(focusedExam.date) : 'TBD')}<br />
            <strong>Anmerkung</strong>: {focusedExam && focusedExam.anmerkung}<br />
            <strong>Prüfer</strong>: {focusedExam && focusedExam.pruefer_namen}<br />
            <strong>Studiengang</strong>: {focusedExam && focusedExam.stg}<br />
            <strong>Angemeldet</strong>: {focusedExam && formatFriendlyDateTime(focusedExam.anmeldung)}<br />
            <strong>Hilfsmittel</strong>: {focusedExam && focusedExam.allowed_helpers.map((helper, i) =>
              <div key={i}>{helper}</div>)}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setFocusedExam(null)}>
              Schließen
            </Button>
          </Modal.Footer>
        </Modal>

        <ListGroup>
          <h4 className={styles.heading}>
            Prüfungen
          </h4>

          <ReactPlaceholder type="text" rows={10} ready={exams}>
            {exams && exams.length === 0 && (
              <ListGroup>
                <ListGroup.Item>
                  Es sind derzeit keine Prüfungstermine verfügbar.
                </ListGroup.Item>
              </ListGroup>
            )}
            {exams && exams.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item} action onClick={() => setFocusedExam(item)}>
                <div className={styles.left}>
                  {item.titel} ({item.stg})<br />

                  <div className={styles.details}>
                    {item.date && <>
                      {formatFriendlyDateTime(item.date)}
                      {' '}({formatFriendlyRelativeTime(item.date)})
                      <br />
                    </>}
                    Raum: {item.exam_rooms || 'TBD'}<br />
                    {item.exam_seat && `Sitzplatz: ${item.exam_seat}`}
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ReactPlaceholder>
        </ListGroup>

        <ListGroup>
          <h4 className={styles.heading}>
            Termine
          </h4>

          {calendar.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                {item.name}<br />
                <div className={styles.details}>
                  {item.hasHours
                    ? formatFriendlyDateTime(item.begin)
                    : formatFriendlyDate(item.begin)}
                  {item.end && <>
                    {' '}&ndash;{' '}
                    {item.hasHours
                      ? formatFriendlyDateTime(item.end)
                      : formatFriendlyDate(item.end)}
                  </>}
                </div>

              </div>
              <div className={styles.details}>
                {(item.end && item.begin < now)
                  ? 'Bis ' + formatFriendlyRelativeTime(item.end)
                  : formatFriendlyRelativeTime(item.begin)}
              </div>
            </ListGroup.Item>
          )}
        </ListGroup>
        <br />
      </AppBody>
    </>
  )
}
