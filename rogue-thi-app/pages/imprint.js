import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import DOMPurify from 'dompurify'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import API from '../lib/backend/authenticated-api'

import styles from '../styles/Imprint.module.css'

export async function getStaticProps () {
  try {
    const res = await fetch('https://neuland-ingolstadt.de/impressum.htm')
    const html = await res.text()
    return {
      props: {
        neulandImprint: html
      }
    }
  } catch (e) {
    console.error(e)
    return {
      props: {
        neulandImprint: 'Laden fehlgeschlagen! <a href="https://neuland-ingolstadt.de/impressum.htm">Bitte hier klicken</a>'
      }
    }
  }
}

export default function Imprint ({ neulandImprint: unsanitizedNeulandImprint }) {
  const [neulandImprint, setNeulandImprint] = useState('Lädt...')
  const [thiImprint, setThiImprint] = useState('Lädt...')
  const [debugUnlockProgress, setDebugUnlockProgress] = useState(0)

  useEffect(() => {
    setNeulandImprint(DOMPurify.sanitize(unsanitizedNeulandImprint))
  }, [unsanitizedNeulandImprint])

  useEffect(() => {
    async function load () {
      try {
        const html = await API.getImprint()
        setThiImprint(DOMPurify.sanitize(html))
      } catch (e) {
        console.error(e)
        setThiImprint('Laden fehlgeschlagen! <a href="https://www.thi.de/sonstiges/impressum">Bitte hier klicken</a>')
      }
    }
    load()
  }, [])

  function debugUnlockClicked () {
    if (debugUnlockProgress < 4) {
      setDebugUnlockProgress(debugUnlockProgress + 1)
      return
    }

    if (localStorage.debugUnlocked) {
      localStorage.removeItem('debugUnlocked')
      alert('Debug tools are no longer available!')
    } else {
      localStorage.debugUnlocked = true
      alert('Debug tools are now available!')
    }
    setDebugUnlockProgress(0)
  }

  return (
    <AppContainer>
      <AppNavbar title="Impressum und Datenschutz" />

      <AppBody>
        <ListGroup>
          <h1 className={styles.imprintTitle}>
            Wir würden uns über euer Feedback freuen.{' '}
            <span onClick={debugUnlockClicked}>:)</span>
          </h1>
          <ListGroup.Item>
            E-Mail:{' '}
            <a href="mailto:app-feedback@informatik.sexy">
              app-feedback@informatik.sexy
            </a>
            <br />
            Webseite:{' '}
            <a href="https://neuland-ingolstadt.de" target="_blank" rel="noreferrer">
              https://neuland-ingolstadt.de
            </a>
            <br />
            Instagram:{' '}
            <a href="https://www.instagram.com/neuland_ingolstadt/" target="_blank" rel="noreferrer">
              @neuland_ingolstadt
            </a>
            <br />
            Quellcode auf GitHub:{' '}
            <a href="https://github.com/neuland-ingolstadt/THI-App" target="_blank" rel="noreferrer">
              neuland-ingolstadt/THI-App
            </a>
            <br />
            <br />
            <a href="https://join.neuland-ingolstadt.de" target="_blank" rel="noreferrer">
              Jetzt Mitglied werden und die Entwicklung unterstützen!
            </a>
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          <h1 className={styles.imprintTitle}>Rechtliche Hinweise von Neuland Ingolstadt e.V.</h1>
          <ListGroup.Item>
            <div className={styles.imprint} dangerouslySetInnerHTML={{ __html: neulandImprint }} />
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          <h1 className={styles.imprintTitle}>Rechtliche Hinweise der THI (App Backend)</h1>
          <ListGroup.Item>
            <div className={styles.imprint} dangerouslySetInnerHTML={{ __html: thiImprint }} />
          </ListGroup.Item>
        </ListGroup>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

Imprint.propTypes = {
  neulandImprint: PropTypes.string
}
