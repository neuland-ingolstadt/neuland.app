import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { Download, X } from 'lucide-react'

import { OS_ANDROID, OS_IOS, useOperatingSystem } from '../../lib/hooks/os-hook'
import { Trans, useTranslation } from 'next-i18next'

import styles from '../../styles/Home.module.css'

/**
 * Prompt that suggests the user to pin the app to his home screen.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function InstallPrompt({ onHide }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const os = useOperatingSystem()
  const { t } = useTranslation(['dashboard'])

  useEffect(() => {
    if (os === OS_IOS) {
      const isInstalled = navigator.standalone
      setShowPrompt(!isInstalled && OS_IOS)
    } else if (os === OS_ANDROID) {
      const isInstalled = window.matchMedia(
        '(display-mode: standalone)'
      ).matches
      setShowPrompt(!isInstalled && OS_ANDROID)
    }
  }, [os])

  function close() {
    setShowPrompt(false)
    onHide()
  }

  return (
    showPrompt && (
      <Card className={styles.card}>
        <Card.Body>
          <Card.Title className={styles.cardTitle}>
            <Download size={22} />
            <span className={styles.cardTitleText}>{t('install.title')}</span>
            <Button
              variant="link"
              className={styles.cardButton}
              onClick={close}
            >
              <X size={22} />
            </Button>
          </Card.Title>
          <Card.Text>
            <Trans
              i18nKey="install.text.question"
              ns="dashboard"
              components={{ strong: <strong /> }}
            />
          </Card.Text>
          {showPrompt === OS_IOS && (
            <Card.Text>
              <Trans
                i18nKey="install.text.ios"
                ns="dashboard"
                components={{ strong: <strong /> }}
              />
            </Card.Text>
          )}
          {showPrompt === OS_ANDROID && (
            <Card.Text>
              <Trans
                i18nKey="install.text.android"
                ns="dashboard"
                components={{ strong: <strong /> }}
              />
            </Card.Text>
          )}
        </Card.Body>
      </Card>
    )
  )
}
