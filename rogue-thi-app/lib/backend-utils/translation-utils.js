import AsyncMemoryCache from '../cache/async-memory-cache'

const DEEPL_ENDPOINT = process.env.NEXT_PUBLIC_DEEPL_ENDPOINT || ''
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''

const CACHE_TTL = 60 * 60 * 24 * 1000// 24h

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Gets a translation from the cache or translates it using DeepL.
 * @param {String} text The text to translate
 * @param {String} target The target language
 * @returns {String} The translated text
 * @throws {Error} If DeepL is not configured or returns an error
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
  if (!DEEPL_ENDPOINT || !DEEPL_API_KEY) {
    console.error('DeepL is not configured. Please set DEEPL_ENDPOINT and DEEPL_API_KEY in your .env.local file. Using fallback translation.')
    return `(TRANSLATION_PLACEHOLDER) ${text}`
  }

  const resp = await fetch(`${DEEPL_ENDPOINT}`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `text=${encodeURI(text)}&target_lang=${target}`
    })

  if (resp.status === 200) {
    const result = await resp.json()
    return result.translations.map(x => x.text)[0]
  } else {
    throw new Error('DeepL returned an error: ' + await resp.text())
  }
}

/**
 * Translates all meals in the given plan using DeepL.
 * @param {Object} meals The meal plan
 * @returns {Object} The translated meal plan
 */
export async function translateMeals (meals) {
  return await Promise.all(meals.map(async (day) => {
    const meals = await Promise.all(day.meals.map(async (meal) => {
      return {
        ...meal,
        name: {
          de: meal.name,
          en: await getTranslation(meal.name, 'EN')
        },
        originalLanguage: 'de'
      }
    }))

    return {
      ...day,
      meals
    }
  }))
}
