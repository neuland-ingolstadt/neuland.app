import React, { useState } from 'react'
import { useRouter } from 'next/router'

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'

import { createSession, createGuestSession } from '../lib/backend/thi-session-handler'

import styles from '../styles/Login.module.css'

const ORIGINAL_ERROR_WRONG_CREDENTIALS = 'Wrong credentials'
const FRIENDLY_ERROR_WRONG_CREDENTIALS = 'Deine Zugangsdaten sind falsch.'

const IMPRINT_URL = process.env.NEXT_PUBLIC_IMPRINT_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const GUEST_ONLY = !!process.env.NEXT_PUBLIC_GUEST_ONLY

export default function Login () {
  const router = useRouter()
  const { redirect } = router.query

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saveCredentials, setSaveCredentials] = useState(false)
  const [failure, setFailure] = useState(false)

  async function login (e) {
    try {
      e.preventDefault()
      await createSession(username, password, saveCredentials)
      router.replace('/' + (redirect || ''))
    } catch (e) {
      if (e.message.includes(ORIGINAL_ERROR_WRONG_CREDENTIALS)) {
        setFailure(FRIENDLY_ERROR_WRONG_CREDENTIALS)
      } else {
        setFailure('Bei der Verbindung zum Server ist ein Fehler aufgetreten.')
      }
    }
  }

  async function guestLogin (e) {
    e.preventDefault()
    createGuestSession()
    router.replace('/')
  }

  return (
    <AppContainer>
      <AppNavbar title="neuland.app" showBack={false} />

      <AppBody>
        <div className={styles.container}>
          <Form className={styles.main} onSubmit={login} autoComplete="on">
            {failure &&
              <Alert variant="danger">
                {failure}
              </Alert>
            }

            {!failure && redirect &&
              <Alert variant="warning">
                Für diese Funktion musst du eingeloggt sein.
              </Alert>
            }

            {GUEST_ONLY &&
              <p>
                Die App kann derzeit nur als Gast verwendet werden. Weitere Informationen findet ihr unten.
              </p>
            }
            {!GUEST_ONLY &&
              <>
                <Form.Group>
                  <Form.Label>THI-Benutzername</Form.Label>
                  <Form.Control
                    type="text"
                    autoComplete="username"
                    placeholder="abc1234"
                    className="form-control"
                    value={username}
                    isInvalid={!!failure}
                    onChange={e => setUsername(e.target.value)}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Passwort</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="current-password"
                    className="form-control"
                    value={password}
                    isInvalid={!!failure}
                    onChange={e => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="stay-logged-in"
                    label="Eingeloggt bleiben"
                    onChange={e => setSaveCredentials(e.target.checked)}
                  />
                </Form.Group>

                <Form.Group>
                  <Button type="submit" variant="primary" className={styles.loginButton}>
                    Einloggen
                  </Button>
                </Form.Group>
              </>
            }

            <Form.Group>
              <Button type="submit" variant="secondary" className={styles.loginButton} onClick={guestLogin}>
                Als Gast einloggen
              </Button>
            </Form.Group>
          </Form>

          <div className={styles.disclaimer}>
            {GUEST_ONLY &&
              <>
                <h6>Warum kann ich mich nicht einloggen?</h6>
                <p>
                  Die Hochschule hat uns dazu angewiesen, die Login-Funktion zu deaktivieren.
                  Wir arbeiten an einer Lösung, allerdings ist nicht abzusehen, wann es so weit sein wird.
                  Vor einer Nutzung der offiziellen THI-App raten wir aus Sicherheitsgründen ab.
                </p>
                <p>
                  Der Speiseplan, die Semester- und Veranstaltungstermine, die Raumkarte, die Bus- und Zugabfahrtszeiten sowie die Parkplatzinformationen können weiterhin über den Gastmodus genutzt werden.
                </p>
              </>
            }
            <h6>Was ist das?</h6>
            <p>
              Das ist eine inoffizielle Alternative zur THI-App, welche eine verbesserte Benutzererfahrung bieten soll.
              Sie wird bei von Studierenden bei <a href="https://neuland-ingolstadt.de" target="_blank" rel="noreferrer">Neuland Ingolstadt e.V.</a> für Studierende entwickelt und ist kein Angebot der Technischen Hochschule Ingolstadt.
            </p>
            <h6>Sind meine Daten sicher?</h6>
            <p>
              <strong>Ja. </strong>
              Deine Daten werden direkt auf deinem Gerät verschlüsselt, in verschlüsselter Form über unseren Proxy an die THI übermittelt
              und erst dort wieder entschlüsselt.
              Nur du und die THI haben Zugriff auf deine Zugangsdaten und deine persönlichen Daten.
            </p>
            <p>
              <a href={`${GIT_URL}/blob/master/docs/data-security-de.md`}>Hier findest du weitere Informationen zur Sicherheit.</a>
            </p>
            <p>
              <a href={GIT_URL} target="_blank" rel="noreferrer">Quellcode auf GitHub</a>
              <> &ndash; </>
              <a href={IMPRINT_URL} target="_blank" rel="noreferrer">Impressum und Datenschutz</a>
            </p>
          </div>
        </div>
      </AppBody>
    </AppContainer>
  )
}
