import Head from 'next/head'
import { useRouter } from 'next/router'
import styles from '../styles/Common.module.css'
import React, { useState } from 'react'
import { login } from '../lib/thi-api-client'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'

export default function Login (props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [failure, setFailure] = useState(false)
  const router = useRouter()

  async function attemptLogin () {
    try {
      const { session } = await login(username, password)
      localStorage.session = session

      router.push('/')
    } catch (e) {
      setFailure(e.toString())
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Rogue-THI Login</title>
      </Head>

      <Form className={styles.main}>
        <h1 className={styles.title}>
          Rogue-THI Login
        </h1>

        { failure && <Alert variant="danger">{failure}</Alert>}

        <Form.Group>
          <Form.Label>THI Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="abc1234"
            className="form-control"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button onClick={attemptLogin}>Login</Button>
      </Form>

      <footer className={styles.footer}>
        <strong>unofficial thi app</strong>
      </footer>
    </div>
  )
}
