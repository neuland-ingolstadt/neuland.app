import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import DOMPurify from 'dompurify'

import AppNavbar from '../components/AppNavbar'
import AppBody from '../components/AppBody'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getImprint } from '../lib/thi-backend/thi-api-client'

export default function Imprint () {
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
    <>
      <AppNavbar title="Rechtliche Hinweise der THI" />

      <AppBody>
        <div dangerouslySetInnerHTML={imprint} />
      </AppBody>
    </>
  )
}
