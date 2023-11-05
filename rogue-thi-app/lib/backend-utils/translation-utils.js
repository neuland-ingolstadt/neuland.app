import * as deepl from 'deepl-node'
import AsyncMemoryCache from '../cache/async-memory-cache'

const DEEPL_ENDPOINT = process.env.NEXT_PUBLIC_DEEPL_ENDPOINT || ''
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const ENABLE_DEV_TRANSLATIONS = process.env.ENABLE_DEV_TRANSLATIONS === 'true' || false
const DISABLE_FALLBACK_WARNINGS = process.env.DISABLE_FALLBACK_WARNINGS === 'true' || false

const CACHE_TTL = 60 * 60 * 24 * 7 * 1000 // 7 days

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })
const isDev = process.env.NODE_ENV !== 'production'

const translator = DEEPL_API_KEY ? new deepl.Translator(DEEPL_API_KEY) : null
const SOURCE_LANG = 'DE'

/**
 * Gets a translation from the cache or translates it using DeepL.
 * @param {String} text The text to translate
 * @param {String} target The target language
 * @returns {String} The translated text or the original text if DeepL is not configured or returns an error
 **/
async function getTranslation (text, target) {
  return await cache.get(`${text}__${target}`, async () => {
    return await translate(text, target)
  })
}

/**
 * Translates a text using DeepL.
 * @param {String} text The text to translate
 * @param {String} target The target language
 * @returns {String} The translated text
 * @throws {Error} If DeepL is not configured or returns an error
 */
async function translate (text, target) {
  try {
    return (await translator.translateText(text, SOURCE_LANG, target)).text
  } catch (err) {
    console.error(err)
    return isDev && !DISABLE_FALLBACK_WARNINGS ? `FALLBACK: ${text}` : text
  }
}

/**
 * Brings the given meal plan into the correct format as if it was translated by DeepL.
 * @param {Object} meals The meal plan
 * @returns {Object} The translated meal plan
 **/
function translateFallback (meals) {
  return meals.map((day) => {
    const meals = day.meals.map((meal) => {
      return {
        ...meal,
        name: {
          de: meal.name,
          en: isDev && !DISABLE_FALLBACK_WARNINGS ? `FALLBACK: ${meal.name}` : meal.name
        },
        originalLanguage: 'de',
        variations: meal.variations && meal.variations.map((variant) => {
          return {
            ...variant,
            name: {
              de: variant.name,
              en: isDev && !DISABLE_FALLBACK_WARNINGS ? `FALLBACK: ${variant.name}` : variant.name
            }
          }
        })
      }
    })

    return {
      ...day,
      meals
    }
  })
}

/**
 * Translates all meals in the given plan using DeepL.
 * @param {Object} meals The meal plan
 * @returns {Object} The translated meal plan
 */
export async function translateMeals (meals) {
  if (isDev && !ENABLE_DEV_TRANSLATIONS) {
    console.warn('DeepL is disabled in development mode.')
    console.warn('To enable DeepL in development mode, set ENABLE_DEV_TRANSLATIONS=true in your .env.local file.')
    return translateFallback(meals)
  }

  if (!DEEPL_ENDPOINT || !DEEPL_API_KEY || !translator) {
    console.warn('DeepL is not configured.')
    console.warn('To enable DeepL, set the DEEPL_API_KEY in your .env.local file.')
    return translateFallback(meals)
  }

  return await Promise.all(meals.map(async (day) => {
    const meals = await Promise.all(day.meals.map(async (meal) => {
      return {
        ...meal,
        name: {
          de: meal.name,
          en: await getTranslation(meal.name, 'EN-GB')
        },
        variations: meal.variations && await Promise.all(meal.variations.map(async (variant) => {
          return {
            ...variant,
            name: {
              de: variant.name,
              en: await getTranslation(variant.name, 'EN-GB')
            }
          }
        })),
        originalLanguage: 'de'
      }
    }))

    return {
      ...day,
      meals
    }
  }))
}
