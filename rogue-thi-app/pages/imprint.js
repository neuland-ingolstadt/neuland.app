import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import DOMPurify from 'dompurify'
import ListGroup from 'react-bootstrap/ListGroup'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import styles from '../styles/Imprint.module.css'
import { useTranslation } from 'next-i18next'

const IMPRINT_URL = process.env.NEXT_PUBLIC_IMPRINT_URL

export async function getStaticProps ({ locale }) {
  const locales = await serverSideTranslations(locale ?? 'en', [
    'imprint',
    'common'
  ])

  try {
    const res = await fetch(IMPRINT_URL)
    const html = await res.text()
    return {
      props: {
        neulandImprint: html,
        ...locales
      }
    }
  } catch (e) {
    console.error(e)
    return {
      props: {
        neulandImprint: `Laden fehlgeschlagen! <a href="${IMPRINT_URL}">Bitte hier klicken</a>`,
        ...locales
      }
    }
  }
}

/**
 * Page showing the Neuland and THI imprints.
 */
export default function Imprint ({ neulandImprint: unsanitizedNeulandImprint }) {
  const [neulandImprint, setNeulandImprint] = useState('Lädt...')
  const [debugUnlockProgress, setDebugUnlockProgress] = useState(0)

  const { t } = useTranslation('imprint')

  useEffect(() => {
    setNeulandImprint(DOMPurify.sanitize(unsanitizedNeulandImprint))
  }, [unsanitizedNeulandImprint])

  function debugUnlockClicked () {
    if (debugUnlockProgress < 4) {
      setDebugUnlockProgress(debugUnlockProgress + 1)
      return
    }

    if (localStorage.debugUnlocked) {
      localStorage.removeItem('debugUnlocked')
      alert('Debug tools are no longer available!')
    } else {
      localStorage.debugUnlocked = true
      alert('Debug tools are now available!')
    }
    setDebugUnlockProgress(0)
  }

  return (
    <AppContainer>
      <AppNavbar title={t('imprint.appbar.title')} />

      <AppBody>
        <ListGroup>
          <h1 className={styles.imprintTitle}>
            {`${t('imprint.feedback.title')} `}
            <span onClick={debugUnlockClicked}>:)</span>
          </h1>
          <ListGroup.Item>
            E-Mail:{' '}
            <a href="mailto:app-feedback@informatik.sexy">
              app-feedback@informatik.sexy
            </a>
            <br />
            {`${t('imprint.feedback.email')}: `}
            <a href="https://neuland-ingolstadt.de" target="_blank" rel="noreferrer">
              https://neuland-ingolstadt.de
            </a>
            <br />
            {`${t('imprint.feedback.instagram')}: `}
            <a href="https://www.instagram.com/neuland_ingolstadt/" target="_blank" rel="noreferrer">
              @neuland_ingolstadt
            </a>
            <br />
            {`${t('imprint.feedback.sourceCode')}: `}
            <a href="https://github.com/neuland-ingolstadt/neuland.app" target="_blank" rel="noreferrer">
              neuland-ingolstadt/neuland.app
            </a>
            <br />
            <br />
            <a href="https://join.neuland-ingolstadt.de" target="_blank" rel="noreferrer">
              {t('imprint.feedback.joinNeuland')}
            </a>
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          <h1 className={styles.imprintTitle}>{t('imprint.legal.title')}</h1>
          <ListGroup.Item>
            <div className={styles.imprint} dangerouslySetInnerHTML={{ __html: neulandImprint }} />
          </ListGroup.Item>
        </ListGroup>

      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}

Imprint.propTypes = {
  neulandImprint: PropTypes.string
}
