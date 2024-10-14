import NeulandAPI from '../../lib/backend/neuland-api'
import ical from 'ical-generator'

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
  function isCalRequest() {
    const accept = req.headers.accept || ''
    const format = req.query.format || 'json'
    return accept.includes('text/calendar') || format === 'ical'
  }

  const plan = await NeulandAPI.getCampusLifeEvents()

  if (isCalRequest()) {
    const cal = ical({ name: 'Campus Life' })
      .timezone('Europe/Berlin')
      .ttl(60 * 60 * 24)
    for (const event of plan.clEvents) {
      const start = new Date(Number(event.begin))

      // discard the end if it is before the start
      const end =
        event.end > event.begin ? new Date(Number(event.end)) : undefined

      cal.createEvent({
        id: event.id,
        summary: event.title,
        description: `Veranstalter: ${event.organizer}`,
        start,
        end,
      })
    }
    sendCalendar(res, 200, cal)
    return
  }

  sendJson(res, 200, [
    {
      id: 'deprecation',
      organizer: 'Neuland e.V.',
      title: 'Neuland REST API is deprecated',
      begin: '2024-01-01T00:00:00.000Z',
      end: '2026-01-01T00:00:00.000Z',
      location: null,
    },
  ])
}
