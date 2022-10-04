import cheerio from 'cheerio'

import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 10 * 60 * 1000 // 10m
const URL = 'http://reimanns.in/mittagsgerichte-wochenkarte/'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function sendJson (res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(value))
}

function toNum2 (text) {
  return Number(text.toString().trim()).toString().padStart(2, '0')
}

export default async function handler (req, res) {
  try {
    const data = await cache.get('reimanns', async () => {
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

      const days = {}
      let day = null
      lines.map(content => {
        const dayMatch = content.match(/(montag|dienstag|mittwoch|donnerstag|freitag)\s*(\d{1,2}\.\d{1,2})?/ui)
        if (dayMatch) {
          if (dayMatch[2]) {
            const [date, month] = dayMatch[1]
            day = `${year}-${toNum2(month)}-${toNum2(date)}`
            days[day] = []
          } else {
            const weekDays = [
              'sonntag',
              'montag',
              'dienstag',
              'mittwoch',
              'donnerstag',
              'freitag',
              'samstag'
            ]

            const weekDay = weekDays.indexOf(dayMatch[1].toLowerCase())
            if (weekDay === -1) {
              // ignore
              return null
            }

            const date = new Date()
            date.setDate(date.getDate() - date.getDay() + weekDay)

            day = `${date.getFullYear()}-${toNum2(date.getMonth() + 1)}-${toNum2(date.getDate())}`
            days[day] = []
          }
        } else if (/änderungen|sortiment|(jetzt neu)|geöffnet|geschlossen/ui.test(content)) {
          // ignore
        } else if (day && content) {
          days[day].push(content)
        }

        return null // make eslint happy
      })

      // convert format to the same as /api/mensa
      return Object.keys(days).map(day => ({
        timestamp: day,
        meals: days[day].map(meal => ({
          name: meal,
          prices: {
            student: 5.3,
            employee: 5.9,
            guest: 6.3
          },
          allergens: null,
          flags: null
        }))
      }))
    })

    sendJson(res, 200, data)
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed response from the Reimanns website!')
  }
}
