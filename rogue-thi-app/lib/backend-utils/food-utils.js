import { formatISODate, getAdjustedDay, getMonday } from '../date-utils'
import NeulandAPI from '../backend/neuland-api'

import flagContradictions from '../../data/flag-contradictions.json'
import stopWords from '../../data/stop-words.json'

const hash = require('object-hash')

/**
 * Fetches and parses the meal plan
 * @param {string[]} restaurants Requested restaurants
 * @param {string} language Language code
 * @returns {object[]}
 */
export async function loadFoodEntries (restaurants = ['mensa', 'reimanns', 'reimanns-static', 'canisius']) {
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
      ...unifyMeal(meal),
      variants: meal.variants?.map(variant => unifyMeal(variant))
    }))
  }))
}

/**
 * Unifies a single meal to a common format
 * @param {object} meal
 * @returns {object} Unified meal
 */
function unifyMeal (meal) {
  return {
    name: capitalize(meal.name),
    id: meal.id,
    category: meal.category,
    prices: meal.prices || {
      student: null,
      employee: null,
      guest: null
    },
    allergens: meal.allergens || null,
    flags: cleanMealFlags(meal.flags),
    nutrition: meal.nutrition || null,
    originalLanguage: meal.originalLanguage || 'de',
    static: meal.static || false,
    additional: meal.additional || false
  }
}

/**
 * Merges meals with a similar name and same category into one meal with variants (Week entries)
 * @param {object[]} entries
 * @returns {object[]} Merged meals
 */
export function mergeMealVariants (entries) {
  return entries.map(day => {
    return {
      ...day,
      meals: mergeDayEntries(day.meals)
    }
  })
}

/**
 * Merge meals with a similar name and same category into one meal with variants (Day entries)
 * @param {object[]} dayEntries
 * @returns {object[]} Merged meals
 */
function mergeDayEntries (dayEntries) {
  const variationKeys = dayEntries.map(meal => {
    const comparingKeys = dayEntries.filter(x => x.name !== meal.name && x.name.startsWith(meal.name) && x.category === meal.category)
    return {
      meal,
      variants: comparingKeys
    }
  })

  const mergedEntries = dayEntries.filter(meal => !variationKeys.map(keys => keys.variants).flat().map(x => x.name).includes(meal.name))

  // remove duplicate meals
  const noDuplicates = mergedEntries.filter((meal, index, self) =>
    index === self.findIndex(x => x.name === meal.name)
  )

  // add variants
  variationKeys.filter(({ variants }) => variants.length > 0).forEach(({ meal, variants }) => {
    meal.variants = variants.map(variant => {
      return {
        ...variant,
        name: cleanMealName(variant.name.replace(meal.name, '').trim()),
        prices: Object.fromEntries(Object.entries(variant.prices).map(([key, value]) => [key, value - meal.prices[key]])),
        additional: true
      }
    })
  })

  return noDuplicates
}

/**
 * Removes german stop words from the given name
 * @param {*} name
 * @returns {string} Cleaned name
 */
function cleanMealName (name) {
  return name.split(' ').filter(x => !stopWords.de.includes(x)).join(' ')
}

export function getMealHash (day, mealName) {
  return `${day}-${hash(mealName)}`
}
