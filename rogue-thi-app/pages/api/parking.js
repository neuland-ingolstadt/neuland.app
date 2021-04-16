import cheerio from 'cheerio'

import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 60 * 1000
const CACHE_HEADER = 'max-age=60'
const URL = 'https://www.ingolstadt.de/parken'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function sendJson (res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', CACHE_HEADER)
  res.end(JSON.stringify(value))
}

export default async function handler (req, res) {
  try {
    const departures = await cache.get('parking', async () => {
      const resp = await fetch(URL)
      const body = await resp.text()
      const $ = cheerio.load(body)

      const lots = $('.parkplatz-anzahl').map((i, el) => ({
        name: $(el).parent().find('.parkplatz-name-kurz').text().trim(),
        available: parseInt($(el).text().trim())
      }))

      return Array.from(lots)
    })

    sendJson(res, 200, departures)
  } catch (e) {
    sendJson(res, 500, e.message)
  }
}
