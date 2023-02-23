import styles from '../../styles/Personalize.module.css'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import themes from '../../data/themes.json'
import Button from 'react-bootstrap/Button'
import {
  CTF_URL, getDefaultDashboardOrder, loadDashboardEntries
} from '../../pages'
import Link from 'next/link'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons'
import { ShowThemeModal, ThemeContext } from '../../pages/_app'
import { useContext, useEffect, useRef, useState } from 'react'

export default function PersonalizeModal () {
  const [shownDashboardEntries, setShownDashboardEntries] = useState([])
  const [hiddenDashboardEntries, setHiddenDashboardEntries] = useState([])
  const [unlockedThemes, setUnlockedThemes] = useState([])
  const [showThemeModal, setShowThemeModal] = useContext(ShowThemeModal)
  const [theme, setTheme] = useContext(ThemeContext)
  const themeModalBody = useRef()

  useEffect(() => {
    async function load () {
      const entries = await loadDashboardEntries()
      setShownDashboardEntries(entries.shownDashboardEntries)
      setHiddenDashboardEntries(entries.hiddenDashboardEntries)

      if (localStorage.unlockedThemes) {
        setUnlockedThemes(JSON.parse(localStorage.unlockedThemes))
      }
    }
    load()
  }, [])

  /**
   * Persists the dashboard settings.
   * @param {object[]} entries Displayed entries
   * @param {object[]} hiddenEntries Hidden entries
   */
  function changeDashboardEntries (entries, hiddenEntries) {
    localStorage.personalizedDashboard = JSON.stringify(entries.map(x => x.key))
    localStorage.personalizedDashboardHidden = JSON.stringify(hiddenEntries.map(x => x.key))
    setShownDashboardEntries(entries)
    setHiddenDashboardEntries(hiddenEntries)
  }

  /**
   * Moves a dashboard entry to a new position.
   * @param {number} oldIndex Old position
   * @param {number} diff New position relative to the old position
   */
  function moveDashboardEntry (oldIndex, diff) {
    const newIndex = oldIndex + diff
    if (newIndex < 0 || newIndex >= shownDashboardEntries.length) {
      return
    }

    const entries = shownDashboardEntries.slice(0)
    const entry = entries[oldIndex]
    entries.splice(oldIndex, 1)
    entries.splice(newIndex, 0, entry)

    changeDashboardEntries(entries, hiddenDashboardEntries)
  }

  /**
   * Hides a dashboard entry.
   * @param {string} key Entry key
   */
  function hideDashboardEntry (key) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    const index = entries.findIndex(x => x.key === key)
    if (index >= 0) {
      hiddenEntries.push(entries[index])
      entries.splice(index, 1)
    }

    changeDashboardEntries(entries, hiddenEntries)
  }

  /**
   * Unhides a dashboard entry.
   * @param {number} index Entry position
   */
  function bringBackDashboardEntry (index) {
    const entries = shownDashboardEntries.slice(0)
    const hiddenEntries = hiddenDashboardEntries.slice(0)

    entries.push(hiddenEntries[index])
    hiddenEntries.splice(index, 1)

    changeDashboardEntries(entries, hiddenEntries)
  }

  /**
   * Resets which dashboard entries are shown and their order to default
   */
  function resetOrder () {
    const defaultEntries = getDefaultDashboardOrder()
    setShownDashboardEntries(defaultEntries.shown)
    setHiddenDashboardEntries(defaultEntries.hidden)
    changeDashboardEntries(defaultEntries.shown, defaultEntries.hidden)
  }

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
    <Modal show={!!showThemeModal} dialogClassName={styles.themeModal} onHide={() => setShowThemeModal(false)}>
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
                <Button variant="text" onClick={() => moveDashboardEntry(i, -1)}>
                  <FontAwesomeIcon title="Nach oben" icon={faChevronUp} fixedWidth/>
                </Button>
                <Button variant="text" onClick={() => moveDashboardEntry(i, +1)}>
                  <FontAwesomeIcon title="Nach unten" icon={faChevronDown} fixedWidth/>
                </Button>
                <Button variant="text" onClick={() => hideDashboardEntry(entry.key)}>
                  <FontAwesomeIcon title="Entfernen" icon={faTrash} fixedWidth/>
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
