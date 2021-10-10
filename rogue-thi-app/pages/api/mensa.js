import xmljs from 'xml-js'

import AsyncMemoryCache from '../../lib/cache/async-memory-cache'
import { formatISODate } from '../../lib/date-utils'

const CACHE_TTL = 60 * 60 * 1000 // 60m
const URL_DE = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml'
const URL_EN = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/en/mensa-ingolstadt.xml'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function parseGermanFloat (str) {
  return parseFloat(str.replace(',', '.'))
}

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

      return {
        name: text.trim(),
        prices: {
          student: parseGermanFloat(item.preis1._text),
          employee: parseGermanFloat(item.preis2._text),
          guest: parseGermanFloat(item.preis3._text)
        },
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
  if (lang && lang !== 'de' && lang !== 'en') {
    throw new Error('unknown/unsupported language')
  }

  const url = lang && lang === 'en' ? URL_EN : URL_DE

  const plan = await cache.get(lang, async () => {
    const resp = await fetch(url)

    if (resp.status === 200) {
      return parseDataFromXml(await resp.text())
    } else {
      throw new Error('Data source returned an error: ' + await resp.text())
    }
  })

  return plan
}

export default async function handler (req, res) {
  res.setHeader('Content-Type', 'application/json')

  try {
    res.statusCode = 200
    const plan = await fetchPlan(req.query.lang)
    res.end(JSON.stringify(plan))
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.end(JSON.stringify('Unexpected/Malformed response from the Mensa backend!'))
  }
}
