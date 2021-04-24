import AsyncMemoryCache from '../../../lib/cache/async-memory-cache'

const CACHE_TTL = 60 * 1000
const CACHE_HEADER = 'max-age=60'
const MIN_REGEX = /(\d+) min/
const URLS = {
  hochschule: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=2&station=IN-THoScu&sid=413',
  zob: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=32&station=IN-ZOB&sid=439',
  rathausplatz: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=1&station=IN-Ratha&sid=337',
  stadttheater: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=2&station=IN-SThea&sid=397',
  heydeckstrasse: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=1&station=IN-Heyde&sid=247',
  fruehlingstrasse: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=2&station=IN-Fr__ue__hl&sid=211',
  rechbergstrasse: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=2&station=IN-Rechb&sid=339'
}

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Parses a relative timestamp such as '0' or '5 min'
 */
function parseDepartureTime (str) {
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

function sendJson (res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', CACHE_HEADER)
  res.end(JSON.stringify(value))
}

export default async function handler (req, res) {
  const station = req.query.station
  if (!URLS.hasOwnProperty(station)) {
    sendJson(res, 400, 'Unknown station')
    return
  }

  try {
    const departures = await cache.get(station, async () => {
      const resp = await fetch(URLS[station], {
        headers: { Accept: 'application/json' } // required so that the backend returns proper utf-8
      })
      const body = await resp.text()

      if (resp.status === 200) {
        // sometimes, the API will return malformed JSON that can not be parsed by node
        if (body === '{ error: true }') {
          throw new Error('Departure times not available')
        }

        const { departures } = JSON.parse(body)
        return departures.map(departure => ({
          route: departure.route,
          destination: departure.destination,
          time: parseDepartureTime(departure.strTime)
        }))
      } else {
        throw new Error('Data source returned an error: ' + body)
      }
    })

    sendJson(res, 200, departures)
  } catch (e) {
    sendJson(res, 500, e.message)
  }
}
