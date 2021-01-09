import xmljs from 'xml-js'
import MemoryCache from '../../lib/memory-cache'

const CACHE_TTL = 60 * 60 * 1000
const URL_DE = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml'
const URL_EN = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/en/mensa-ingolstadt.xml'

const cache = new MemoryCache({ ttl: CACHE_TTL })

async function fetchPlan (lang) {
  const url = (lang || 'de') === 'de' ? URL_DE : URL_EN

  let plan = cache.get(url)

  if (!plan) {
    const resp = await fetch(url)
    plan = xmljs.xml2js(await resp.text(), { compact: true })

    cache.set(url, plan)
  }

  return plan
}

export default async function handler (req, res) {
  const plan = await fetchPlan(req.query.lang)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(plan))
}
