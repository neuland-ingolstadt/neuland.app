import { formatISODate, getAdjustedDay, getMonday } from '../date-utils'
import NeulandAPI from '../backend/neuland-api'

import flagContradictions from '../../data/flag-contradictions.json'
import stopWords from '../../data/stop-words.json'

const hash = require('object-hash')

const VERSIONS = ['v1', 'v2']

/**
 * Fetches and parses the meal plan
 * @param {string[]} restaurants Requested restaurants
 * @param {string} language Language code
 * @returns {object[]}
 */
export async function loadFoodEntries(
  restaurants = ['IngolstadtMensa', 'NeuburgMensa', 'Reimanns', 'Canisius'],
  showStaticMeals = false
) {
  const data = await NeulandAPI.getFoodPlan(restaurants)
  const entries = data.food.foodData

  // get start of this week (monday) or next monday if isWeekend
  const startOfThisWeek = getMonday(getAdjustedDay(new Date()))

  // create day entries for next 12 days (current and next week including the weekend) starting from monday
  let days = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(startOfThisWeek.getTime())
    date.setDate(date.getDate() + i)
    return date
  })

  // remove weekend
  days = days.filter((x) => x.getDay() !== 0 && x.getDay() !== 6)

  // map to ISO date
  days = days.map((x) => formatISODate(x))

  // map entries to daysTest
  return days.map((day) => {
    const dayEntry = entries.find((r) => r.timestamp === day)
    return {
      timestamp: day,
      meals: dayEntry
        ? showStaticMeals
          ? dayEntry.meals
          : dayEntry.meals.filter((meal) => !meal.static)
        : [],
    }
  })
}

/**
 * Cleans the meal flags to remove wrong flags (e.g. "veg" (vegan) and "R" (Beef) at the same time => remove "veg")
 * @param {string[]} flags Meal flags
 * @returns {string[]} Cleaned meal flags
 **/
function cleanMealFlags(flags) {
  if (!flags) return null

  // find contradictions
  const contradictions = flags.filter((x) =>
    flagContradictions[x]?.some((y) => flags?.includes(y))
  )

  // remove contradictions
  flags = flags?.filter((x) => !contradictions.includes(x)) || []

  return flags
}

/**
 * Capitalizes the first letter of the meal names
 * @param {object} mealNames Meal names
 * @returns {object} Capitalized meal names
 * @example { de: 'veganer burger', en: 'vegan burger' } => { de: 'Veganer burger', en: 'Vegan burger' }
 */
function capitalize(mealNames) {
  return Object.fromEntries(
    Object.entries(mealNames).map(([key, value]) => [
      key,
      value.charAt(0).toUpperCase() + value.slice(1),
    ])
  )
}

/**
 * Unifies the meal plan entries to a common format
 * @param {object[]} entries Meal plan entries
 * @returns {object[]} Unified meal plan entries
 */
export function unifyFoodEntries(entries, version = 'v1') {
  return entries.map((entry) => ({
    timestamp: entry.timestamp,
    meals: entry.meals.map((meal) => {
      return {
        ...unifyMeal(meal, version),
        ...(version === 'v1'
          ? {
              variations: [
                ...(meal.variants || []),
                ...(meal.additions || []),
              ].map((variant) => unifyMeal(variant, version, meal)),
            }
          : {}),
        ...(version !== 'v1'
          ? {
              variants:
                meal.variants?.map((variant) =>
                  unifyMeal(variant, version, meal)
                ) || null,
            }
          : {}),
      }
    }),
  }))
}

/**
 * Unifies a single meal to a common format
 * @param {object} meal
 * @param {parent} [parentMeal] Parent meal (if meal is a variant of another meal)
 * @returns {object} Unified meal
 */
function unifyMeal(meal, version, parentMeal = null) {
  const mealCategory = meal.category || parentMeal?.category || 'main'

  return {
    name: capitalize(meal.name),
    category:
      version !== 'v1' ? standardizeCategory(mealCategory) : mealCategory,
    prices: meal.prices || {
      student: null,
      employee: null,
      guest: null,
    },
    allergens: meal.allergens || null,
    flags: cleanMealFlags(meal.flags),
    nutrition: meal.nutrition || null,
    originalLanguage: meal.originalLanguage || 'de',
    static: meal.static || false,
    restaurant: meal.restaurant || parentMeal?.restaurant || null,
    additional: meal.additional || false,
    ...(version !== 'v1'
      ? {
          id: parentMeal !== null ? `${parentMeal.id}/${meal.id}` : meal.id,
          parent: reduceParentMeal(parentMeal),
        }
      : {}),
  }
}

