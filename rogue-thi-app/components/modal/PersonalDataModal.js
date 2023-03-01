import React, { useContext } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { ShowPersonalDataModal } from '../../pages/_app'
import styles from '../../styles/PersonalDataModal.module.css'

export default function PersonalDataModal ({ userdata }) {
  const [showPersonalDataModal, setShowPersonalDataModal] = useContext(ShowPersonalDataModal)

  /**
   * Displays a row with the users information.
   * @param {string} label Pretty row name
   * @param {string} name Row name as returned by the backend
   * @param {object} render Function returning the data to be displayed. If set, the `name` parameter will be ignored.
   */
  function renderPersonalEntry (label, name, render) {
    return (
      <ListGroup.Item action onClick={() => {
        if (label === 'Prüfungsordnung') {
          navigator.clipboard.writeText('SPO: ' + userdata.pvers)
        } else {
          navigator.clipboard.writeText(userdata[name])
        }
      }}>
        {label}
        <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
          <ReactPlaceholder type="text" rows={1} ready={userdata}>
            {userdata && render && render()}
            {userdata && !render && userdata[name]}
          </ReactPlaceholder>
        </span>
      </ListGroup.Item>
    )
  }

  return (
    <Modal show={showPersonalDataModal} onHide={() => setShowPersonalDataModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalHeader}>
          Persönliche Daten
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <ListGroup>
          {renderPersonalEntry('Matrikelnummer', 'mtknr')}
          {renderPersonalEntry('Bibliotheksnummer', 'bibnr')}
          {renderPersonalEntry('Druckguthaben', 'pcounter')}
          {renderPersonalEntry('Studiengang', 'fachrich')}
          {renderPersonalEntry('Fachsemester', 'stgru')}
          {renderPersonalEntry('Prüfungsordnung', null, () => (
            <a
              /* see: https://github.com/neuland-ingolstadt/THI-App/issues/90#issuecomment-924768749 */
              href={userdata?.po_url && userdata.po_url.replace('verwaltung-und-stabsstellen', 'hochschulorganisation')}
              target="_blank"
              rel="noreferrer">
              {userdata.pvers}
            </a>
          ))}
          {renderPersonalEntry('E-Mail', 'email')}
          {renderPersonalEntry('THI E-Mail', 'fhmail')}
          {renderPersonalEntry('Telefon', null, () => userdata.telefon || 'N/A')}
          {renderPersonalEntry('Vorname', 'vname')}
          {renderPersonalEntry('Nachname', 'name')}
          {renderPersonalEntry('Straße', 'str')}
          {renderPersonalEntry('Ort', null, () => userdata.plz && userdata.ort && `${userdata.plz} ${userdata.ort}`)}
        </ListGroup>
      </Modal.Body>
    </Modal>
  )
}
