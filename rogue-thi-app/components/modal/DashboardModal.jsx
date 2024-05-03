import { ArchiveRestore, ChevronDown, ChevronUp, Trash } from 'lucide-react'
import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import styles from '../../styles/Personalize.module.css'
import { useDashboard } from '../../lib/providers/DashboardProvider'
import { useModals } from '../../lib/providers/ModalProvider'
import { useRef } from 'react'
import { useTranslation } from 'next-i18next'

/**
 * A modal component that allows users to personalize their experience by changing the dashboard layout
 * @returns {JSX.Element} The DashboardModal component
 * @constructor
 */
export default function DashboardModal() {
  const {
    shownDashboardEntries,
    hiddenDashboardEntries,
    moveDashboardEntry,
    hideDashboardEntry,
    bringBackDashboardEntry,
    resetOrder,
  } = useDashboard()
  const { showDashboardModal, setShowDashboardModal } = useModals()
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
        <p>{t('dashboard.orderModal.body')}</p>
        <ListGroup>
          {shownDashboardEntries.map((entry, i) => (
            <ListGroup.Item
              key={i}
              className={styles.personalizeItem}
            >
              <div className={styles.personalizeLabel}>
                {t(`cards.${entry.key}`)}
              </div>
              <div className={styles.personalizeButtons}>
                {entry.removable && (
                  <Button
                    variant="text"
                    onClick={() => hideDashboardEntry(entry.key)}
                  >
                    <Trash size={18} />
                  </Button>
                )}
                <Button
                  variant="text"
                  onClick={() => moveDashboardEntry(i, -1)}
                >
                  <ChevronUp size={18} />
                </Button>
                <Button
                  variant="text"
                  onClick={() => moveDashboardEntry(i, +1)}
                >
                  <ChevronDown size={18} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <br />

        <h4>{t('dashboard.orderModal.hiddenCards')}</h4>
        <ListGroup>
          {hiddenDashboardEntries.map((entry, i) => (
            <ListGroup.Item
              key={i}
              className={styles.personalizeItem}
            >
              <div className={styles.personalizeLabel}>
                {t(`cards.${entry.key}`)}
              </div>
              <div className={styles.personalizeButtons}>
                <Button
                  variant="text"
                  onClick={() => bringBackDashboardEntry(i)}
                >
                  <ArchiveRestore size={18} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <br />

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
