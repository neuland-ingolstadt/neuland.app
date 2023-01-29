import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { Capacitor } from '@capacitor/core'
import Card from 'react-bootstrap/Card'

import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { OS_ANDROID, OS_IOS, useOperatingSystem } from '../../lib/hooks/os-hook'

import styles from '../../styles/Home.module.css'

/**
 * Prompt that suggests the user to pin the app to his home screen.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function InstallPrompt ({ onHide }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const os = useOperatingSystem()

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return
    }

    if (os === OS_IOS) {
      const isInstalled = navigator.standalone
      setShowPrompt(!isInstalled && OS_IOS)
    } else if (os === OS_ANDROID) {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      setShowPrompt(!isInstalled && OS_ANDROID)
    }
  }, [os])

  function close () {
    setShowPrompt(false)
    onHide()
  }

  return showPrompt && (
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title>
            <FontAwesomeIcon icon={faDownload} fixedWidth />
            {' '}
            Installation
            <Button variant="link" className={styles.cardButton} onClick={() => close()}>
              <FontAwesomeIcon title="Schließen" icon={faTimes} />
            </Button>
          </Card.Title>
          <Card.Text>
            Möchtest du diese App auf deinem Smartphone installieren?
          </Card.Text>
          {showPrompt === OS_IOS &&
            <Card.Text>
              Drücke in Safari auf <strong>Teilen</strong> und dann auf <strong>Zum Home-Bildschirm</strong>.
            </Card.Text>
          }
          {showPrompt === OS_ANDROID &&
            <Card.Text>
              Öffne in Chrome das <strong>Menü</strong> und drücke dann auf <strong>Zum Startbildschirm zufügen</strong>.
            </Card.Text>
          }
        </Card.Body>
      </Card>
  )
}
