import xmljs from 'xml-js'

import { mergeMealvariants, unifyFoodEntries } from '../../lib/backend-utils/food-utils'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'
import { formatISODate } from '../../lib/date-utils'
import { translateMeals } from '../../lib/backend-utils/translation-utils'

const CACHE_TTL = 60 * 60 * 1000 // 60m
const URL_DE = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml'
// const URL_EN = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/en/mensa-ingolstadt.xml'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Parses a float like "1,5".
 * @returns {number}
 */
function parseGermanFloat (str) {
  return parseFloat(str.replace(',', '.'))
}

/**
 * Parses an XML node containing a float.
 * @returns {number}
 */
function parseXmlFloat (str) {
  return str._text ? parseGermanFloat(str._text) : ''
}

/**
 * Parses the XML meal plan.
 * @returns {object[]}
 */
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
      // sometimes, the title is undefined (see #123)
      let text = item.title._text ?? ''
      const allergens = new Set()
      while (addInReg.test(text)) {
        const [addInText, addIn] = text.match(addInReg)
        text = text.replace(addInText, ' ')

        const newAllergens = addIn.split(',')
        newAllergens.forEach(newAll => allergens.add(newAll))
      }

      // convert 'Suppe 1' -> 'Suppe', 'Essen 3' -> 'Essen', etc.
      const category = item.category._text.split(' ')[0]

      const flags = []
      if (item.piktogramme._text) {
        const matches = item.piktogramme._text.match(/class='infomax-food-icon .*?'/g)
        if (matches) {
          matches.forEach(x => {
            const [, end] = x.split(' ')
            flags.push(end.substr(0, end.length - 1))
          })
        }
      }

      const nutrition = {
        kj: parseXmlFloat(item.kj),
        kcal: parseXmlFloat(item.kcal),
        fat: parseXmlFloat(item.fett),
        fatSaturated: parseXmlFloat(item.gesfett),
        carbs: parseXmlFloat(item.kh),
        sugar: parseXmlFloat(item.zucker),
        fiber: parseXmlFloat(item.ballaststoffe),
        protein: parseXmlFloat(item.eiweiss),
        salt: parseXmlFloat(item.salz)
      }

      return {
        name: text.trim(),
        category,
        prices: {
          student: parseGermanFloat(item.preis1._text),
          employee: parseGermanFloat(item.preis2._text),
          guest: parseGermanFloat(item.preis3._text)
        },
        allergens: [...allergens],
        flags,
        nutrition
      }
    })

    return {
      timestamp: formatISODate(date),
      meals
    }
  })

  return days.filter(x => x !== null)
}

/**
 * Fetches and parses the mensa plan.
 * @returns {object[]}
 */
async function fetchPlan () {
  const plan = await cache.get('mensa', async () => {
    const resp = await fetch(URL_DE)

    if (resp.status === 200) {
      const mealPlan = parseDataFromXml(await resp.text())
      const mergedMeals = mergeMealvariants(mealPlan)
      const translatedMeals = await translateMeals(mergedMeals)
      return unifyFoodEntries(translatedMeals)
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
    const plan = await fetchPlan()
    res.end(JSON.stringify(plan))
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.end(JSON.stringify('Unexpected/Malformed response from the Mensa backend!'))
  }
}
