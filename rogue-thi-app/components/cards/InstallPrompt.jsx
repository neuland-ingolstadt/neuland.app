import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { Download, X } from 'lucide-react'

import {
  OS_ANDROID,
  OS_IOS,
  OS_MACOS,
  OS_OTHER,
  useOperatingSystem,
} from '../../lib/hooks/os-hook'
import { Trans, useTranslation } from 'next-i18next'

import styles from '../../styles/Home.module.css'

/**
 * Prompt that suggests the user to pin the app to his home screen.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function InstallPrompt({ onHide }) {
  const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL
  const [showPrompt, setShowPrompt] = useState(false)
  const os = useOperatingSystem()
  const { t } = useTranslation(['dashboard'])

  useEffect(() => {
    if (os !== OS_OTHER) {
      setShowPrompt(true)
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
              i18nKey="install.text1"
              ns="dashboard"
            />
          </Card.Text>

          <Card.Text>
            <Trans
              i18nKey="install.text2"
              ns="dashboard"
              components={{ strong: <strong /> }}
            />
          </Card.Text>
          <Button
            variant="primary"
            href={
              {
                [OS_IOS]: iosUrl,
                [OS_MACOS]: iosUrl,
                [OS_ANDROID]: androidUrl,
              }[os]
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {
              {
                [OS_IOS]: t('install.button.ios'),
                [OS_MACOS]: t('install.button.ios'),
                [OS_ANDROID]: t('install.button.android'),
              }[os]
            }
          </Button>
        </Card.Body>
      </Card>
    )
  )
}
