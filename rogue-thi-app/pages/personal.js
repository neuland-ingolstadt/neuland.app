import Head from 'next/head'
import { useRouter } from 'next/router'
import cstyles from '../styles/Common.module.css'
import styles from '../styles/Personal.module.css'
import React, { useState, useEffect } from 'react'
import { obtainSession, getPersonalData } from '../lib/thi-api-client'
import ListGroup from 'react-bootstrap/ListGroup'

export default function Personal (props) {
  const [userdata, setUserdata] = useState({});
  const router = useRouter()

  useEffect(async () => {
    const session = await obtainSession(router)
    const response = await getPersonalData(session)
    const data = response.persdata
    data.pcounter = response.pcounter
    setUserdata(data)
  }, [])

  return (
    <div className={cstyles.container}>
      <Head>
        <title>Rogue-THI</title>
      </Head>

      <div className={cstyles.main}>
        <h1 className={cstyles.title}>
          Personal Data
        </h1>

        <ListGroup className={styles.personal_data}>
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
      </div>

      <footer className={cstyles.footer}>
        <strong>unofficial thi app</strong>
      </footer>
    </div>
  )
}
