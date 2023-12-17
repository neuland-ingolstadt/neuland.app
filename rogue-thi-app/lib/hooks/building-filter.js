import { useEffect, useState } from 'react'

export function useBuildingFilter() {
  const [buildingPreferences, setBuildingPreferences] = useState({})

  useEffect(() => {
    if (localStorage.buildingPreferences) {
      setBuildingPreferences(JSON.parse(localStorage.buildingPreferences))
    }
  }, [])

  /**
   * Persists the building preferences to localStorage.
   */
  function saveBuildingPreferences() {
    localStorage.buildingPreferences = JSON.stringify(buildingPreferences)
  }

  return {
    buildingPreferences,
    setBuildingPreferences,
    saveBuildingPreferences,
  }
}
