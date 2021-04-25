import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DOMPurify from 'dompurify'

import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getTimetable } from '../lib/thi-backend/thi-api-client'
import { formatNearDate, formatFriendlyTime } from '../lib/date-utils'

import styles from '../styles/Timetable.module.css'

async function getFriendlyTimetable () {
  const [today] = new Date().toISOString().split('T')

  const { timetable } = await callWithSession(session => getTimetable(session, new Date(), true))

  // get all available dates
  const dates = timetable
    .map(x => x.datum)
    .filter(x => x >= today)
    .filter((v, i, a) => a.indexOf(v) === i)

  // get events for each date
  const groups = dates.map(date => ({
    date: date,
    items: timetable
      .filter(x => x.datum === date)
      .map(x => {
        // parse dates
        x.start_date = new Date(`${x.datum}T${x.von}`)
        x.end_date = new Date(`${x.datum}T${x.bis}`)
        return x
      })
  }))

  return groups
}

export default function Timetable () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [focusedEntry, setFocusedEntry] = useState(null)

  useEffect(async () => {
    try {
      setTimetable(await getFriendlyTimetable(router))
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  function getEntryName (item) {
    if (/[A-Z -]+/.test(item.veranstaltung.replace(item.fach, ''))) {
      return item.fach
    } else if (item.veranstaltung.indexOf(item.fach) !== -1) {
      return item.veranstaltung
    } else {
      return `${item.veranstaltung} - ${item.fach}`
    }
  }

  return (
    <>
      <AppNavbar title="Stundenplan" showBack={'desktop-only'} />

      <AppBody>
        <Modal dialogClassName={styles.wideModal} show={!!focusedEntry} onHide={() => setFocusedEntry(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedEntry && getEntryName(focusedEntry)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h3>Allgemein</h3>
            <p>
              <strong>Dozent</strong>: {focusedEntry && focusedEntry.dozent}<br />
              <strong>Prüfung</strong>: {focusedEntry && focusedEntry.pruefung}<br />
              <strong>Studiengang</strong>: {focusedEntry && focusedEntry.stg}<br />
              <strong>Studiengruppe</strong>: {focusedEntry && focusedEntry.stgru}<br />
              <strong>Semesterwochenstunden</strong>: {focusedEntry && focusedEntry.sws}<br />
              <strong>ECTS</strong>: {focusedEntry && focusedEntry.ectspoints}<br />
            </p>

            <h3>Ziel</h3>
            {focusedEntry && focusedEntry.ziel && (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.ziel) }}></div>
            )}
            {focusedEntry && !focusedEntry.ziel && (
              <p>Keine Angabe</p>
            )}

            <h3>Inhalt</h3>
            {focusedEntry && focusedEntry.inhalt && (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.inhalt) }}></div>
            )}
            {focusedEntry && !focusedEntry.inhalt && (
              <p>Keine Angabe</p>
            )}

            <h3>Literatur</h3>
            {focusedEntry && focusedEntry.literatur && (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.literatur) }}></div>
            )}
            {focusedEntry && !focusedEntry.literatur && (
              <p>Keine Angabe</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setFocusedEntry(null)}>
              Schließen
            </Button>
          </Modal.Footer>
        </Modal>

        <ReactPlaceholder type="text" rows={20} ready={timetable}>
          {timetable && timetable.map((group, idx) =>
            <ListGroup key={idx}>
              <h4 className={styles.dateBoundary}>
                {formatNearDate(group.date)}
              </h4>

              {group.items.map((item, idx) =>
                <ListGroup.Item key={idx} className={styles.item} onClick={() => setFocusedEntry(item)}>
                  <div className={styles.left}>
                    <div className={styles.name}>
                      {getEntryName(item)}
                    </div>
                    <div className={styles.room}>
                      {item.raum}
                    </div>
                  </div>
                  <div className={styles.right}>
                    {formatFriendlyTime(item.start_date)} <br />
                    {formatFriendlyTime(item.end_date)}
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          )}
          {timetable && timetable.length === 0 &&
            <ListGroup>
              <ListGroup.Item>
                Dein persönlicher Stundenplan ist aktuell leer.<br />
                Du kannst deinen persönlichen Stundenplan im{' '}
                <a href="https://www3.primuss.de/stpl/login.php?FH=fhin&Lang=de">
                Stundenplantool der THI zusammenstellen</a>, dann erscheinen hier
                deine gewählten Fächer.
              </ListGroup.Item>
            </ListGroup>
          }
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </>
  )
}
