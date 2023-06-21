import React, { useContext } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import { ShowPersonalDataModal } from '../../pages/_app'
import styles from '../../styles/PersonalDataModal.module.css'
import { useTranslation } from 'next-i18next'

export default function PersonalDataModal ({ userdata }) {
  const [showPersonalDataModal, setShowPersonalDataModal] = useContext(ShowPersonalDataModal)

  const { t, i18n } = useTranslation('personal')

  /**
   * Displays a row with the users information.
   * @param {string} i18nKey Translation key for the row label
   * @param {string} name Row name as returned by the backend
   * @param {object} render Function returning the data to be displayed. If set, the `name` parameter will be ignored.
   */
  function renderPersonalEntry (i18nKey, name, render) {
    return (
      <ListGroup.Item action onClick={() => {
        if (i18nKey === 'examRegulations') {
          navigator.clipboard.writeText('SPO: ' + userdata.pvers)
        } else {
          navigator.clipboard.writeText(userdata[name])
        }
      }}>
        {t(`personal.modals.personalData.${i18nKey}`)}
        <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
          <ReactPlaceholder type="text" rows={1} ready={userdata}>
            {userdata && render && render()}
            {userdata && !render && userdata[name]}
          </ReactPlaceholder>
        </span>
      </ListGroup.Item>
    )
  }

  const formatNum = (new Intl.NumberFormat(i18n.languages[0], { minimumFractionDigits: 2, maximumFractionDigits: 2 })).format

  return (
    <Modal show={showPersonalDataModal} onHide={() => setShowPersonalDataModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalHeader}>
          Persönliche Daten
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <ListGroup>
          {renderPersonalEntry('matriculationNumber', 'mtknr')}
          {renderPersonalEntry('libraryNumber', 'bibnr')}
          {renderPersonalEntry('printerBalance', null, () => `${formatNum(userdata.pcounter.replace('€', ''))}€`)}
          {renderPersonalEntry('fieldOfStudy', 'fachrich')}
          {renderPersonalEntry('semester', 'stgru')}
          {renderPersonalEntry('examRegulations', null, () => (
            <a
              /* see: https://github.com/neuland-ingolstadt/THI-App/issues/90#issuecomment-924768749 */
              href={userdata?.po_url && userdata.po_url.replace('verwaltung-und-stabsstellen', 'hochschulorganisation')}
              target="_blank"
              rel="noreferrer">
              {userdata.pvers}
            </a>
          ))}
          {renderPersonalEntry('email', 'email')}
          {renderPersonalEntry('thiEmail', 'fhmail')}
          {renderPersonalEntry('phone', null, () => userdata.telefon || 'N/A')}
          {renderPersonalEntry('firstName', 'vname')}
          {renderPersonalEntry('lastName', 'name')}
          {renderPersonalEntry('street', 'str')}
          {renderPersonalEntry('city', null, () => userdata.plz && userdata.ort && `${userdata.plz} ${userdata.ort}`)}
        </ListGroup>
      </Modal.Body>
    </Modal>
  )
}
