import { ShowThemeModal, ThemeContext } from '../../pages/_app'
import { useContext, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Link from 'next/link'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'
import themes from '../../data/themes.json'
import { useDashboard } from '../../lib/hooks/dashboard'

import { Trans, useTranslation } from 'next-i18next'

const CTF_URL = process.env.NEXT_PUBLIC_CTF_URL

/**
 * A modal component that allows users to personalize their experience by changing the theme
 * @returns {JSX.Element} The ThemeModal component
 * @constructor
 */
export default function ThemeModal () {
  const {
    unlockedThemes
  } = useDashboard()
  const [showThemeModal, setShowThemeModal] = useContext(ShowThemeModal)
  const [theme, setTheme] = useContext(ThemeContext)
  const themeModalBody = useRef()
  const { t, i18n } = useTranslation('personal')

  /**
   * Changes the current theme.
   * @param {string} theme Theme key
   */
  function changeTheme (theme) {
    localStorage.theme = theme
    setTheme(theme)
    setShowThemeModal(false)
  }

  /**
   * Workaround for using next/link and i18n together
   * See: https://github.com/i18next/react-i18next/issues/1090
   * @param {string} href The link to the page
   * @param {string} children The children of the link
   */
  function TransLink ({ href, children }) {
    return (
      <Link href={href || ''}>
        <a>{children}</a>
      </Link>
    )
  }

  return (
    <Modal
      show={!!showThemeModal}
      dialogClassName={styles.themeModal}
      onHide={() => setShowThemeModal(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>{t('personal.modals.theme.title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={themeModalBody}>
        <Form>
          {themes.map((availableTheme, i) => (
            <Button
              key={i}
              id={`theme-${i}`}
              className={styles.themeButton}
              variant={theme === availableTheme.style ? 'primary' : 'secondary'}
              onClick={() => changeTheme(availableTheme.style)}
              disabled={availableTheme.requiresToken && unlockedThemes.indexOf(availableTheme.style) === -1}
            >
              {availableTheme.name[i18n.languages[0]]}
            </Button>
          ))}
        </Form>
        <p>
          <Trans
            i18nKey="personal.modals.theme.hackerman"
            ns='personal'
            components={{
              i: <i />,
              aCtf: <a
                href={CTF_URL}
                target="_blank"
                rel="noreferrer"
              />,
              aHackerman: <TransLink
                href="/become-hackerman"
              />
            }}
          />
        </p>
      </Modal.Body>
    </Modal>
  )
}
