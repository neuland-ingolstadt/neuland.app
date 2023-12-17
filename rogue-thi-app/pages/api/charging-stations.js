import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 60 * 1000 // 1m
const URL =
  'https://app.chargecloud.de/emobility:ocpi/7d25c525838f55d21766c0dfee5ad21f/app/2.0/locations?swlat=48.7555&swlng=11.4146&nelat=48.7767&nelng=11.4439'

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
    const data = await cache.get('charging-stations', async () => {
      const resp = await fetch(URL)
      const data = await resp.json()
      if (resp.status !== 200) {
        throw new Error('Charging station data not available')
      }

      return data.data.map((entry) => ({
        id: entry.id,
        name: entry.name.trim(),
        address: entry.address,
        city: entry.city,
        latitude: entry.coordinates.latitude,
        longitude: entry.coordinates.longitude,
        available: entry.evses.filter((x) => x.status === 'AVAILABLE').length,
        total: entry.evses.length,
      }))
    })

    sendJson(res, 200, data)
  } catch (e) {
    console.error(e)
    sendJson(
      res,
      500,
      'Unexpected/Malformed response from the Chargecloud backend!'
    )
  }
}
