import React from 'react'

import AppBody from '../components/AppBody'
import AppNavbar from '../components/AppNavbar'
import Link from 'next/link'
import Button from 'react-bootstrap/Button'

export default function Imprint () {
  return (
    <>
      <AppNavbar title="Impressum und Datenschutz" />

      <AppBody>
        <p>
          Wir würden uns über euer Feedback freuen. :)
        </p>

        <p>
          E-Mail: <a href="mailto:app-feedback@informatik.sexy">app-feedback@informatik.sexy</a><br />
          Instagram: <a href="https://www.instagram.com/neuland_ingolstadt/">@neuland_ingolstadt</a>
        </p>

        <p>
          <a href="https://github.com/neuland-ingolstadt/THI-App" target="_blank" rel="noreferrer">
            <Button variant="secondary">Quellcode auf GitHub</Button>
          </a>
        </p>

        <p>
          <a href="https://neuland-ingolstadt.de/impressum.htm" target="_blank" rel="noreferrer">
            <Button variant="secondary">Impressum und Datenschutz</Button>
          </a>
        </p>

        <p>
          <Link href="/legal">
            <Button variant="secondary">Rechtliche Hinweise der THI</Button>
          </Link>
        </p>
      </AppBody>
    </>
  )
}
