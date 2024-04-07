import { createContext, useContext, useEffect, useState } from 'react'

const FoodFilterContext = createContext({})

export default function FoodFilterProvider({ children }) {
  const [selectedLanguageFood, setSelectedLanguageFood] = useState('default')
  const [selectedRestaurants, setSelectedRestaurants] = useState([
    'mensa',
    'reimanns',
    'reimanns-static',
  ])
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
  function toggleSelectedRestaurant(name) {
    const checked = selectedRestaurants.includes(name)
    const newSelection = selectedRestaurants.filter((x) => x !== name)
    if (!checked) {
      newSelection.push(name)
    }

    setSelectedRestaurants(newSelection)
    localStorage.selectedRestaurants = JSON.stringify(newSelection)
  }

  /**
   * Sets the Language for the food menu.
   * @param {string} name language name (either `default`, `de` or `en`)
   */
  function toggleSelectedLanguageFood(name) {
    setSelectedLanguageFood(name)
    localStorage.selectedLanguageFood = JSON.stringify(name)
  }

  /**
   * Persists the preferences selection to localStorage
   */
  function savePreferencesSelection() {
    localStorage.preferencesSelection = JSON.stringify(preferencesSelection)
  }

  /**
   * Persists the allergen selection to localStorage.
   */
  function saveAllergenSelection() {
    localStorage.selectedAllergens = JSON.stringify(allergenSelection)
  }

  const value = {
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
    setShowFoodFilterModal,
  }

  return (
    <FoodFilterContext.Provider value={value}>
      {children}
    </FoodFilterContext.Provider>
  )
}

export const useFoodFilter = () => {
  const context = useContext(FoodFilterContext)
  if (!context) {
    throw new Error('useFoodFilter must be used within a FoodFilterProvider')
  }
  return context
}
