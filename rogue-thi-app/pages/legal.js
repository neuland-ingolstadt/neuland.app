import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import Container from 'react-bootstrap/Container'

import DOMPurify from 'dompurify'

import AppNavbar, { extractThemeFromCookie } from '../components/AppNavbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getImprint } from '../lib/thi-backend/thi-api-client'

export default function Imprint ({ theme }) {
  const router = useRouter()
  const [imprint, setImprint] = useState({ __html: '' })

  useEffect(async () => {
    try {
      const html = await callWithSession(getImprint)
      setImprint({ __html: DOMPurify.sanitize(html) })
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  return (
    <Container>

      <AppNavbar title="Rechtliche Hinweise der THI" theme={theme} />

      <div dangerouslySetInnerHTML={imprint} />

    </Container>
  )
}

Imprint.propTypes = {
  theme: PropTypes.string
}

Imprint.getInitialProps = function ({ req }) {
  return {
    theme: extractThemeFromCookie(req)
  }
}
