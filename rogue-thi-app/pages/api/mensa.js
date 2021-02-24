import xmljs from 'xml-js'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'
import { formatISODate } from '../../lib/date-utils'

const CACHE_TTL = 60 * 60 * 1000
const CACHE_HEADER = 'max-age=3600'
const URL_DE = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml'
const URL_EN = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/en/mensa-ingolstadt.xml'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function parseDataFromXml (xml) {
  const sourceData = xmljs.xml2js(xml, { compact: true })
  const now = new Date()

  let sourceDays = sourceData.speiseplan.tag
  if (!sourceDays) {
    return []
  } else if (!Array.isArray(sourceDays)) {
    sourceDays = [sourceDays]
  }

  const days = sourceDays.map(day => {
    const date = new Date(day._attributes.timestamp * 1000)

    if (now - date > 24 * 60 * 60 * 1000) {
      return null
    }

    let sourceItems = day.item
    if (!Array.isArray(sourceItems)) {
      sourceItems = [sourceItems]
    }

    const addInReg = /\s*\((.*?)\)\s*/
    const meals = sourceItems.map(item => {
      let text = item.title._text
      const allergens = new Set()
      while (addInReg.test(text)) {
        const [addInText, addIn] = text.match(addInReg)
        text = text.replace(addInText, ' ')

        const newAllergens = addIn.split(',')
        newAllergens.forEach(newAll => allergens.add(newAll))
      }

      const prices = [
        item.preis1._text,
        item.preis2._text,
        item.preis3._text
      ]
        .map(x => parseFloat(x.replace(',', '.')))

      return {
        name: text.trim(),
        prices,
        allergens: [...allergens]
      }
    })

    return {
      timestamp: formatISODate(date),
      meals
    }
  })

  return days.filter(x => x !== null)
}

async function fetchPlan (lang) {
  const url = (lang || 'de') === 'de' ? URL_DE : URL_EN

  const plan = await cache.get(lang, async () => {
    const resp = await fetch(url)
    return parseDataFromXml(await resp.text())
  })

  return plan
}

export default async function handler (req, res) {
  const plan = await fetchPlan(req.query.lang)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', CACHE_HEADER)
  res.end(JSON.stringify(plan))
}
