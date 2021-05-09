
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppNavbar from '../components/AppNavbar'
import AppBody from '../components/AppBody'
import AppTabbar from '../components/AppTabbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getPersonalData } from '../lib/thi-backend/thi-api-client'

import styles from '../styles/Personal.module.css'

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const router = useRouter()

  useEffect(async () => {
    try {
      const response = await callWithSession(
        getPersonalData
      )
      const data = response.persdata
      data.pcounter = response.pcounter
      setUserdata(data)
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  function renderPersonalEntry (label, name, render) {
    return (
      <ListGroup.Item>
        {label}
        <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
          <ReactPlaceholder type="text" rows={1} ready={userdata}>
            {userdata && render && render()}
            {userdata && !render && userdata[name]}
          </ReactPlaceholder>
        </span>
      </ListGroup.Item>
    )
  }

  return (
    <>
      <AppNavbar title="Konto" />

      <AppBody>
        <ListGroup>
          {renderPersonalEntry('Matrikelnummer', 'mtknr')}
          {renderPersonalEntry('Bibliotheksnummer', 'bibnr')}
          {renderPersonalEntry('Druckguthaben', 'pcounter')}
          {renderPersonalEntry('Studiengang', 'fachrich')}
          {renderPersonalEntry('Fachsemester', 'stgru')}
          {renderPersonalEntry('Prüfungsordnung', null, () => (
            <a href={userdata.po_url} target="_blank" rel="noreferrer">
              {userdata.pvers}
            </a>
          ))}
          {renderPersonalEntry('E-Mail', 'email')}
          {renderPersonalEntry('THI E-Mail', 'fhmail')}
          {renderPersonalEntry('Telefon', null, () => userdata.telefon || 'N/A')}
          {renderPersonalEntry('Vorname', 'vname')}
          {renderPersonalEntry('Nachname', 'name')}
          {renderPersonalEntry('Straße', 'str')}
          {renderPersonalEntry('Ort', null, () => `${userdata.plz} ${userdata.ort}`)}
        </ListGroup>

        <AppTabbar />
      </AppBody>
    </>
  )
}
