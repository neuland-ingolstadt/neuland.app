import React, { useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/AppBody'
import AppContainer from '../components/AppContainer'
import AppNavbar from '../components/AppNavbar'
import AppTabbar from '../components/AppTabbar'

const FLAG_CHECK_URL = process.env.NEXT_PUBLIC_FLAG_CHECK_URL

export default function BecomeHackerman () {
  const router = useRouter()
  const [flags, setFlags] = useState(['', '', '', ''])
  const [flagError, setFlagError] = useState(null)

  function setFlag (i, value) {
    const dup = [...flags]
    dup[i] = value
    setFlags(dup)
  }

  async function sha256 (text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const buff = await crypto.subtle.digest('SHA-256', data)
    const array = new Uint8Array(buff)
    return [...array].map(x => x.toString(16).padStart(2, '0')).join('')
  }
  async function checkFlag (flag) {
    const digest = await sha256(flag)
    const url = `${FLAG_CHECK_URL}${digest}`

    return await fetch(url)
      .then(r => r.status === 200)
      .catch(() => false)
  }
  async function checkFlags () {
    let hasError = false
    flags.forEach((x, i) => {
      if (!hasError && x.trim() === '') {
        setFlagError(`Flag ${i} is empty`)
        hasError = true
      }
    })
    flags.forEach((x, i) => {
      if (!hasError && flags.indexOf(x, i + 1) !== -1) {
        setFlagError('Cannot use the same flag more than once!')
        hasError = true
      }
    })

    if (hasError) {
      return
    }

    try {
      for (let i = 0; i < flags.length; i++) {
        if (!await checkFlag(flags[i])) {
          throw new Error(`Flag ${i} seems to be invalid`)
        }
      }

      const unlocked = localStorage.unlockedThemes ? JSON.parse(localStorage.unlockedThemes) : []
      unlocked.push('hacker')
      localStorage.unlockedThemes = JSON.stringify(unlocked)

      router.push('/')
    } catch (e) {
      setFlagError(e.message)
    }
  }

  return (
    <AppContainer>
      <AppNavbar title="Become Hackerman" />

      <AppBody>
        <h4>Enter 4 Flags:</h4>
        <Form>
          <ListGroup>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 0"
                value={flags[0]}
                onChange={e => setFlag(0, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 1"
                value={flags[1]}
                onChange={e => setFlag(1, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 2"
                value={flags[2]}
                onChange={e => setFlag(2, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 3"
                value={flags[3]}
                onChange={e => setFlag(3, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Button variant="primary" onClick={checkFlags}>
                Check Flags!
              </Button>
              {' '}
              {flagError}
            </ListGroup.Item>
          </ListGroup>
        </Form>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
