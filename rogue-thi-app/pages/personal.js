
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import API from '../lib/backend/authenticated-api'
import { NoSessionError } from '../lib/backend/thi-session-handler'

import styles from '../styles/Personal.module.css'

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function load () {
      try {
        const response = await API.getPersonalData()
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
    }
    load()
  }, [router])

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
    <AppContainer>
      <AppNavbar title="Konto" />

      <AppBody>
        <ListGroup>
          {renderPersonalEntry('Matrikelnummer', 'mtknr')}
          {renderPersonalEntry('Bibliotheksnummer', 'bibnr')}
          {renderPersonalEntry('Druckguthaben', 'pcounter')}
          {renderPersonalEntry('Studiengang', 'fachrich')}
          {renderPersonalEntry('Fachsemester', 'stgru')}
          {renderPersonalEntry('Prüfungsordnung', null, () => (
            <a
              /* see: https://github.com/neuland-ingolstadt/THI-App/issues/90#issuecomment-924768749 */
              href={userdata?.po_url && userdata.po_url.replace('verwaltung-und-stabsstellen', 'hochschulorganisation')}
              target="_blank"
              rel="noreferrer">
              {userdata.pvers}
            </a>
          ))}
          {renderPersonalEntry('E-Mail', 'email')}
          {renderPersonalEntry('THI E-Mail', 'fhmail')}
          {renderPersonalEntry('Telefon', null, () => userdata.telefon || 'N/A')}
          {renderPersonalEntry('Vorname', 'vname')}
          {renderPersonalEntry('Nachname', 'name')}
          {renderPersonalEntry('Straße', 'str')}
          {renderPersonalEntry('Ort', null, () => userdata.plz && userdata.ort && `${userdata.plz} ${userdata.ort}`)}
        </ListGroup>

        <AppTabbar />
      </AppBody>
    </AppContainer>
  )
}
