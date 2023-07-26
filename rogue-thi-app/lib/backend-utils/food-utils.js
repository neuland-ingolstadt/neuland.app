import { formatISODate, getAdjustedDay, getMonday } from '../date-utils'
import NeulandAPI from '../backend/neuland-api'

import flagContradictions from '../../data/flag-contradictions.json'

/**
 * Fetches and parses the meal plan
 * @param {string[]} restaurants Requested restaurants
 * @param {string} language Language code
 * @returns {object[]}
 */
export async function loadFoodEntries (restaurants) {
  const entries = []

  if (restaurants.includes('mensa')) {
    const data = await NeulandAPI.getMensaPlan()
    data.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Mensa'
    }))
    entries.push(data)
  }

  if (restaurants.some(x => ['reimanns', 'reimanns-static'].includes(x))) {
    const data = await NeulandAPI.getReimannsPlan()

    const startOfToday = new Date(formatISODate(new Date())).getTime()
    const filteredData = data.filter(x => (new Date(x.timestamp)).getTime() >= startOfToday)

    filteredData.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Reimanns'
    }))
    entries.push(filteredData)
  }

  if (restaurants.includes('canisius')) {
    const data = await NeulandAPI.getCanisiusPlan()

    const startOfToday = new Date(formatISODate(new Date())).getTime()
    const filteredData = data.filter(x => (new Date(x.timestamp)).getTime() >= startOfToday)

    filteredData.forEach(day => day.meals.forEach(entry => {
      entry.restaurant = 'Canisius'
    }))
    entries.push(filteredData)
  }

  // get start of this week (monday) or next monday if isWeekend
  const startOfThisWeek = getMonday(getAdjustedDay(new Date()))

  // create day entries for next 12 days (current and next week including the weekend) starting from monday
  let days = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(startOfThisWeek.getTime())
    date.setDate(date.getDate() + i)
    return date
  })

  // remove weekend
  days = days.filter(x => x.getDay() !== 0 && x.getDay() !== 6)

  // map to ISO date
  days = days.map(x => formatISODate(x))

  // map entries to daysTest
  return days.map(day => {
    const dayEntries = entries.flatMap(r => r.find(x => x.timestamp === day)?.meals || [])
    return {
      timestamp: day,
      meals: dayEntries
    }
  })
}

/**
 * Cleans the meal flags to remove wrong flags (e.g. "veg" (vegan) and "R" (Beef) at the same time => remove "veg")
 * @param {string[]} flags Meal flags
 * @returns {string[]} Cleaned meal flags
 **/
function cleanMealFlags (flags) {
  if (!flags) return null

  // find contradictions
  const contradictions = flags.filter(x => flagContradictions[x]?.some(y => flags?.includes(y)))

  // remove contradictions
  flags = flags?.filter(x => !contradictions.includes(x)) || []

  return flags
}

/**
 * Capitalizes the first letter of the meal names
 * @param {object} mealNames Meal names
 * @returns {object} Capitalized meal names
 * @example { de: 'veganer burger', en: 'vegan burger' } => { de: 'Veganer burger', en: 'Vegan burger' }
 */
function capitalize (mealNames) {
  return Object.fromEntries(Object.entries(mealNames).map(([key, value]) =>
    [key, value.charAt(0).toUpperCase() + value.slice(1)]
  ))
}

/**
 * Unifies the meal plan entries to a common format
 * @param {object[]} entries Meal plan entries
 * @returns {object[]} Unified meal plan entries
 */
export function unifyFoodEntries (entries) {
  return entries.map(entry => ({
    timestamp: entry.timestamp,
    meals: entry.meals.map(meal => ({
      name: capitalize(meal.name),
      category: meal.category,
      prices: meal.prices || {
        student: null,
        employee: null,
        guest: null
      },
      allergens: meal.allergens || null,
      flags: cleanMealFlags(meal.flags),
      nutrition: meal.nutrition || null,
      variations: meal.variations || [],
      originalLanguage: meal.originalLanguage || 'de',
      static: meal.static || false
    }))
  }))
}
