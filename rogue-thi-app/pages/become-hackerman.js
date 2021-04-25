import React, { useState } from 'react'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'

import AppBody from '../components/AppBody'
import AppNavbar, { ThemeContext } from '../components/AppNavbar'

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
    let hasDuplicates = false
    flags.forEach((x, i) => {
      if (flags.indexOf(x, i + 1) !== -1) {
        hasDuplicates = true
      }
    })

    if (hasDuplicates) {
      setFlagError('Cannot use the same flag more than once!')
      return
    }

    try {
      for (let i = 0; i < flags.length; i++) {
        if (!await checkFlag(flags[i])) {
          throw new Error(`flag ${i} seems to be invalid`)
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
    <>
      <ThemeContext.Provider value={'hacker'}>
        <AppNavbar title="Become Hackerman" />
      </ThemeContext.Provider>

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
    </>
  )
}
