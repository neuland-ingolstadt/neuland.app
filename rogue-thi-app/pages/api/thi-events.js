import cheerio from 'cheerio'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const CACHE_TTL = 60 * 60 * 1000 // 60m
const URL = 'https://www.thi.de/hochschule/veranstaltungen'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function parseDateTimeRange (str) {
  const startOnlyReg = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/
  if (startOnlyReg.test(str)) {
    const [, day, month, year, hour, minute] = str.match(startOnlyReg)
    return {
      begin: new Date(year, month - 1, day, hour, minute),
      end: null
    }
  }

  const singleDayReg = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}) - (\d{2}):(\d{2})$/
  if (singleDayReg.test(str)) {
    const [, day, month, year, startHour, startMinute, endHour, endMinute] = str.match(singleDayReg)
    return {
      begin: new Date(year, month - 1, day, startHour, startMinute),
      end: new Date(year, month - 1, day, endHour, endMinute)
    }
  }

  const multiDayReg = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}) - (\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/
  if (multiDayReg.test(str)) {
    const [
      ,
      startDay, startMonth, startYear, startHour, startMinute,
      endDay, endMonth, endYear, endHour, endMinute
    ] = str.match(multiDayReg)
    return {
      begin: new Date(startYear, startMonth - 1, startDay, startHour, startMinute),
      end: new Date(endYear, endMonth - 1, endDay, endHour, endMinute)
    }
  }

  // could not parse Date
  return {
    begin: null,
    end: null
  }
}

function sendJson (res, code, value) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(value))
}

export default async function handler (req, res) {
  try {
    const data = await cache.get('thi-events', async () => {
      const resp = await fetch(URL)
      const body = await resp.text()
      if (resp.status !== 200) {
        throw new Error('Parking data not available')
      }

      const $ = cheerio.load(body)
      const events = $('.dtstart-container').map((i, el) => {
        const linkEl = $(el).find('a')
        const href = linkEl.attr('href').trim()
        const dateStr = $(el).find('time').text().trim().replace(/\s+/g, ' ')

        return {
          title: linkEl.attr('title').trim(),
          url: href[0] === '/' ? 'https://www.thi.de' + href : href,
          organizer: 'Technische Hochschule Ingolstadt',
          ...parseDateTimeRange(dateStr)
        }
      })

      return Array.from(events)
    })

    sendJson(res, 200, data)
  } catch (e) {
    sendJson(res, 500, e.message)
  }
}
