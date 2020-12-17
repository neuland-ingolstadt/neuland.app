import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'

import { createSession } from '../lib/thi-session-handler'

import styles from '../styles/Common.module.css'

export default function Login (props) {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saveCredentials, setSaveCredentials] = useState(false)
  const [failure, setFailure] = useState(false)

  async function attemptLogin (e) {
    try {
      e.preventDefault()
      await createSession(router, username, password, saveCredentials)
    } catch (e) {
      setFailure(e.toString())
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Login</title>
      </Head>

      <Form className={styles.main} onSubmit={e => attemptLogin(e)} autoComplete={true}>
        { failure && <Alert variant="danger">{failure}</Alert>}

        <Form.Group>
          <Form.Label>THI-Benutzername</Form.Label>
          <Form.Control
            type="text"
            placeholder="abc1234"
            className="form-control"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Passwort</Form.Label>
          <Form.Control
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Form.Text className="text-muted">
            <a href="https://github.com/M4GNV5/THI-App/blob/master/data-security-de.md">Sind meine Daten sicher?</a>
          </Form.Text>
        </Form.Group>

        <Form.Group>
          <Form.Check
            type="checkbox"
            label="Eingeloggt bleiben"
            onChange={e => setSaveCredentials(e.target.checked)}
          />
        </Form.Group>

        <Button type="submit">
          Einloggen
        </Button>
      </Form>

      <div className={styles.footer}>
        <p>
          Dies ist eine inoffizielle App für Studierende der Technischen Hochschule Ingolstadt.
        </p>
        <p>
          Sie wird von Studierenden entwickelt und ist <strong>kein</strong> offizielles Angebot der THI.
        </p>
        <p>
          <a href="https://github.com/M4GNV5/THI-App" target="_blank" rel="noreferrer">Der Quellcode ist auf GitHub verfügbar.</a>
        </p>
      </div>
    </div>
  )
}
