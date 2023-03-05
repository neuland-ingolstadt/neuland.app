import { ShowThemeModal, ThemeContext } from '../../pages/_app'
import { useContext, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import { CTF_URL } from '../../pages'
import Form from 'react-bootstrap/Form'
import Link from 'next/link'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'
import themes from '../../data/themes.json'
import { useDashboard } from '../../lib/hooks/dashboard'

/**
 * A modal component that allows users to personalize their experience by changing the theme
 * @returns {JSX.Element} The ThemeModal compontent
 * @constructor
 */
export default function ThemeModal () {
  const {
    unlockedThemes
  } = useDashboard()
  const [showThemeModal, setShowThemeModal] = useContext(ShowThemeModal)
  const [theme, setTheme] = useContext(ThemeContext)
  const themeModalBody = useRef()

  /**
   * Changes the current theme.
   * @param {string} theme Theme key
   */
  function changeTheme (theme) {
    localStorage.theme = theme
    setTheme(theme)
    setShowThemeModal(false)
  }

  return (
    <Modal show={!!showThemeModal} dialogClassName={styles.themeModal}
           onHide={() => setShowThemeModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Theme</Modal.Title>
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
              {availableTheme.name}
            </Button>
          ))}
        </Form>
        <p>
          Um das <i>Hackerman</i>-Design freizuschalten, musst du mindestens vier Aufgaben unseres <a href={CTF_URL}
                                                                                                      target="_blank"
                                                                                                      rel="noreferrer">Übungs-CTFs</a> lösen.
          Wenn du so weit bist, kannst du es <Link href="/become-hackerman">hier</Link> freischalten.
        </p>
      </Modal.Body>
    </Modal>
  )
}
