import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import styles from '../styles/Exams.module.css'

import AppNavbar from '../lib/AppNavbar'
import { obtainSession } from '../lib/thi-session-handler'
import { getExams, getGrades } from '../lib/thi-api-client'
import { formatFriendlyDateTime, formatFriendlyRelativeTime } from '../lib/date-utils'

export default function Exams () {
  const router = useRouter()
  const [exams, setExams] = useState(null)
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [focusedExam, setFocusedExam] = useState(null)

  useEffect(async () => {
    const session = await obtainSession(router)
    const [examList, gradeList] = await Promise.all([
      getExams(session),
      getGrades(session)
    ])

    setExams(examList
      .map(x => {
        if (x.exm_date && x.exam_time) {
          const [, day, month, year] = x.exm_date.match(/(\d{1,})\.(\d{1,})\.(\d{4})/)
          x.date = new Date(`${year}-${month}-${day}T${x.exam_time}`)
        } else {
          x.date = null
        }

        x.anmeldung = new Date(x.anm_date + 'T' + x.anm_time)
        x.allowed_helpers = JSON.parse('[' + x.hilfsmittel.slice(1, -1) + ']')
          .filter((v, i, a) => a.indexOf(v) === i)

        return x
      })
    )

    const newGrades = gradeList.filter(x => x.note && x.ects)
    setGrades(newGrades)

    setMissingGrades(gradeList
      .filter(x => !x.note)
      .filter(x => !newGrades.some(y => x.titel.trim() === y.titel.trim())))
  }, [])

  return (
    <Container>
      <AppNavbar title="Prüfungen" />

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

          <ReactPlaceholder type="text" rows={2} ready={exams}>
            {exams && exams.map((item, idx) =>
              <ListGroup.Item key={idx} className={styles.item} action onClick={() => setFocusedExam(item)}>
                <div className={styles.left}>
                  {item.titel} ({item.stg})<br />

                  <div className={styles.details}>
                    Termin: {item.date ? formatFriendlyDateTime(item.date) + ' (in ' + formatFriendlyRelativeTime(item.date) + ')' : 'TBD'}<br />
                    Raum: {item.exam_rooms || 'TBD'} {item.exam_seat || ''}<br />
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ReactPlaceholder>
      </ListGroup>

      <ListGroup>
        <h4 className={styles.heading}>
          Noten
        </h4>

        <ReactPlaceholder type="text" rows={4} ready={grades}>
          {grades && grades.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                {item.titel} ({item.stg})<br />

                <div className={styles.details}>
                  Note: {item.note.replace('*', ' (angerechnet)')}<br />
                  ECTS: {item.ects || '(keine)'}
                </div>
              </div>
            </ListGroup.Item>
          )}
        </ReactPlaceholder>
      </ListGroup>

      <ListGroup>
        <h4 className={styles.heading}>
          Ausstehende Fächer
        </h4>

        <ReactPlaceholder type="text" rows={4} ready={missingGrades}>
          {missingGrades && missingGrades.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                {item.titel} ({item.stg}) <br />

                <div className={styles.details}>
                  Frist: {item.frist || '(keine)'}<br />
                  ECTS: {item.ects || '(keine)'}
                </div>
              </div>
            </ListGroup.Item>
          )}
        </ReactPlaceholder>
      </ListGroup>
      <br />
    </Container>
  )
}
