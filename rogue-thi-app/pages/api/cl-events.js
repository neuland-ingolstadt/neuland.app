/**
 * @file Scrapes events from the `Campus Life` Moodle course and serves them at `/api/events`.
 */

import cheerio from 'cheerio'
import crypto from 'crypto'
import fetchCookie from 'fetch-cookie'
import fs from 'fs/promises'
import ical from 'ical-generator'
import nodeFetch from 'node-fetch'

import AsyncMemoryCache from '../../lib/cache/async-memory-cache'

const MONTHS = {
  Januar: 1,
  Februar: 2,
  März: 3,
  April: 4,
  Mai: 5,
  Juni: 6,
  Juli: 7,
  August: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Dezember: 12,
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h
const LOGIN_URL = 'https://moodle.thi.de/login/index.php'
const EVENT_LIST_URL = 'https://moodle.thi.de/mod/dataform/view.php?id=162869'
const EVENT_DETAILS_PREFIX = 'https://moodle.thi.de/mod/dataform/view.php'
const EVENT_STORE = `${process.env.STORE}/cl-events.json`

const isDev = process.env.NODE_ENV === 'development'

const cache = new AsyncMemoryCache({ ttl: CACHE_TTL })

/**
 * Parses a date like "Donnerstag, 15. Juni 2023, 10:00".
 * @param {string} str
 * @returns {Date}
 */
function parseLocalDateTime(str) {
  // use \p{Letter} because \w doesnt match umlauts
  // https://stackoverflow.com/a/70273329
  const [, day, month, year, hour, minute] = str.match(
    /, (\d+). (\p{Letter}+) (\d+), (\d+):(\d+)$/u
  )
  return new Date(year, MONTHS[month] - 1, day, hour, minute)
}

/**
 * Load persisted events from disk.
 * @returns {object[]}
 */
async function loadEvents() {
  return JSON.parse(await fs.readFile(EVENT_STORE)).map((event) => ({
    ...event,
    begin: new Date(event.begin),
    end: new Date(event.end),
  }))
}

/**
 * Persist events to disk.
 * @param {object[]} events
 */
async function saveEvents(events) {
  await fs.writeFile(EVENT_STORE, JSON.stringify(events))
}

/**
 * Fetches a login XSRF token.
 * @param {object} fetch Cookie-aware implementation of `fetch`
 */
async function fetchToken(fetch) {
  const resp = await fetch(LOGIN_URL)
  const $ = cheerio.load(await resp.text())

  return $('input[name=logintoken]').val()
}

/**
 * Logs into Moodle.
 * @param {object} fetch Cookie-aware implementation of `fetch`
 * @param {string} username
 * @param {string} password
 */
async function login(fetch, username, password) {
  const data = new URLSearchParams()
  data.append('anchor', '')
  data.append('logintoken', await fetchToken(fetch))
  data.append('username', username)
  data.append('password', password)

  const resp = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
  })
  const $ = cheerio.load(await resp.text())

  if ($('#loginerrormessage').length) {
    throw new Error('Login failed')
  }
}

/**
 * Fetch a list of event URLs.
 * @param {object} fetch Cookie-aware implementation of `fetch`
 * @returns {string[]}
 */
async function getEventList(fetch) {
  const resp = await fetch(EVENT_LIST_URL)
  const $ = cheerio.load(await resp.text())

  // get links from content table
  const links = $('.entriesview a.menu-action').get()
  // extract href attributes
  return links.map((elem) => $(elem).attr('href'))
}

/**
 * Fetches event details from an event URL.
 * @param {object} fetch Cookie-aware implementation of `fetch`
 * @param {string} url
 */
async function getEventDetails(fetch, url) {
  // check URL just to make sure we're not fetching the wrong thing
  if (!url.startsWith(EVENT_DETAILS_PREFIX)) {
    throw new Error('Invalid URL')
  }

  const resp = await fetch(url)
  const $ = cheerio.load(await resp.text())

  // get rows from content table
  const rows = $('.entry tr:not(.lastrow)').get()
  // get two columns and map into object
  return Object.fromEntries(
    rows.map((elem) => {
      return [
        $(elem).find('.c0').text().trim().replace(/:$/, ''),
        $(elem).find('.c1').text().trim().replace(/:$/, ''),
      ]
    })
  )
}

/**
 * Fetches all event details from Moodle.
 * @param {string} username
 * @param {string} password
 */
export async function getAllEventDetails(username, password) {
  // create a fetch method that keeps cookies
  const fetch = fetchCookie(nodeFetch)

  await login(fetch, username, password)

  const eventUrls = await getEventList(fetch)
  const eventPromises = eventUrls.map(async (url) => {
    const details = await getEventDetails(fetch, url)

    // only include location if approved by the organizer
    return {
      id: crypto.createHash('sha256').update(url).digest('hex'),
      organizer: details.Verein.trim().replace(/( \.)$/g, ''),
      title: details.Event,
      begin: details.Start ? parseLocalDateTime(details.Start) : null,
      end: details.Ende ? parseLocalDateTime(details.Ende) : null,
      location:
        details['Veröffentlichung des Ortes & Bescheibung in Apps']
          .trim()
          .toLowerCase() === 'ja'
          ? details.Ort
          : null,
    }
  })

  const remoteEvents = await Promise.all(eventPromises)

  const now = new Date()
  let events = !isDev ? await loadEvents() : []

  if (remoteEvents.length > 0) {
    // remove all events which disappeared from the server
    // this will not work if the first event gets removed
    const remoteStart = remoteEvents
      .map((event) => event.begin)
      .reduce((a, b) => (a < b ? a : b))
    events = events.filter((a) => a.begin < remoteStart).concat(remoteEvents)
  }

  events = events.filter(
    (event) => new Date(event.begin) > now || new Date(event.end) > now
  )
  events = events
    .sort((a, b) => a.end - b.end)
    .sort((a, b) => a.begin - b.begin)

  // we need to persist the events because they disappear on monday
  // even if the event has not passed yet
  if (!isDev) {
    await saveEvents(events)
  }

  return events
}

/**
 * Sends a HTTP response as JSON.
 * @param {object} res Next.js response object
 * @param {number} status HTTP status code
 * @param {object} body Response body
 */
function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/**
 * Sends a HTTP response as iCal.
 * @param {object} res Next.js response object
 * @param {number} status HTTP status code
 * @param {object} body Response body
 */
function sendCalendar(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/calendar')
  res.end(body.toString())
}

export default async function handler(req, res) {
  try {
    const username = process.env.MOODLE_USERNAME
    const password = process.env.MOODLE_PASSWORD

    if (username && password) {
      const plan = await cache.get(
        'events',
        async () => await getAllEventDetails(username, password)
      )
      const format = req.query.format ?? 'json'

      if (format === 'json') {
        sendJson(res, 200, plan)
      } else if (format === 'ical') {
        const cal = ical({ name: 'Campus Life' })
          .timezone('Europe/Berlin')
          .ttl(60 * 60 * 24)
        for (const event of plan) {
          cal.createEvent({
            id: event.id,
            summary: event.title,
            description: `Veranstalter: ${event.organizer}`,
            start: event.begin,
            // discard the end if it is before the start
            end: event.end > event.begin ? event.end : undefined,
          })
        }
        sendCalendar(res, 200, cal)
      }
    } else {
      sendJson(res, 500, 'Moodle credentials not configured')
    }
  } catch (e) {
    console.error(e)
    sendJson(res, 500, 'Unexpected/Malformed response from Moodle!')
  }
}
