import cheerio from 'cheerio'

import { addWeek, getDays, getWeek } from '../../lib/date-utils'
import { checkFoodAPIVersion, getMealHash, jsonReplacer, unifyFoodEntries } from '../../lib/backend-utils/food-utils'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'
import staticMeals from '../../data/reimanns-meals.json'
import { translateMeals } from '../../lib/backend-utils/translation-utils'

const CACHE_TTL = 10 * 60 * 1000 // 10m
const URL = 'http://reimanns.in/mittagsgerichte-wochenkarte/'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Sends a HTTP response as JSON.
 * @param {object} res Next.js response object
 * @param {number} status HTTP status code
 * @param {object} body Response body
 */
function sendJson (res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(value, jsonReplacer))
}

function toNum2 (text) {
  return Number(text.toString().trim()).toString().padStart(2, '0')
}

export default async function handler (req, res) {
  const version = req.query.version || 'v1'
  try {
    checkFoodAPIVersion(version)
  } catch (e) {
    sendJson(res, 400, e.message)
    return
  }

  try {
    const data = await cache.get(`reimanns-${version}`, async () => {
      const resp = await fetch(URL)
      const body = await resp.text()
      if (resp.status !== 200) {
        throw new Error('Reimanns data not available')
      }

      const $ = cheerio.load(body)
      const year = (new Date()).getFullYear()

      const lines = Array.from($('.entry-content').children()).flatMap(el_ => {
        const el = $(el_)

        // see https://github.com/cheeriojs/cheerio/issues/839
        const html = el.html().replace(/<br\s*\/?>/gi, '___newline___')
        const content = cheerio.load(html).text().replace(/___newline___/g, '\n').trim()

        return content.split('\n')
      })

      // fill in all days (even if they are not on the website to add static meals)
      const [weekStart] = getWeek(new Date())
      const [, nextWeekEnd] = getWeek(addWeek(new Date(), 1))
      const allDays = getDays(weekStart, nextWeekEnd)

      const days = Object.fromEntries(allDays.map(day => [day.toISOString().split('T')[0], []]))

      let day = null
      lines.forEach(content => {
        content = content.trim()
        const dayNameMatch = content.match(/montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag/ui)
        const numberDateMatch = content.match(/(\d{1,2})\.(\d{1,2})/ui)
        if (numberDateMatch) {
          day = `${year}-${toNum2(numberDateMatch[2])}-${toNum2(numberDateMatch[1])}`
          days[day] = []
        } else if (dayNameMatch) {
          const weekDay = [
            'sonntag',
            'montag',
            'dienstag',
            'mittwoch',
            'donnerstag',
            'freitag',
            'samstag'
          ].indexOf(dayNameMatch[0].toLowerCase())

          const date = new Date()
          date.setDate(date.getDate() - date.getDay() + weekDay)
          day = `${date.getFullYear()}-${toNum2(date.getMonth() + 1)}-${toNum2(date.getDate())}`
          days[day] = []
        } else if (/änderungen|sortiment|(jetzt neu)|geöffnet|geschlossen/ui.test(content)) {
          // ignore
        } else if (day && content) {
          days[day].push(content)
        }
      })

      // convert format to the same as /api/mensa
      const mealPlan = Object.keys(days).map(day => ({
        timestamp: day,
        meals: days[day].map(meal => ({
          name: meal,
          id: getMealHash(day, meal),
          category: 'Essen',
          prices: {
            student: 5.5,
            employee: 6.5,
            guest: 7.5
          },
          allergens: null,
          flags: null,
          nutrition: null
        }))
      }))

      const scrapedMeals = await translateMeals(mealPlan)

      // add static meals (no need to translate)
      const hashedStaticMeals = (day) => {
        return staticMeals.map(meal => ({
          ...meal,
          id: getMealHash(day.timestamp, meal.name),
          variants: meal.variants?.map(variant => ({
            ...variant,
            id: getMealHash(day.timestamp, variant.name)
          })),
          additions: meal.additions?.map(addition => ({
            ...addition,
            id: getMealHash(day.timestamp, addition.name)
          }))
        }))
      }

      // TODO: add allergens, flags, nutrition (ask Reimanns for data)
      scrapedMeals.forEach(day => {
        day.meals.push(...hashedStaticMeals(day))
      })

      return unifyFoodEntries(scrapedMeals, version)
    })

    sendJson(res, 200, data)
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed response from the Reimanns website!')
  }
}
