import { useEffect, useState } from 'react'

/**
 * @typedef {Object} RestaurantPreferences
 * @property {(value: (((prevState: {}) => {}) | {})) => void} setAllergenSelection - A function that sets the selected allergens.
 * @property {{}} allergenSelection - An object containing the selected allergens.
 * @property {toggleSelectedRestaurant} toggleSelectedRestaurant - A function that toggles the selection of a restaurant.
 * @property {toggleSelectedLanguageFood} toggleSelectedLanguageFood - A function that toggles the selection LanguageFood.
 * @property {{}} preferencesSelection - An object containing the selected preferences.
 * @property {(value: (((prevState: {}) => {}) | {})) => void} setPreferencesSelection - A function that sets the selected preferences.
 * @property {string[]} selectedRestaurants - An array containing the selected restaurants.
 * @property {string[]} selectedLanguageFood - An array containing the selected LanguageFood.
 * @property {savePreferencesSelection} savePreferencesSelection - A function that saves the selected preferences.
 * @property {saveAllergenSelection} saveAllergenSelection - A function that saves the selected allergens.
 */

/**
 * @callback toggleSelectedRestaurant
 * @param {string} restaurant - The ID of the restaurant to toggle.
 * @returns {void}
 */

/**
 * @callback toggleSelectedLanguageFood
 * @param {string} language - The language of LanguageFood to toggle.
 * @returns {void}
 */

/**
 * @callback savePreferencesSelection
 * @param {{}} preferences - An object containing the preferences to save.
 * @returns {void}
 */

/**
 * @callback saveAllergenSelection
 * @param {{}} allergens - An object containing the allergens to save.
 * @returns {void}
 */
export function useFoodFilter () {
  const [selectedLanguageFood, setSelectedLanguageFood] = useState(['mensa', 'reimanns', 'reimanns-static'])
  const [selectedRestaurants, setSelectedRestaurants] = useState([])
  const [preferencesSelection, setPreferencesSelection] = useState({})
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showFoodFilterModal, setShowFoodFilterModal] = useState(false)

  useEffect(() => {
    if (localStorage.selectedAllergens) {
      setAllergenSelection(JSON.parse(localStorage.selectedAllergens))
    }
    if (localStorage.preferencesSelection) {
      setPreferencesSelection(JSON.parse(localStorage.preferencesSelection))
    }
    if (localStorage.selectedRestaurants) {
      setSelectedRestaurants(JSON.parse(localStorage.selectedRestaurants))
    }
    if (localStorage.selectedLanguageFood) {
      setSelectedLanguageFood(JSON.parse(localStorage.selectedLanguageFood))
    }
  }, [])

  /**
   * Enables or disables a restaurant.
   * @param {string} name Restaurant name (either `mensa` or `reimanns`)
   */
  function toggleSelectedRestaurant (name) {
    const checked = selectedRestaurants.includes(name)
    const newSelection = selectedRestaurants.filter(x => x !== name)
    if (!checked) {
      newSelection.push(name)
    }

    setSelectedRestaurants(newSelection)
    localStorage.selectedRestaurants = JSON.stringify(newSelection)
  }

  /**
   * Enables or disables a restaurant.
   * @param {string} name Restaurant name (either `mensa` or `reimanns`)
   */
  function toggleSelectedLanguageFood (name) {
    const checked = selectedLanguageFood.includes(name)
    const newSelection = selectedLanguageFood.filter(x => x !== name)
    if (!checked) {
      newSelection.push(name)
    }

    setSelectedLanguageFood(newSelection)
    localStorage.selectedLanguageFood = JSON.stringify(newSelection)
  }

  /**
   * Persists the preferences selection to localStorage
   */
  function savePreferencesSelection () {
    localStorage.preferencesSelection = JSON.stringify(preferencesSelection)
  }

  /**
   * Persists the allergen selection to localStorage.
   */
  function saveAllergenSelection () {
    localStorage.selectedAllergens = JSON.stringify(allergenSelection)
  }

  return {
    selectedRestaurants,
    selectedLanguageFood,
    preferencesSelection,
    setPreferencesSelection,
    allergenSelection,
    setAllergenSelection,
    toggleSelectedRestaurant,
    toggleSelectedLanguageFood,
    savePreferencesSelection,
    saveAllergenSelection,
    showFoodFilterModal,
    setShowFoodFilterModal
  }
}
