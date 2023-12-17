import React, { useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// somone could try bruteforcing these, but that way he wont learn how to hack ;)
const FLAG_CSV = process.env.NEXT_PUBLIC_HACKERMAN_FLAGS || ''
const FLAG_HASHES = FLAG_CSV.split(',')

/**
 * Page which allows the user to enable the Hackerman theme by entering CTF flags.
 */
export default function BecomeHackerman() {
  const router = useRouter()
  const [flags, setFlags] = useState(['', '', '', ''])
  const [flagError, setFlagError] = useState(null)

  function setFlag(i, value) {
    const dup = [...flags]
    dup[i] = value
    setFlags(dup)
  }

  async function sha256(text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const buff = await crypto.subtle.digest('SHA-256', data)
    const array = new Uint8Array(buff)
    return [...array].map((x) => x.toString(16).padStart(2, '0')).join('')
  }
  async function checkFlags() {
    let hasError = false
    const hashes = await Promise.all(flags.map(sha256))
    flags.forEach((x, i) => {
      if (hasError) {
        return
      }

      hasError = true
      if (x.trim() === '') {
        setFlagError(`Flag ${i} is empty`)
      } else if (flags.indexOf(x, i + 1) !== -1) {
        setFlagError('Cannot use the same flag more than once!')
      } else if (!FLAG_HASHES.includes(hashes[i])) {
        setFlagError(`Flag ${i} seems to be invalid`)
      } else {
        hasError = false
      }
    })

    if (!hasError) {
      const unlocked = localStorage.unlockedThemes
        ? JSON.parse(localStorage.unlockedThemes)
        : []
      unlocked.push('hacker')
      localStorage.unlockedThemes = JSON.stringify(unlocked)

      setFlagError('Success!')
      router.push('/')
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
                onChange={(e) => setFlag(0, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 1"
                value={flags[1]}
                onChange={(e) => setFlag(1, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 2"
                value={flags[2]}
                onChange={(e) => setFlag(2, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Form.Control
                as="input"
                placeholder="Flag 3"
                value={flags[3]}
                onChange={(e) => setFlag(3, e.target.value)}
              />
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                variant="primary"
                onClick={checkFlags}
              >
                Check Flags!
              </Button>{' '}
              {flagError}
            </ListGroup.Item>
          </ListGroup>
        </Form>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
})
