import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import { Pencil } from 'lucide-react'

import allergenMap from '../../data/allergens.json'
import flagMap from '../../data/mensa-flags.json'
import styles from '../../styles/FilterFoodModal.module.css'

import { useFoodFilter } from '../../lib/providers/FoodFilterProvider'
import { useTranslation } from 'next-i18next'

Object.keys(allergenMap)
  .filter((key) => key.startsWith('_'))
  .forEach((key) => delete allergenMap[key])

/**
 * A modal component that allows users to personalize their food preferences and allergenes
 * @returns {JSX.Element}
 * @constructor
 */
export default function FilterFoodModal() {
  const {
    selectedRestaurants,
    preferencesSelection,
    setPreferencesSelection,
    allergenSelection,
    setAllergenSelection,
    toggleSelectedRestaurant,
    savePreferencesSelection,
    saveAllergenSelection,
    showFoodFilterModal,
    setShowFoodFilterModal,
    showStaticMeals,
    toggleShowStaticMeals,
  } = useFoodFilter()
  const [showAllergenSelection, setShowAllergenSelection] = useState(false)
  const [showPreferencesSelection, setShowPreferencesSelection] =
    useState(false)
  const { i18n, t } = useTranslation(['common'])
  const currentLocale = i18n.languages[0]

  const filteredFlagMap = Object.fromEntries(
    Object.entries(flagMap).filter(([key]) => key !== '_source')
  )

  return (
    <>
      <Modal
        show={showFoodFilterModal}
        onHide={() => setShowFoodFilterModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('food.filterModal.header')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={styles.filterHeader}>
            <h6>{t('food.filterModal.restaurants.title')}</h6>
          </div>

          <div className={styles.filterBody}>
            <Form.Check
              id="restaurant-checkbox-mensa-ingolstadt"
              label={t('food.filterModal.restaurants.showMensaIngolstadt')}
              checked={selectedRestaurants.includes('IngolstadtMensa')}
              onChange={() => toggleSelectedRestaurant('IngolstadtMensa')}
            />
            <Form.Check
              id="restaurant-checkbox-mensa-neuburg"
              label={t('food.filterModal.restaurants.showMensaNeuburg')}
              checked={selectedRestaurants.includes('NeuburgMensa')}
              onChange={() => toggleSelectedRestaurant('NeuburgMensa')}
            />
            <Form.Check
              id="restaurant-checkbox-reimanns"
              label={t('food.filterModal.restaurants.showReimanns')}
              checked={selectedRestaurants.includes('Reimanns')}
              onChange={() => toggleSelectedRestaurant('Reimanns')}
            />
            <Form.Check
              id="restaurant-checkbox-canisius"
              label={t('food.filterModal.restaurants.showCanisius')}
              checked={selectedRestaurants.includes('Canisius')}
              onChange={() => toggleSelectedRestaurant('Canisius')}
            />
          </div>

          <hr />
          <div className={styles.filterHeader}>
            <h6>{t('food.filterModal.showStaticMeals.title')}</h6>
          </div>

          <div className={styles.filterBody}>
            <Form.Check
              id="show-static-meals-checkbox"
              label={t('food.filterModal.showStaticMeals.label')}
              checked={showStaticMeals}
              onChange={() => toggleShowStaticMeals()}
            />
          </div>

          <hr />

          <div className={styles.filterHeader}>
            <h6>{t('food.filterModal.allergens.title')}</h6>
            <Button
              variant="outline-primary"
              onClick={() => {
                setShowAllergenSelection(true)
                setShowFoodFilterModal(false)
              }}
              className={styles.editButton}
            >
              <Pencil size={18} />
            </Button>
          </div>
          <div className={styles.filterBody}>
            <>{t('food.filterModal.allergens.selected')}: </>
            {Object.entries(allergenSelection)
              .filter((x) => x[1])
              .map((x) => allergenMap[x[0]][currentLocale])
              .join(', ') || `${t('food.filterModal.allergens.empty')}`}
          </div>

          <hr />

          <div className={styles.filterHeader}>
            <h6>{t('food.filterModal.preferences.title')}</h6>
            <Button
              variant="outline-primary"
              onClick={() => {
                setShowPreferencesSelection(true)
                setShowFoodFilterModal(false)
              }}
              className={styles.editButton}
            >
              <Pencil size={18} />
            </Button>
          </div>

          <div className={styles.filterBody}>
            <>{t('food.filterModal.preferences.selected')}: </>
            {Object.entries(preferencesSelection)
              .filter((x) => x[1])
              .map((x) => flagMap[x[0]][currentLocale])
              .join(', ') || `${t('food.filterModal.preferences.empty')}`}
          </div>

          <hr />

          <p>{t('food.filterModal.info')}</p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowFoodFilterModal(false)}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showAllergenSelection}
        onHide={() => setShowAllergenSelection(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('food.allergensModal')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {Object.entries(allergenMap).map(([key, value]) => (
              <Form.Check
                key={key}
                id={'allergen-checkbox-' + key}
                label={
                  <span>
                    <strong>{key}</strong>
                    {' – '}
                    {value[currentLocale]}
                  </span>
                }
                checked={allergenSelection[key] || false}
                onChange={(e) =>
                  setAllergenSelection({
                    ...allergenSelection,
                    [key]: e.target.checked,
                  })
                }
              />
            ))}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              saveAllergenSelection()
              setShowAllergenSelection(false)
              setShowFoodFilterModal(true)
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPreferencesSelection}
        onHide={() => setShowPreferencesSelection(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('food.preferencesModal')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {Object.entries(filteredFlagMap).map(([key, value]) => (
              <Form.Check
                key={key}
                id={'preferences-checkbox-' + key}
                label={<span>{value[currentLocale]}</span>}
                checked={preferencesSelection[key] || false}
                onChange={(e) =>
                  setPreferencesSelection({
                    ...preferencesSelection,
                    [key]: e.target.checked,
                  })
                }
              />
            ))}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              savePreferencesSelection()
              setShowPreferencesSelection(false)
              setShowFoodFilterModal(true)
            }}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
