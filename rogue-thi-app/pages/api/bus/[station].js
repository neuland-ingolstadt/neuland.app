import AsyncMemoryCache from '../../../lib/cache/async-memory-cache'

import stations from '../../../data/mobility.json'

const CACHE_TTL = 60 * 1000
const MIN_REGEX = /(\d+) min/
const URLS = Object.fromEntries(stations.bus.stations.map((x) => [x.id, x.url]))

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Parses a relative timestamp such as '0' or '5 min'
 */
function parseDepartureTime(str) {
  let delta
  if (str === '0') {
    delta = 0
  } else if (MIN_REGEX.test(str)) {
    const [, minutes] = str.match(MIN_REGEX)
    delta = parseInt(minutes) * 60000
  }

  // round up by adding one minute and then rounding down
  const date = new Date(Date.now() + delta + 60000)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

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
  const station = req.query.station
  if (!URLS.hasOwnProperty(station)) {
    sendJson(res, 400, 'Unknown station')
    return
  }

  try {
    const departures = await cache.get(station, async () => {
      const resp = await fetch(URLS[station], {
        headers: { Accept: 'application/json' }, // required so that the backend returns proper utf-8
      })
      const body = await resp.text()

      if (resp.status === 200) {
        // sometimes, the API will return malformed JSON that can not be parsed by node
        if (body === '{ error: true }') {
          throw new Error('Departure times not available')
        }

        const { departures } = JSON.parse(body)
        return departures.map((departure) => ({
          route: departure.route,
          destination: departure.destination,
          time: parseDepartureTime(departure.strTime),
        }))
      } else {
        throw new Error('Data source returned an error: ' + body)
      }
    })

    sendJson(res, 200, departures)
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed response from the INVG backend!')
  }
}
