import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

import { getOperatingSystem, OS_IOS, OS_ANDROID } from './user-agent'

import styles from '../styles/Home.module.css'

export default function InstallPrompt () {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (localStorage.closedInstallPrompt) {
      return
    }

    const os = getOperatingSystem()

    if (os === OS_IOS) {
      const isInstalled = navigator.standalone
      setShowPrompt(!isInstalled && OS_IOS)
    } else if (os === OS_ANDROID) {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      setShowPrompt(!isInstalled && OS_ANDROID)
    }
  }, [])

  function close () {
    setShowPrompt(false)
    localStorage.closedInstallPrompt = true
  }

  return showPrompt && (
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title>
            Installation
            <Button variant="link" className={styles.cardButton} onClick={() => close()}>
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          </Card.Title>
          <Card.Text>
            <p>
              Möchtest du diese App auf deinem Smartphone installieren?
            </p>
            {showPrompt === OS_IOS &&
              <p>
                Drücke in Safari auf <strong>Teilen</strong> und dann auf <strong>Zum Home-Bildschirm</strong>.
              </p>
            }
            {showPrompt === OS_ANDROID &&
              <p>
                Öffne in Chrome das <strong>Menü</strong> und drücke dann auf <strong>Zum Startbildschirm zufügen</strong>.
              </p>
            }
          </Card.Text>
        </Card.Body>
      </Card>
  )
}
