import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState } from 'react'
import { thiApiRequest } from '../lib/thi-api-request'

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [failure, setFailure] = useState(false);

export default function Login(props) {

  async function attemptLogin() {
    const response = await thiApiRequest({
      service: 'session',
      method: 'open',
      format: 'json',
      username: username,
      passwd: password,
    });

    if(typeof res.data === 'string')
      setFailure(res.data); // e.g. 'Wrong credentials'

    props.onLoginSuccess(res.data[0]);
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

        { failure ? <div class="alert alert-error" role="alert">{failure}</div> : ''}
        <input type="text" placeholder="abc1234@thi.de" class="form-control"
          value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" class="form-control"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button class="btn btn-primary" click={attemptLogin()}></button>
      </main>

      <footer className={styles.footer}>
        <strong>Inofficial!</strong> THI App.
      </footer>
    </div>
  )
}
