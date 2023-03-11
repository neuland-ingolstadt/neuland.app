import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

import SwipeableTabs, { SwipeableTab } from '../components/SwipeableTabs'
import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { NoSessionError } from '../lib/backend/thi-session-handler'
import { USER_GUEST, USER_STUDENT, useUserKind } from '../lib/hooks/user-kind'
import { calendar, loadExamList } from '../lib/backend-utils/calendar-utils'
import {
  formatFriendlyDateRange,
  formatFriendlyDateTime,
  formatFriendlyDateTimeRange,
  formatFriendlyRelativeTime
} from '../lib/date-utils'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Calendar.module.css'

/**
 * Page containing the semester and exam dates.
 */
export default function Calendar () {
  const router = useRouter()
  const now = useTime()
  const [exams, setExams] = useState(null)
  const [focusedExam, setFocusedExam] = useState(null)
  const userKind = useUserKind()

  useEffect(() => {
    async function load () {
      try {
        const examList = await loadExamList()
        setExams(examList)
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login?redirect=calendar')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }

    if (userKind === USER_STUDENT) {
      load()
    }
  }, [router, userKind])

  return (
    <AppContainer>
      <AppNavbar title="Termine" />

      <AppBody className={styles.container}>
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

        <SwipeableTabs>
          <SwipeableTab className={styles.tab} title="Semester">
            <ListGroup variant="flush">
              {calendar.map((item, idx) =>
                <ListGroup.Item key={idx} className={styles.item}>
                  <div className={styles.left}>
                    {!item.url && item.name}
                    {item.url && (
                      <a href={item.url} className={styles.eventUrl} target="_blank" rel="noreferrer">
                        {item.name}
                        {' '}
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </a>
                    )}
                    <br />
                    <div className={styles.details}>
                      {item.hasHours
                        ? formatFriendlyDateTimeRange(item.begin, item.end)
                        : formatFriendlyDateRange(item.begin, item.end)}
                    </div>
                  </div>
                  <div className={styles.details}>
                    {(item.end && item.begin < now)
                      ? 'bis ' + formatFriendlyRelativeTime(item.end)
                      : formatFriendlyRelativeTime(item.begin)}
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
            <div className="text-muted">
              <small>
                Alle Angaben ohne Gewähr.
                Verbindliche Informationen gibt es nur direkt auf der <a href="https://www.thi.de/studium/pruefung/semestertermine/" target="_blank" rel="noreferrer">Webseite der Hochschule</a>.
              </small>
            </div>
          </SwipeableTab>

          <SwipeableTab className={styles.tab} title="Prüfungen">
            <ListGroup variant="flush">
              <ReactPlaceholder type="text" rows={4} ready={exams || userKind === USER_GUEST}>
                {exams && exams.length === 0 && (
                  <ListGroup.Item>
                    Es sind derzeit keine Prüfungstermine verfügbar.
                  </ListGroup.Item>
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
                {userKind === USER_GUEST && (
                  <ListGroup.Item>
                    Prüfungstermine sind als Gast nicht verfügbar.
                  </ListGroup.Item>
                )}
              </ReactPlaceholder>
            </ListGroup>
            <div className="text-muted">
              <small>
                Alle Angaben ohne Gewähr.
                Verbindliche Informationen gibt es nur direkt auf der <a href="https://www3.primuss.de/cgi-bin/login/index.pl?FH=fhin" target="_blank" rel="noreferrer">Webseite der Hochschule</a>.
              </small>
            </div>
          </SwipeableTab>
        </SwipeableTabs>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
