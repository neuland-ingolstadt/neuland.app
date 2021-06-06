/**
 * @file Scrapes events from the `Campus Life` Moodle course and serves them at `/api/events`.
 */

import cheerio from 'cheerio'
import nodeFetch from 'node-fetch'
import fetchCookie from 'fetch-cookie/node-fetch'
import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const MONTHS = { Januar: 1, Februar: 2, März: 3, April: 4, Mai: 5, Juni: 6, Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12 }

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h
const LOGIN_URL = 'https://moodle.thi.de/login/index.php'
const EVENT_LIST_URL = 'https://moodle.thi.de/mod/dataform/view.php?id=162869'
const EVENT_DETAILS_PREFIX = 'https://moodle.thi.de/mod/dataform/view.php'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

function parseLocalDateTime (str) {
  const [, day, month, year, hour, minute] = str.match(/, (\d+). (\w+) (\d+), (\d+):(\d+)$/)
  return new Date(
    year,
    MONTHS[month] - 1,
    day,
    hour,
    minute
  )
}

/**
 * Fetches a login XSRF token.
 */
async function fetchToken (fetch) {
  const resp = await fetch(LOGIN_URL)
  const $ = cheerio.load(await resp.text())

  return $('input[name=logintoken]').val()
}

/**
 * Logs into Moodle.
 */
async function login (fetch, username, password) {
  const data = new URLSearchParams()
  data.append('anchor', '')
  data.append('logintoken', await fetchToken(fetch))
  data.append('username', username)
  data.append('password', password)

  const resp = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data.toString()
  })
  const $ = cheerio.load(await resp.text())

  if (!$('#usermenu').length) {
    throw new Error('Login failed')
  }
}

/**
 * Fetch a list of event URLs.
 */
async function getEventList (fetch) {
  const resp = await fetch(EVENT_LIST_URL)
  const $ = cheerio.load(await resp.text())

  // get links from content table
  const links = $('.entriesview a.menu-action').get()
  // extract href attributes
  return links.map(elem => $(elem).attr('href'))
}

/**
 * Fetches event details from an event URL.
 */
async function getEventDetails (fetch, url) {
  // check URL just to make sure we're not fetching the wrong thing
  if (!url.startsWith(EVENT_DETAILS_PREFIX)) {
    throw new Error('Invalid URL')
  }

  const resp = await fetch(url)
  const $ = cheerio.load(await resp.text())

  // get rows from content table
  const rows = $('.entry tr:not(.lastrow)').get()
  // get two columns and map into object
  return Object.fromEntries(rows.map(elem => {
    return [$(elem).find('.c0 > b').text().trim(), $(elem).find('.c1').text().trim()]
  }))
}

/**
 * Fetches all event details from Moodle.
 */
export async function getAllEventDetails (username, password) {
  // create a fetch method that keeps cookies
  const fetch = fetchCookie(nodeFetch)

  await login(fetch, username, password)

  const events = []
  for (const url of await getEventList(fetch)) {
    const details = await getEventDetails(fetch, url)
    // do not include location and description
    // since it may contain sensitive information
    events.push({
      organizer: details.Verein,
      title: details.Event,
      begin: details.Start ? parseLocalDateTime(details.Start) : null,
      end: details.Ende ? parseLocalDateTime(details.Ende) : null
    })
  }
  return events
}

function sendJson (res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default async function handler (req, res) {
  try {
    const username = process.env.MOODLE_USERNAME
    const password = process.env.MOODLE_PASSWORD

    if (username && password) {
      const plan = await cache.get('events', async () => await getAllEventDetails(username, password))
      sendJson(res, 200, plan)
    } else {
      sendJson(res, 500, 'Moodle credentials not configured')
    }
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed response from Moodle!')
  }
}
