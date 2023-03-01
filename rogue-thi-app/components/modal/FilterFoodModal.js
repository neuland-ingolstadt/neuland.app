import React, { useContext, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'

import { ShowFoodFilterModal } from '../../pages/_app'
import { useFoodFilter } from '../../lib/hooks/food-filter'

import allergenMap from '../../data/allergens.json'
import flagMap from '../../data/mensa-flags.json'
import styles from '../../styles/FilterFoodModal.module.css'

Object.keys(allergenMap)
  .filter(key => key.startsWith('_'))
  .forEach(key => delete allergenMap[key])

/**
 * A modal component that allows users to personalize their food preferences and allergenes
 * @returns {JSX.Element}
 * @constructor
 */
export default function FilterFoodModal () {
  const {
    selectedRestaurants,
    preferencesSelection,
    setPreferencesSelection,
    allergenSelection,
    setAllergenSelection,
    toggleSelectedRestaurant,
    savePreferencesSelection,
    saveAllergenSelection
  } = useFoodFilter()
  const [showFoodFilterModal, setShowFoodFilterSelection] = useContext(ShowFoodFilterModal)
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)
  const [showPreferencesSelection, setShowPreferencesSelection] = useState(false)

  return (
    <>
      <Modal show={showFoodFilterModal} onHide={() => setShowFoodFilterSelection(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Filter</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={styles.filterHeader}>
            <h6>
              Restaurants
            </h6>
          </div>

          <div className={styles.filterBody}>
            <Form.Check
              id='restaurant-checkbox-mensa'
              label='Mensa anzeigen'
              checked={selectedRestaurants.includes('mensa')}
              onChange={() => toggleSelectedRestaurant('mensa')}
            />
            <Form.Check
              id='restaurant-checkbox-reimanns'
              label='Reimanns anzeigen'
              checked={selectedRestaurants.includes('reimanns')}
              onChange={() => toggleSelectedRestaurant('reimanns')}
            />
          </div>

          <hr/>

          <div className={styles.filterHeader}>
            <h6>
              Allergien
            </h6>
            <Button variant='outline-primary' onClick={() => {
              setShowAllergenSelection(true)
              setShowFoodFilterSelection(false)
            }}>
              <FontAwesomeIcon title="Allergene" icon={faPen} fixedWidth/>
            </Button>
          </div>
          <div className={styles.filterBody}>
            <>Ausgewählt:{' '}</>
            {Object.entries(allergenSelection).filter(x => x[1]).map(x => allergenMap[x[0]]).join(', ') || 'Keine'}.
          </div>

          <hr/>

          <div className={styles.filterHeader}>
            <h6>
              Essenspräferenzen
            </h6>
            <Button variant='outline-primary' onClick={() => {
              setShowPreferencesSelection(true)
              setShowFoodFilterSelection(false)
            }}>
              <FontAwesomeIcon title='Preferences' icon={faPen} fixedWidth/>
            </Button>
          </div>

          <div className={styles.filterBody}>
            <>Ausgewählt:{' '}</>
            {Object.entries(preferencesSelection).filter(x => x[1]).map(x => flagMap[x[0]]).join(', ') || 'Keine'}.
          </div>

          <hr/>

          <p>
            Deine Angaben werden nur lokal auf deinem Gerät gespeichert und an niemanden übermittelt.
          </p>

        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowFoodFilterSelection(false)}>OK</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAllergenSelection} onHide={() => setShowAllergenSelection(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Allergene auswählen</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {Object.entries(allergenMap).map(([key, value]) => (
              <Form.Check
                key={key}
                id={'allergen-checkbox-' + key}
                label={<span><strong>{key}</strong>{' – '}{value}</span>}
                checked={allergenSelection[key] || false}
                onChange={e => setAllergenSelection({ ...allergenSelection, [key]: e.target.checked })}
              />
            ))}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => {
            saveAllergenSelection()
            setShowAllergenSelection(false)
            setShowFoodFilterSelection(true)
          }}>OK</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPreferencesSelection} onHide={() => setShowPreferencesSelection(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Präferenzen auswählen</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {Object.entries(flagMap).map(([key, value]) => (
              <Form.Check
                key={key}
                id={'preferences-checkbox-' + key}
                label={<span>{value}</span>}
                checked={preferencesSelection[key] || false}
                onChange={e => setPreferencesSelection({ ...preferencesSelection, [key]: e.target.checked })}
              />
            ))}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={() => {
            savePreferencesSelection()
            setShowPreferencesSelection(false)
            setShowFoodFilterSelection(true)
          }}>OK</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
