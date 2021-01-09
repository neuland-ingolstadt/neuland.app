import xmljs from 'xml-js'
import MemoryCache from '../../lib/memory-cache'

const CACHE_TTL = 60 * 60 * 1000
const URL_DE = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml'
const URL_EN = 'https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/en/mensa-ingolstadt.xml'

const cache = new MemoryCache({ ttl: CACHE_TTL })

const dayTexts = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
]
function pad2(val) {
  return val.toString().padStart(2, '0')
}
function dateToTHIFormat(date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${pad2(date.getFullYear())}`;
}
function convertToTHIFormat (sourceData) {
  let sourceDays = sourceData.speiseplan.tag
  if(!Array.isArray(sourceDays))
    sourceDays = [sourceDays]
  
  const days = sourceData.speiseplan.tag.map(day => {
    const date = new Date(day._attributes.timestamp * 1000)

    let sourceItems = day.item
    if(!Array.isArray(sourceItems))
      sourceItems = [sourceItems]
    
    const items = {}
    const addInReg = /\s*\((.*?)\)\s*/
    sourceItems.forEach((item, i) => {
      let text = item.title._text
      let addIns = new Set()
      while(addInReg.test(text)) {
        const [addInText, addIn] = text.match(addInReg)
        text = text.replace(addInText, ' ')

        const newAddins = addIn.split(',')
        newAddins.forEach(newAddin => addIns.add(newAddin))
      }

      items[i] = {
        zusatz: [...addIns].join(','),
        name: [
          '',
          text.trim(),
          item.preis1._text,
          item.preis2._text,
          item.preis3._text,
        ]
      }
    })

    return {
      tag: `${dayTexts[date.getDay()]} ${dateToTHIFormat(date)}`,
      gerichte: items,
    }
  })

  const now = new Date()
  return {
    data: days,
    status: 0,
    date: dateToTHIFormat(now),
    time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`,
  }
}

async function fetchPlan (lang) {
  const url = (lang || 'de') === 'de' ? URL_DE : URL_EN

  let plan = cache.get(url)

  if (!plan) {
    const resp = await fetch(url)
    plan = xmljs.xml2js(await resp.text(), { compact: true })
    plan = convertToTHIFormat(plan)

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
