import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import DOMPurify from 'dompurify'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import { callWithSession } from '../lib/thi-backend/thi-session-handler'
import { getImprint } from '../lib/thi-backend/thi-api-client'

import styles from '../styles/Imprint.module.css'

export default function Imprint ({ neulandImprint: unsanitizedNeulandImprint }) {
  const [neulandImprint, setNeulandImprint] = useState('Lädt...')
  const [thiImprint, setThiImprint] = useState('Lädt...')

  useEffect(() => {
    setNeulandImprint(DOMPurify.sanitize(unsanitizedNeulandImprint))
  }, [])

  useEffect(async () => {
    try {
      const html = await callWithSession(getImprint)
      setThiImprint(DOMPurify.sanitize(html))
    } catch (e) {
      console.error(e)
      setThiImprint('Laden fehlgeschlagen! <a href="https://www.thi.de/sonstiges/impressum">Bitte hier klicken</a>')
    }
  }, [])

  return (
    <>
      <AppNavbar title="Impressum und Datenschutz" />

      <AppBody>
        <ListGroup>
          <h1 className={styles.imprintTitle}>Wir würden uns über euer Feedback freuen. :)</h1>
          <ListGroup.Item>
            E-Mail:{' '}
            <a href="mailto:app-feedback@informatik.sexy">
              app-feedback@informatik.sexy
            </a>
            <br />
            Instagram:{' '}
            <a href="https://www.instagram.com/neuland_ingolstadt/">
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
