import { createContext, useContext, useEffect, useState } from 'react'

const FoodFilterContext = createContext({})

export default function FoodFilterProvider({ children }) {
  const [selectedLanguageFood, setSelectedLanguageFood] = useState('default')
  const [selectedRestaurants, setSelectedRestaurants] = useState([
    'IngolstadtMensa',
    'Reimanns',
  ])
  const [preferencesSelection, setPreferencesSelection] = useState({})
  const [allergenSelection, setAllergenSelection] = useState({})
  const [showFoodFilterModal, setShowFoodFilterModal] = useState(false)
  const [showStaticMeals, setShowStaticMeals] = useState(false)

  useEffect(() => {
    if (localStorage.selectedAllergens) {
      setAllergenSelection(JSON.parse(localStorage.selectedAllergens))
    }
    if (localStorage.preferencesSelection) {
      setPreferencesSelection(JSON.parse(localStorage.preferencesSelection))
    }
    if (localStorage.selectedRestaurantList) {
      setSelectedRestaurants(JSON.parse(localStorage.selectedRestaurantList))
    }
    if (localStorage.selectedLanguageFood) {
      setSelectedLanguageFood(JSON.parse(localStorage.selectedLanguageFood))
    }
    if (localStorage.showStaticMeals) {
      setShowStaticMeals(JSON.parse(localStorage.showStaticMeals))
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
    localStorage.selectedRestaurantList = JSON.stringify(newSelection)
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

  /**
   * Toggles the visibility of the food filter modal.
   * @returns {void}
   */
  function toggleShowStaticMeals() {
    setShowStaticMeals(!showStaticMeals)
    localStorage.showStaticMeals = JSON.stringify(!showStaticMeals)
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
    showStaticMeals,
    toggleShowStaticMeals,
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
