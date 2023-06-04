import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { Capacitor } from '@capacitor/core'
import Card from 'react-bootstrap/Card'

import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { OS_ANDROID, OS_IOS, useOperatingSystem } from '../../lib/hooks/os-hook'

import styles from '../../styles/Home.module.css'
import { useTranslation } from 'next-i18next'
/**
 * Prompt that suggests the user to pin the app to his home screen.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function InstallPrompt ({ onHide }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const os = useOperatingSystem()
  const { t } = useTranslation(['dashboard'])

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
            {t('install.title')}
            <Button variant="link" className={styles.cardButton} onClick={() => close()}>
              <FontAwesomeIcon title="Schließen" icon={faTimes} />
            </Button>
          </Card.Title>
          <Card.Text>
          {t('install.text.question')}
          </Card.Text>
          {showPrompt === OS_IOS &&
            <Card.Text>
              {t('install.text.ios')}
            </Card.Text>
          }
          {showPrompt === OS_ANDROID &&
            <Card.Text>
              {t('install.text.android')}
            </Card.Text>
          }
        </Card.Body>
      </Card>
  )
}
