import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 60 * 1000
const CACHE_HEADER = 'max-age=60'
const MIN_REGEX = /(\d+) min/
const URLS = {
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

  const date = new Date(Date.now() + delta)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

export default async function handler (req, res) {
  const station = req.query.station

  const departures = await cache.get(station, async () => {
    const resp = await fetch(URLS[station], {
      headers: { Accept: 'application/json' } // required so that the backend returns proper utf-8
    })
    const { departures } = await resp.json()

    return departures.map(departure => ({
      route: departure.route,
      destination: departure.destination,
      time: parseDepartureTime(departure.strTime)
    }))
  })

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', CACHE_HEADER)
  res.end(JSON.stringify(departures))
}
