import { useEffect, useState } from 'react'

export function useFoodFilter () {
  const [selectedRestaurants, setSelectedRestaurants] = useState(['mensa'])
  const [preferencesSelection, setPreferencesSelection] = useState({})
  const [allergenSelection, setAllergenSelection] = useState({})
  const [isStudent, setIsStudent] = useState(true)

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
    if (localStorage.isStudent === 'false') {
      setIsStudent(false)
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

  return [
    selectedRestaurants,
    preferencesSelection,
    setPreferencesSelection,
    allergenSelection,
    setAllergenSelection,
    isStudent,
    toggleSelectedRestaurant,
    savePreferencesSelection,
    saveAllergenSelection
  ]
}
