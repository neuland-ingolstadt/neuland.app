import MemoryCache from '../../lib/memory-cache'

const CACHE_TTL = 60 * 1000
const MIN_REGEX = /(\d+) min/
const URLS = {
  zob: 'https://www.invg.de/rt/getRealtimeData.action?stopPoint=32&station=IN-ZOB&sid=439'
}

const cache = new MemoryCache({ ttl: CACHE_TTL })

/**
 * Parses relative timestamps such as '0' or '5 min'.
 */
function parseDepartureTime (str) {
  let delta
  if (str === '0') {
    delta = 0
  } else if (MIN_REGEX.test(str)) {
    const [, minutes] = str.match(MIN_REGEX)
    delta = parseInt(minutes) * 60000
  }

  const date = new Date(Date.now() + delta)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

export default async function handler (req, res) {
  const station = req.query.station

  let data = cache.get(station)
  if (!data) {
    const resp = await fetch(URLS[req.query.station], {
      headers: { Accept: 'application/json' } // required so that the backend returns proper utf-8
    })
    const { departures } = await resp.json()

    data = departures.map(departure => ({
      route: departure.route,
      destination: departure.destination,
      time: parseDepartureTime(departure.strTime)
    }))

    cache.set(station, data)
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}
