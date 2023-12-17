import {
  checkFoodAPIVersion,
  getMealHash,
  jsonReplacer,
  mergeMealVariants,
  unifyFoodEntries,
} from '../../lib/backend-utils/food-utils'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'
import { translateMeals } from '../../lib/backend-utils/translation-utils'

const pdf = require('pdf-parse')

const CACHE_TTL = 60 * 60 * 1000 // 60m
const URL = 'http://www.canisiusstiftung.de/upload/speiseplan.pdf'

const TITLE_REGEX = /[A-Z][a-z]*, den [0-9]{1,2}.[0-9]{1,2}.[0-9]{4}/gm
const DATE_REGEX = /[0-9]{1,2}.[0-9]{1,2}.[0-9]{4}/gm
const NEW_LINE_REGEX = /(?:\r\n|\r|\n)/g
const DISH_SPLITTER_REGEX =
  /\s+€[ ]{1,}[0-9]+.[0-9]+\s+€[ ]{1,}[0-9]+.[0-9]+\s+€[ ]{1,}[0-9]+.[0-9]+\s*/g
const PRICE_REGEX = /(?!€)(?! )+[\d.]+/g

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Sends a HTTP response as JSON.
 * @param {object} res Next.js response object
 * @param {number} status HTTP status code
 * @param {object} body Response body
 */
function sendJson(res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(value, jsonReplacer))
}

function getPrices(text) {
  return text.match(PRICE_REGEX)?.map((price) => parseFloat(price)) ?? []
}

function getPdf() {
  const http = require('http')
  // http get request to retrieve the PDF file from the url
  // chunk data to databuffer and return that
  return new Promise((resolve, reject) => {
    http
      .get(URL, (res) => {
        const data = []
        res.on('data', (chunk) => {
          data.push(chunk)
        })

        res.on('end', () => {
          resolve(Buffer.concat(data))
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

function getDateFromTitle(title) {
  const date = title.match(DATE_REGEX)[0].split('.')
  // return date in format YYYY-MM-DD
  return `${date[2]}-${date[1]}-${date[0]}`
}

function getMealsFromBlock(text) {
  const dayDishes = text.trim().split(DISH_SPLITTER_REGEX).slice(0, -1)
  const prices = (text.match(DISH_SPLITTER_REGEX) ?? []).map((price) =>
    getPrices(price)
  )

  return dayDishes.map((dish, index) => {
    const dishPrices = prices[index]
    return {
      name: dish.trim(),
      prices: {
        /**
         * There are three different prices for each dish:
         * 1. internal student price => not used for THI students
         * 2. external student price => used for THI students
         * 3. guest price => used for guests and THI employees
         */
        student: dishPrices[1],
        employee: dishPrices[2],
        guest: dishPrices[2],
      },
    }
  })
}

/**
 * Fetches the Canisius meal plan.
 * @param {*} version API version
 * @returns {object[]}
 */
export async function getCanisiusPlan(version) {
  const pdfBuffer = await getPdf()
  const mealPlan = await pdf(pdfBuffer).then(function (data) {
    const text = data.text.replace(NEW_LINE_REGEX, ' ')

    let days = text.split(TITLE_REGEX)
    const dates = text.match(TITLE_REGEX).map(getDateFromTitle)

    if (!days || !dates) {
      throw new Error('Unexpected/Malformed pdf from the Canisius website!')
    }

    // keep days only
    days = days.slice(1, 6)

    // split last day into friday and weekly salad menu
    const fridaySaladSplit = days[4].split('Salate der Saison vom Büfett')

    days[4] = fridaySaladSplit[0]

    const salads = getMealsFromBlock(fridaySaladSplit[1])

    // trim whitespace and split into dishes
    const dishes = days.map(getMealsFromBlock)
    return dishes.map((day, index) => {
      const dayDishes = day.map((dish) => ({
        name: dish.name,
        id: getMealHash(dates[index], dish.name),
        category: 'Essen',
        prices: dish.prices,
        allergens: null,
        flags: null,
        nutrition: null,
        restaurant: 'canisius',
      }))

      const daySalads = salads.map((salad) => ({
        name: salad.name,
        id: getMealHash(dates[index], salad.name),
        originalLanguage: 'de',
        category: 'Salat',
        prices: salad.prices,
        allergens: null,
        flags: null,
        nutrition: null,
        restaurant: 'canisius',
      }))

      return {
        timestamp: dates[index],
        meals: dayDishes.length > 0 ? [...dayDishes, ...daySalads] : [],
      }
    })
  })

  const mergedMeal = mergeMealVariants(mealPlan)
  const translatedMeals = await translateMeals(mergedMeal)
  return unifyFoodEntries(translatedMeals, version)
}

export default async function handler(req, res) {
  const version = req.query.version || 'v1'

  try {
    checkFoodAPIVersion(version)
  } catch (e) {
    sendJson(res, 400, e.message)
    return
  }

  try {
    const data = await cache.get(`canisius-${version}`, async () => {
      return await getCanisiusPlan(version)
    })

    sendJson(res, 200, data)
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed pdf from the Canisius website!')
  }
}
