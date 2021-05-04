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

export function getTimetableEntryName (item) {
  const match = item.veranstaltung.match(/^[A-Z]{2}\S*/)
  if (match) {
    const [shortName] = match
    return {
      name: item.fach,
      shortName: shortName,
      fullName: `${shortName} - ${item.fach}`
    }
  } else {
    // fallback for weird entries like
    //    "veranstaltung": "„Richtige Studienorganisation und Prüfungsplanung“_durchgeführt von CSS und SCS",
    //    "fach": "fiktiv für Raumbelegung der Verwaltung E",
    const name = `${item.veranstaltung} - ${item.fach}`
    const shortName = name.length < 10 ? name : name.substr(0, 10) + '…'
    return {
      name,
      shortName,
      fullName: name
    }
  }
}

export async function getFriendlyTimetable (detailed) {
  const [today] = new Date().toISOString().split('T')
  const { timetable } = await callWithSession(session => getTimetable(session, new Date(), detailed))

  return timetable
    .map(x => {
      // parse dates
      x.startDate = new Date(`${x.datum}T${x.von}`)
      x.endDate = new Date(`${x.datum}T${x.bis}`)

      // normalize room order
      x.raum = x.raum
        .split(',')
        .map(x => x.trim().toUpperCase())
        .sort()
        .join(', ')

      return x
    })
    .filter(x => x.datum >= today)
    .sort((a, b) => a.startDate - b.startDate)
}

function groupTimetableEntries (timetable) {
  // get all available dates and remove duplicates
  const dates = timetable
    .map(x => x.datum)
    .filter((v, i, a) => a.indexOf(v) === i)

  // get events for each date
  const groups = dates.map(date => ({
    date: date,
    items: timetable.filter(x => x.datum === date)
  }))

  return groups
}

export default function Timetable () {
  const router = useRouter()
  const [timetable, setTimetable] = useState(null)
  const [focusedEntry, setFocusedEntry] = useState(null)
  const [isDetailedData, setIsDetailedData] = useState(false)

  useEffect(async () => {
    // we need to load data only if we have not done it yet or if we have no
    // detailed data but want to display an entry in detail
    if (timetable && (!focusedEntry || isDetailedData)) {
      return
    }

    try {
      const detailed = !!focusedEntry
      const ungroupedData = await getFriendlyTimetable(detailed)
      const data = groupTimetableEntries(ungroupedData)
      setTimetable(data)
      setIsDetailedData(detailed)

      if (focusedEntry) {
        // find the focused entry in the new data
        const detailedEntry = data
          .map(group => group.items.find(x =>
            x.datum === focusedEntry.datum &&
            x.veranstaltung === focusedEntry.veranstaltung)
          )
          .find(x => x)

        if (detailedEntry) {
          setFocusedEntry(detailedEntry)
        } else {
          // just keep the old entry. The user wont see goals, content or literature
          console.error('could not find the focused timetable entry in new detailed data')
        }
      }
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [focusedEntry])

  return (
    <>
      <AppNavbar title="Stundenplan" showBack={'desktop-only'} />

      <AppBody>
        <Modal size="lg" show={!!focusedEntry} onHide={() => setFocusedEntry(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{focusedEntry && getTimetableEntryName(focusedEntry).name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Allgemein</h5>
            <p>
              <strong>Dozent</strong>: {focusedEntry && focusedEntry.dozent}<br />
              <strong>Prüfung</strong>: {focusedEntry && focusedEntry.pruefung}<br />
              <strong>Studiengang</strong>: {focusedEntry && focusedEntry.stg}<br />
              <strong>Studiengruppe</strong>: {focusedEntry && focusedEntry.stgru}<br />
              <strong>Semesterwochenstunden</strong>: {focusedEntry && focusedEntry.sws}<br />
              <strong>ECTS</strong>: {focusedEntry && focusedEntry.ectspoints}<br />
            </p>

            <h5>Ziel</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.ziel && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.ziel) }}></div>
              )}
              {focusedEntry && !focusedEntry.ziel && (
                <p>Keine Angabe</p>
              )}
            </ReactPlaceholder>

            <h5>Inhalt</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.inhalt && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.inhalt) }}></div>
              )}
              {focusedEntry && !focusedEntry.inhalt && (
                <p>Keine Angabe</p>
              )}
            </ReactPlaceholder>

            <h5>Literatur</h5>
            <ReactPlaceholder type="text" rows={5} ready={isDetailedData}>
              {focusedEntry && focusedEntry.literatur && (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(focusedEntry.literatur) }}></div>
              )}
              {focusedEntry && !focusedEntry.literatur && (
                <p>Keine Angabe</p>
              )}
            </ReactPlaceholder>
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
                <ListGroup.Item key={idx} className={styles.item} onClick={() => setFocusedEntry(item)} action>
                  <div className={styles.left}>
                    <div className={styles.name}>
                      {getTimetableEntryName(item).fullName}
                    </div>
                    <div className={styles.room}>
                      {item.raum}
                    </div>
                  </div>
                  <div className={styles.right}>
                    {formatFriendlyTime(item.startDate)} <br />
                    {formatFriendlyTime(item.endDate)}
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