/**
 * Merges meals with a similar name and same category into one meal with variants (Week entries)
 * @param {object[]} entries
 * @returns {object[]} Merged meals
 */
export function mergeMealVariants(entries) {
  return entries.map((day) => {
    return {
      ...day,
      meals: mergeDayEntries(day.meals),
    }
  })
}

/**
 * Merge meals with a similar name and same category into one meal with variants (Day entries)
 * @param {object[]} dayEntries
 * @returns {object[]} Merged meals
 */
function mergeDayEntries(dayEntries) {
  const variationKeys = dayEntries.map((meal) => {
    const comparingKeys = dayEntries.filter(
      (x) =>
        x.name !== meal.name &&
        x.name.startsWith(meal.name) &&
        x.category === meal.category
    )
    return {
      meal,
      variants: comparingKeys || [],
    }
  })

  const mergedEntries = dayEntries.filter(
    (meal) =>
      !variationKeys
        .map((keys) => keys.variants)
        .flat()
        .map((x) => x.name)
        .includes(meal.name)
  )

  // remove duplicate meals
  const noDuplicates = mergedEntries.filter(
    (meal, index, self) => index === self.findIndex((x) => x.name === meal.name)
  )

  // add variants
  variationKeys
    .filter(({ variants }) => variants.length > 0)
    .forEach(({ meal, variants }) => {
      meal.variants = variants.map((variant) => {
        return {
          ...variant,
          name: cleanMealName(variant.name.replace(meal.name, '').trim()),
          prices: Object.fromEntries(
            Object.entries(variant.prices).map(([key, value]) => [
              key,
              value - meal.prices[key],
            ])
          ),
          additional: true,
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
function cleanMealName(name) {
  return name
    .split(' ')
    .filter((x) => !stopWords.de.includes(x))
    .join(' ')
}

/**
 * Converts the given meal name and day to a pseudo-unique hash
 * @param {*} day Day in ISO format
 * @param {*} mealName Meal name
 * @returns {string} Meal hash (starts with a short version of the day and ends with a short hash of the meal name)
 */
export function getMealHash(day, mealName) {
  const dayHash = day.replace(/-/g, '').slice(-2)
  return `${dayHash}${hash(mealName).substring(0, 6)}`
}

/**
 * A function uses with JSON.stringify to set the float precision to 2
 * @param {*} key JSON key
 * @param {*} value JSON value
 * @returns {number} Original value or rounded value
 */
export function jsonReplacer(key, value) {
  if (typeof value === 'number') {
    // if the number is an integer, return the original value
    if (value % 1 === 0) {
      return value
    }

    // round float to 2 decimal places
    return Math.round(value * 100) / 100
  }

  return value
}

/**
 * Checks if the given API version is valid
 * @param {*} version API version
 * @returns {void}
 * @throws {Error} If the given API version is invalid
 * @example checkAPIVersion('1') // OK
 * @example checkAPIVersion('-137') // Error
 */
export function checkFoodAPIVersion(version) {
  if (version && !VERSIONS.includes(version)) {
    throw new Error(
      `Invalid API version: ${version}, valid versions are: ${VERSIONS.join(
        ', '
      )}`
    )
  }
}

/**
 * Only keeps the name, category and id of the given meal
 * @param {*} parentMeal Meal to reduce
 * @returns {object} Reduced meal object
 */
function reduceParentMeal(parentMeal) {
  if (!parentMeal) return null

  return {
    name: parentMeal.name,
    category: parentMeal.category,
    id: parentMeal.id,
  }
}

function standardizeCategory(category) {
  const validCategories = ['main', 'soup', 'salad']

  if (validCategories.includes(category)) {
    return category
  }

  if (category.includes('Suppe')) {
    return 'soup'
  }

  if (category.includes('Salat')) {
    return 'salad'
  }

  return 'main'
}
