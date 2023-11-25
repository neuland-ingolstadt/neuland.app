import { USER_EMPLOYEE, USER_GUEST, USER_STUDENT } from './hooks/user-kind'
import { faBowlFood, faBurger, faSeedling } from '@fortawesome/free-solid-svg-icons'
import { getAdjustedLocale } from './locale-utils'

/**
   * Checks whether the user should be allergens.
   * @param {string[]} allergens Selected allergens
   * @returns {boolean}
   */
export function containsSelectedAllergen (allergens, allergenSelection) {
  if (!allergens) {
    return false
  }
  return allergens.some(x => allergenSelection[x])
}

export function containsSelectedPreference (flags, preferencesSelection) {
  if (!flags) {
    return false
  }
  return flags.some(x => preferencesSelection[x])
}

/**
   * Formats a weight in grams.
   * @param {number} x Weight
   * @returns {string}
   */
export function formatGram (x) {
  return x ? `${formatFloat(x)} g` : x
}

/**
   * Formats a float for the current locale.
   * @param {number} x
   * @returns {string}
   */
export function formatFloat (x) {
  return (new Intl.NumberFormat(getAdjustedLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })).format(x)
}

/**
   * Formats a price in euros.
   * @param {number} x Price
   * @returns {string}
   */
export function formatPrice (x) {
  return x?.toLocaleString(getAdjustedLocale(), { style: 'currency', currency: 'EUR' })
}

/**
 * Returns the flags given for a meal which match to the users preferences.
 * @param {*} meal
 * @param {*} preferencesSelection
 * @param {*} flagMap
 * @param {*} currentLocale
 * @returns {string[]} flags
 */
export function getMatchingPreferences (meal, preferencesSelection, flagMap, currentLocale) {
  return meal.flags && meal.flags.filter(x => preferencesSelection[x] || ['veg', 'V'].includes(x))?.map(x => flagMap[x]?.[currentLocale])
}

/**
 * Returns the allergens for a meal which match to the users allergens.
 * @param {*} meal
 * @param {*} allergenSelection
 * @param {*} allergenMap
 * @param {*} currentLocale
 * @returns {string[]} flags
 */
export function getMatchingAllergens (meal, allergenSelection, allergenMap, currentLocale) {
  return meal.allergens && meal.allergens.filter(x => allergenSelection[x]).map(x => allergenMap[x]?.[currentLocale])
}

/**
 * Returns the adjusted locale for the food locale. If the food locale is not set, the first language of the i18n object is used. Else use the users preferred language for food.
 * @param {*} selectedLanguageFood
 * @param {*} i18n
 * @returns {string} adjusted locale (e.g. 'de')
 */
export function getAdjustedFoodLocale (selectedLanguageFood, i18n) {
  return (selectedLanguageFood && selectedLanguageFood !== 'default') ? selectedLanguageFood : i18n.languages[0]
}

/**
   * Formats a price according to the users group (student, employee or guest).
   * @param {object} meal Parsed meal object
   * @returns {string}
   */
export function getUserSpecificPrice (meal, userKind) {
  const prices = {
    [USER_GUEST]: meal.prices.guest,
    [USER_EMPLOYEE]: meal.prices.employee,
    [USER_STUDENT]: meal.prices.student
  }
  return formatPrice(prices[userKind])
}

export function getCategoryIcon (meal) {
  switch (meal.category) {
    case 'soup':
      return faBowlFood
    case 'salad':
      return faSeedling
    default:
      return faBurger
  }
}
