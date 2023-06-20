import { DashboardContext, ShowDashboardModal } from '../../pages/_app'
import { faChevronDown, faChevronUp, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons'
import { useContext, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'

/**
 * A modal component that allows users to personalize their experience by changing the dashboard layout
 * @returns {JSX.Element} The DashboardModal component
 * @constructor
 */
export default function DashboardModal () {
  const {
    shownDashboardEntries,
    hiddenDashboardEntries,
    moveDashboardEntry,
    hideDashboardEntry,
    bringBackDashboardEntry,
    resetOrder
  } = useContext(DashboardContext)
  const [showDashboardModal, setShowDashboardModal] = useContext(ShowDashboardModal)
  const themeModalBody = useRef()

  return (
    <Modal show={!!showDashboardModal} dialogClassName={styles.themeModal}
           onHide={() => setShowDashboardModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Dashboard</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={themeModalBody}>
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
