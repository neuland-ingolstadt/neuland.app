import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState } from 'react'
import { thiApiRequest } from '../lib/thi-api-request'

export default function Login (props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [failure, setFailure] = useState(false)

  async function attemptLogin () {
    const res = await thiApiRequest({
      service: 'session',
      method: 'open',
      format: 'json',
      username: username,
      passwd: password
    })

    if (typeof res.data === 'string') { setFailure(res.data) } // e.g. 'Wrong credentials'

    console.log(res.data[0])
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Rogue-THI Login</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Rogue-THI Login
        </h1>

        { failure ? <div className="alert alert-error" role="alert">{failure}</div> : ''}
        <input type="text" placeholder="abc1234@thi.de" className="form-control"
          value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" className="form-control"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className="btn btn-primary" onClick={attemptLogin}>Login</button>
      </main>

      <footer className={styles.footer}>
        <strong>unofficial thi app</strong>
      </footer>
    </div>
  )
}
