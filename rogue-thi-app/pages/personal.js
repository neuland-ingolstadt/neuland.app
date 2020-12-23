
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import styles from '../styles/Personal.module.css'

import AppNavbar from '../lib/AppNavbar'
import { obtainSession } from '../lib/thi-session-handler'
import { getPersonalData } from '../lib/thi-api-client'

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const router = useRouter()

  useEffect(async () => {
    try {
      const session = await obtainSession(router)
      const response = await getPersonalData(session)
      const data = response.persdata
      data.pcounter = response.pcounter
      setUserdata(data)
    } catch (e) {
      console.error(e)
      alert(e)
    }
  }, [])

  return (
    <Container>
      <AppNavbar title="Konto" />

      <ReactPlaceholder type="text" rows={12} color="#eeeeee" ready={userdata}>
        {userdata &&
          <ListGroup>
            <ListGroup.Item>Matrikelnummer <span className={styles.personal_value}>{userdata.mtknr}</span></ListGroup.Item>
            <ListGroup.Item>Bibliotheksnummer <span className={styles.personal_value}>{userdata.bibnr}</span></ListGroup.Item>
            <ListGroup.Item>Druckguthaben <span className={styles.personal_value}>{userdata.pcounter}</span></ListGroup.Item>
            <ListGroup.Item>Studiengang <span className={styles.personal_value}>{userdata.fachrich}</span></ListGroup.Item>
            <ListGroup.Item>Fachsemester <span className={styles.personal_value}>{userdata.stgru}</span></ListGroup.Item>
            <ListGroup.Item>
              Prüfungsordnung
              <span className={styles.personal_value}>
                <a href={userdata.po_url}>{userdata.pvers}</a>
                </span>
            </ListGroup.Item>
            {/* TODO Schwerpunkt "swpkt": "{NULL,NULL,NULL}", */}
            <ListGroup.Item>E-Mail <span className={styles.personal_value}>{userdata.email}</span></ListGroup.Item>
            <ListGroup.Item>THI E-Mail <span className={styles.personal_value}>{userdata.fhmail}</span></ListGroup.Item>
            {userdata.telefon ? <ListGroup.Item>Phone <span className={styles.personal_value}>{userdata.telefon}</span></ListGroup.Item> : ''}
            <ListGroup.Item>Vorname <span className={styles.personal_value}>{userdata.vname}</span></ListGroup.Item>
            <ListGroup.Item>Nachname <span className={styles.personal_value}>{userdata.name}</span></ListGroup.Item>
            <ListGroup.Item>Straße <span className={styles.personal_value}>{userdata.str}</span></ListGroup.Item>
            <ListGroup.Item>Ort <span className={styles.personal_value}>{userdata.plz} {userdata.ort}</span></ListGroup.Item>
          </ListGroup>
        }
      </ReactPlaceholder>
    </Container>
  )
}
