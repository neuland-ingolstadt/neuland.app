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
        if (/(montag|dienstag|mittwoch|donnerstag|freitag)\s*\d{1,2}\.\d{1,2}/ui.test(content)) {
          const [date, month] = content.split(' ')[1].split('.')
          day = `${year}-${month.trim()}-${date.trim()}`
          days[day] = []
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
