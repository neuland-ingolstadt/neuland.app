import cheerio from 'cheerio'

import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 10 * 60 * 1000 // 10m
const URL = 'https://www.ingolstadt.de/parken'

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
  res.end(JSON.stringify(value))
}

export default async function handler(req, res) {
  try {
    const data = await cache.get('parking', async () => {
      const resp = await fetch(URL)
      const body = await resp.text()
      if (resp.status !== 200) {
        throw new Error('Parking data not available')
      }

      const $ = cheerio.load(body)
      const lots = $('.parkplatz-anzahl').map((i, el) => ({
        name: $(el).parent().find('.parkplatz-name-kurz').text().trim(),
        available: parseInt($(el).text().trim()),
      }))

      return Array.from(lots)
    })

    sendJson(res, 200, data)
  } catch (e) {
    console.error(e)
    sendJson(
      res,
      500,
      'Unexpected/Malformed response from the Stadt Ingolstadt website!'
    )
  }
}
