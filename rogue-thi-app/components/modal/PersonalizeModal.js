import { ShowPersonalizeModal, ThemeContext } from '../../pages/_app'
import { faChevronDown, faChevronUp, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons'
import { useContext, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import { CTF_URL } from '../../pages'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Form from 'react-bootstrap/Form'
import Link from 'next/link'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'
import themes from '../../data/themes.json'
import { useDashboard } from '../../lib/hooks/dashboard'

/**
 * A modal component that allows users to personalize their experience by changing the theme and dashboard layout
 * @returns {JSX.Element} The PersonalizeModal compontent
 * @constructor
 */
export default function PersonalizeModal () {
  const {
    shownDashboardEntries,
    hiddenDashboardEntries,
    unlockedThemes,
    moveDashboardEntry,
    hideDashboardEntry,
    bringBackDashboardEntry,
    resetOrder
  } = useDashboard()
  const [showPersonalizeModal, setShowPersonalizeModal] = useContext(ShowPersonalizeModal)
  const [theme, setTheme] = useContext(ThemeContext)
  const themeModalBody = useRef()

  /**
   * Changes the current theme.
   * @param {string} theme Theme key
   */
  function changeTheme (theme) {
    localStorage.theme = theme
    setTheme(theme)
    setShowPersonalizeModal(false)
  }

  return (
    <Modal show={!!showPersonalizeModal} dialogClassName={styles.themeModal}
           onHide={() => setShowPersonalizeModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Personalisierung</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={themeModalBody}>
        <h3 className={styles.themeHeader}>Design</h3>
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

        <h3 className={styles.themeHeader}>Dashboard</h3>
        <p>
          Hier kannst du die Reihenfolge der im Dashboard angezeigten Einträge verändern.
        </p>
        <ListGroup>
          {shownDashboardEntries.map((entry, i) => (
            <ListGroup.Item key={i} className={styles.personalizeItem}>
              <div className={styles.personalizeLabel}>
                {entry.label}
              </div>
              <div className={styles.personalizeButtons}>
                {entry.removable &&
                  <Button variant="text" onClick={() => hideDashboardEntry(entry.key)}>
                    <FontAwesomeIcon title="Entfernen" icon={faTrash} fixedWidth/>
                  </Button>
                }
                <Button variant="text" onClick={() => moveDashboardEntry(i, -1)}>
                  <FontAwesomeIcon title="Nach oben" icon={faChevronUp} fixedWidth/>
                </Button>
                <Button variant="text" onClick={() => moveDashboardEntry(i, +1)}>
                  <FontAwesomeIcon title="Nach unten" icon={faChevronDown} fixedWidth/>
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <br/>

        <h4>Ausgeblendete Elemente</h4>
        <ListGroup>
          {hiddenDashboardEntries.map((entry, i) => (
            <ListGroup.Item key={i} className={styles.personalizeItem}>
              <div className={styles.personalizeLabel}>
                {entry.label}
              </div>
              <div className={styles.personalizeButtons}>
                <Button variant="text" onClick={() => bringBackDashboardEntry(i)}>
                  <FontAwesomeIcon title="Wiederherstellen" icon={faTrashRestore} fixedWidth/>
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <br/>

        <Button
          variant="secondary"
          onClick={() => resetOrder()}
        >
          Reihenfolge zurücksetzen
        </Button>
      </Modal.Body>
    </Modal>
  )
}
