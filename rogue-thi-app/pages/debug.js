import React, { useState } from 'react'
import styles from '../styles/Debug.module.css'
import { thiApiRequest } from '../lib/thi-api-request'

export default function Debug () {
  const [json, setJson] = useState('')
  const [result, setResult] = useState('')

  async function submit () {
    try {
      const req = JSON.parse(json)
      const resp = await thiApiRequest(req)
      setResult(JSON.stringify(resp, null, 2))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className={styles.container}>
        <textarea
          className={styles.jsonText}
          onChange={e => setJson(e.target.value)}
          value={json}
        />
        <pre>
          {result}
        </pre>
        <button onClick={submit}>Submit</button>
    </div>
  )
}
