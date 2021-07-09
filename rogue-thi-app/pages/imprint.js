import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import DOMPurify from 'dompurify'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'

import API from '../lib/thi-backend/authenticated-api'

import styles from '../styles/Imprint.module.css'

export default function Imprint ({ neulandImprint: unsanitizedNeulandImprint }) {
  const [neulandImprint, setNeulandImprint] = useState('Lädt...')
  const [thiImprint, setThiImprint] = useState('Lädt...')
  const [debugUnlockProgress, setDebugUnlockProgress] = useState(0)

  useEffect(() => {
    setNeulandImprint(DOMPurify.sanitize(unsanitizedNeulandImprint))
  }, [])

  useEffect(async () => {
    try {
      const html = await API.getImprint()
      setThiImprint(DOMPurify.sanitize(html))
    } catch (e) {
      console.error(e)
      setThiImprint('Laden fehlgeschlagen! <a href="https://www.thi.de/sonstiges/impressum">Bitte hier klicken</a>')
    }
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
    <>
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
            Instagram:{' '}
            <a href="https://www.instagram.com/neuland_ingolstadt/" target="_blank" rel="noreferrer">
              @neuland_ingolstadt
            </a>
            <br />
            Quellcode auf GitHub:{' '}
            <a href="https://github.com/neuland-ingolstadt/THI-App" target="_blank" rel="noreferrer">
              neuland-ingolstadt/THI-App
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
    </>
  )
}

Imprint.propTypes = {
  neulandImprint: PropTypes.string
}

Imprint.getInitialProps = async () => {
  try {
    const res = await fetch('https://neuland-ingolstadt.de/impressum.htm')
    const html = await res.text()
    return {
      neulandImprint: html
    }
  } catch (e) {
    console.error(e)
    return {
      neulandImprint: 'Laden fehlgeschlagen! <a href="https://neuland-ingolstadt.de/impressum.htm">Bitte hier klicken</a>'
    }
  }
}
