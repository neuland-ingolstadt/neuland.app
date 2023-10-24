import { DashboardContext, ShowDashboardModal } from '../../pages/_app'
import { faChevronDown, faChevronUp, faTrash, faTrashRestore } from '@fortawesome/free-solid-svg-icons'
import { useContext, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'
import { useTranslation } from 'next-i18next'

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

  const { t } = useTranslation('common')

  return (
    <Modal
      show={!!showDashboardModal}
      dialogClassName={styles.themeModal}
      onHide={() => setShowDashboardModal(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>{t('dashboard.orderModal.title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body ref={themeModalBody}>
        <p>
          {t('dashboard.orderModal.body')}
        </p>
        <ListGroup>
          {shownDashboardEntries.map((entry, i) => (
            <ListGroup.Item key={i} className={styles.personalizeItem}>
              <div className={styles.personalizeLabel}>
                {t(`cards.${entry.key}`)}
              </div>
              <div className={styles.personalizeButtons}>
                {entry.removable &&
                  <Button variant="text" onClick={() => hideDashboardEntry(entry.key)}>
                    <FontAwesomeIcon title={t('dashboard.orderModal.icons.remove')} icon={faTrash} fixedWidth/>
                  </Button>
                }
                <Button variant="text" onClick={() => moveDashboardEntry(i, -1)}>
                  <FontAwesomeIcon title={t('dashboard.orderModal.icons.moveUp')} icon={faChevronUp} fixedWidth/>
                </Button>
                <Button variant="text" onClick={() => moveDashboardEntry(i, +1)}>
                  <FontAwesomeIcon title={t('dashboard.orderModal.icons.moveDown')} icon={faChevronDown} fixedWidth/>
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <br/>

        <h4>{t('dashboard.orderModal.hiddenCards')}</h4>
        <ListGroup>
          {hiddenDashboardEntries.map((entry, i) => (
            <ListGroup.Item key={i} className={styles.personalizeItem}>
              <div className={styles.personalizeLabel}>
                {t(`cards.${entry.key}`)}
              </div>
              <div className={styles.personalizeButtons}>
                <Button variant="text" onClick={() => bringBackDashboardEntry(i)}>
                  <FontAwesomeIcon title={t('dashboard.orderModal.icons.restore')} icon={faTrashRestore} fixedWidth/>
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
          {t('dashboard.orderModal.resetOrder')}
        </Button>
      </Modal.Body>
    </Modal>
  )
}
