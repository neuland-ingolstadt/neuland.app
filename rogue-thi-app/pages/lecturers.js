import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import ReactPlaceholder from 'react-placeholder'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getPersonalLecturers, getLecturers } from '../lib/thi-backend/thi-api-client'

import styles from '../styles/Lecturers.module.css'

function normalizeLecturers (entries) {
  return entries
    .filter(x => !!x.vorname) // remove dummy entries
    .map(x => ({
      ...x,
      // try to reformat phone numbers to DIN 5008 International
      tel_dienst: x.tel_dienst
        .trim()
        .toLowerCase()
        .replace(/(?<=\d|\/|\))(\s|-|\/)+(?=\d|\/|\()/g, '')
        .replace(/^49/g, '+49')
        .replace('(', '')
        .replace(')', '')
        .replace(/^\+49841/, '+49 841 ')
        .replace(/^0841/, '+49 841 ')
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function RoomList () {
  const router = useRouter()
  const [personalLecturers, setPersonalLecturers] = useState(null)
  const [allLecturers, setAllLecturers] = useState(null)
  const [didFetch, setDidFetch] = useState(false)
  const [filteredLecturers, setFilteredLecturers] = useState(null)
  const [search, setSearch] = useState('')
  const [focusedLecturer, setFocusedLecturer] = useState(null)

  useEffect(async () => {
    try {
      const rawData = await callWithSession(getPersonalLecturers)
      const data = normalizeLecturers(rawData)
      setPersonalLecturers(data)
      setFilteredLecturers(data)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  useEffect(async () => {
    if (!search) {
      setFilteredLecturers(personalLecturers)
      return
    }

    if (!allLecturers) {
      if (didFetch) {
        return
      }

      setDidFetch(true)
      setFilteredLecturers(null)
      try {
        const rawData = await callWithSession(session => getLecturers(session, '0', 'z'))
        const data = normalizeLecturers(rawData)
        setAllLecturers(data)
        return
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login')
        } else {
          console.error(e)
          alert(e)
        }
        return
      }
    }

    const normalizedSearch = search.toLowerCase()
    const checkField = value => value && value.toString().toLowerCase().includes(normalizedSearch)
    const filtered = allLecturers
      .filter(x => checkField(x.name) ||
        checkField(x.vorname) ||
        checkField(x.email) ||
        checkField(x.tel_dienst) ||
        checkField(x.raum)
      )
      .slice(0, 20)

    setFilteredLecturers(filtered)
  }, [search, allLecturers])

  return (
    <>
      <AppNavbar title="Dozenten" />

      <AppBody>
        <Modal size="lg" show={!!focusedLecturer} onHide={() => setFocusedLecturer(null)}>
          {focusedLecturer && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>{focusedLecturer.titel} {focusedLecturer.vorname} {focusedLecturer.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <strong>Titel</strong>: {focusedLecturer.titel}<br />
                <strong>Name</strong>: {focusedLecturer.name}<br />
                <strong>Vorname</strong>: {focusedLecturer.vorname}<br />
                <strong>Organisation</strong>: {focusedLecturer.organisation || 'N/A'}<br />
                <strong>Funktion</strong>: {focusedLecturer.funktion}<br />

                <strong>Raum</strong>:{' '}
                {focusedLecturer.raum && (
                  <Link href={`/rooms?highlight=${focusedLecturer.raum}`}>
                    {focusedLecturer.raum}
                  </Link>
                )}
                {!focusedLecturer.raum && 'N/A'}
                <br />

                <strong>E-Mail</strong>:{' '}
                {focusedLecturer.email.includes('@') && (
                  <a href={`mailto:${focusedLecturer.email}`}>
                    {focusedLecturer.email}
                  </a>
                )}
                {!focusedLecturer.email.includes('@') && (
                  <>
                    {focusedLecturer.email || 'N/A'}
                  </>
                )}
                <br />

                <strong>Telefon</strong>:{' '}
                {focusedLecturer.tel_dienst && (
                  <a href={`tel:${focusedLecturer.tel_dienst.split(/\s(?!\d)/)[0]}`}>
                    {focusedLecturer.tel_dienst}
                  </a>
                )}
                {!focusedLecturer.tel_dienst && 'N/A'}
                <br />

                <strong>Sprechstunde</strong>: {focusedLecturer.sprechstunde}<br />
                <strong>Einsichtnahme</strong>: {focusedLecturer.einsichtnahme}<br />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setFocusedLecturer(null)}>
                  Schließen
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        <Form>
          <Form.Group>
            <Form.Control
              as="input"
              placeholder="Suche nach Namen, Email, Nummern, ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Form.Group>
        </Form>

        <h3>
          {search ? 'Suchergebnisse' : 'Persönliche Dozenten'}
        </h3>
        <ReactPlaceholder type="text" rows={20} ready={filteredLecturers}>
          <ListGroup>
            {filteredLecturers && filteredLecturers.map((x, i) => (
              <ListGroup.Item key={i} className={styles.item} onClick={() => setFocusedLecturer(x)} action>
                <div className={styles.left}>
                  <div className={styles.title}>
                    {x.vorname} {x.name}
                  </div>
                  <div className={styles.details}>
                    {x.funktion}
                  </div>
                </div>
                <div className={styles.right}>
                    {x.raum && (
                      <>
                        Raum:{' '}
                        <Link href={`/rooms?highlight=${x.raum}`}>
                          {x.raum}
                        </Link>
                      </>
                    )}
                    {x.raum && x.tel_dienst && (<br />)}
                    {x.tel_dienst && (
                      <a href={`tel:${x.tel_dienst.split(/\s(?!\d)/)[0]}`}>
                        {x.tel_dienst}
                      </a>
                    )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </>
  )
}
