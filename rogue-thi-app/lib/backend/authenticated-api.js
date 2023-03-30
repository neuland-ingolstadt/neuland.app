import { APIError, AnonymousAPIClient } from './anonymous-api'
import { callWithSession } from './thi-session-handler'

import courseShortNames from '../../data/course-short-names.json'
import roomDistances from '../../data/room-distances.json'

const KEY_GET_PERSONAL_DATA = 'getPersonalData'
const KEY_GET_TIMETABLE = 'getTimetable'
const KEY_GET_EXAMS = 'getExams'
const KEY_GET_GRADES = 'getGrades'
const KEY_GET_MENSA_PLAN = 'getMensaPlan'
const KEY_GET_FREE_ROOMS = 'getFreeRooms'
const KEY_GET_PARKING_DATA = 'getCampusParkingData'
const KEY_GET_PERSONAL_LECTURERS = 'getPersonalLecturers'
const KEY_GET_LECTURERS = 'getLecturers'

/**
 * Determines the users faculty.
 * @param {object} data Personal data
 * @returns {string} Faculty name (e.g. `Informatik`)
 */
function extractFacultyFromPersonalData (data) {
  if (!data || !data.persdata || !data.persdata.stg) {
    return null
  }

  const shortName = data.persdata.stg
  const faculty = Object.keys(courseShortNames)
    .find(faculty => courseShortNames[faculty].includes(shortName))

  return faculty
}

/**
 * Determines the users SPO version.
 * @param {object} data Personal data
 * @returns {string}
 */
function extractSpoFromPersonalData (data) {
  if (!data || !data.persdata || !data.persdata.po_url) {
    return null
  }

  const split = data.persdata.po_url.split('/').filter(x => x.length > 0)
  return split[split.length - 1]
}

/**
 * Client for accessing the API as a particular user.
 *
 * @see {@link https://github.com/neuland-ingolstadt/neuland.app/blob/develop/docs/thi-rest-api.md}
 */
export class AuthenticatedAPIClient extends AnonymousAPIClient {
  constructor () {
    super()

    this.sessionHandler = callWithSession
  }

  /**
   * Performs an authenticated request against the API
   * @param {object} params Request data
   * @returns {object}
   */
  async requestAuthenticated (params) {
    return await this.sessionHandler(async session => {
      const res = await this.request({
        session,
        ...params
      })
      if (res.status === 0) {
        return res
      } else {
        throw new APIError(res.status, res.data)
      }
    })
  }

  /**
   * Performs an authenticated and cached request against the API
   * @param {string} cacheKey Unique key that identifies this request
   * @param {object} params Request data
   * @returns {object}
   */
  async requestCached (cacheKey, params) {
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const resp = await this.requestAuthenticated(params)
    this.cache.set(cacheKey, resp)

    return resp
  }

  getRoomDistances (room) {
    if (!room) {
      return {}
    }

    return roomDistances[room.toUpperCase()] || {}
  }

  async getPersonalData () {
    const res = await this.requestCached(KEY_GET_PERSONAL_DATA, {
      service: 'thiapp',
      method: 'persdata',
      format: 'json'
    })

    return res.data[1]
  }

  async getFaculty () {
    const data = await this.getPersonalData()
    return extractFacultyFromPersonalData(data)
  }

  async getSpoName () {
    const data = await this.getPersonalData()
    return extractSpoFromPersonalData(data)
  }

  async getTimetable (date, detailed = false) {
    try {
      const key = `${KEY_GET_TIMETABLE}-${date.toDateString()}-${detailed}`
      const res = await this.requestCached(key, {
        service: 'thiapp',
        method: 'stpl',
        format: 'json',
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: 1900 + date.getYear(),
        details: detailed ? 1 : 0
      })

      return {
        semester: res.data[1],
        holidays: res.data[2],
        events: res.data[2],
        timetable: res.data[3]
      }
    } catch (e) {
      // when the user did not select any classes, the timetable returns 'Query not possible'
      if (e.data === 'Query not possible') {
        return {
          timetable: []
        }
      } else {
        throw e
      }
    }
  }

  async getExams () {
    try {
      const res = await this.requestCached(KEY_GET_EXAMS, {
        service: 'thiapp',
        method: 'exams',
        format: 'json'
      })

      return res.data[1]
    } catch (e) {
      // when you have no exams the API sometimes returns "No exam data available"
      if (e.data === 'No exam data available' || e.data === 'Query not possible') {
        return []
      } else {
        throw e
      }
    }
  }

  async getGrades () {
    const res = await this.requestCached(KEY_GET_GRADES, {
      service: 'thiapp',
      method: 'grades',
      format: 'json'
    })

    return res.data[1]
  }

  async getMensaPlan () {
    const res = await this.requestCached(KEY_GET_MENSA_PLAN, {
      service: 'thiapp',
      method: 'mensa',
      format: 'json'
    })

    return res.data
  }

  /**
   * @param {Date} date Date to fetch the room availability for
   */
  async getFreeRooms (date) {
    const key = `${KEY_GET_FREE_ROOMS}-${date.toDateString()}`
    const res = await this.requestCached(key, {
      service: 'thiapp',
      method: 'rooms',
      format: 'json',
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: 1900 + date.getYear()
    })

    return res.data[1]
  }

  async getCampusParkingData () {
    const res = await this.requestCached(KEY_GET_PARKING_DATA, {
      service: 'thiapp',
      method: 'parking',
      format: 'json'
    })

    return res.data
  }

  async getPersonalLecturers () {
    const res = await this.requestCached(KEY_GET_PERSONAL_LECTURERS, {
      service: 'thiapp',
      method: 'stpllecturers',
      format: 'json'
    })

    return res.data[1]
  }

  /**
   * @param {string} from Single character indicating where to start listing the lecturers
   * @param {string} to Single character indicating where to end listing the lecturers
   */
  async getLecturers (from, to) {
    const key = `${KEY_GET_LECTURERS}-${from}-${to}`
    const res = await this.requestCached(key, {
      service: 'thiapp',
      method: 'lecturers',
      format: 'json',
      from,
      to
    })

    return res.data[1]
  }

  async getLibraryReservations () {
    try {
      const res = await this.requestAuthenticated({
        service: 'thiapp',
        method: 'reservations',
        type: 1,
        subtype: 1,
        cmd: 'getreservation',
        data: '',
        format: 'json'
      })

      return res.data[1]
    } catch (e) {
      // as of 2021-06 the API returns "Service not available" when the user has no reservations
      // thus we dont alert the error here, but just silently set the reservations to none
      if (e.data === 'No reservation data' || e.data === 'Service not available') {
        return []
      } else {
        throw e
      }
    }
  }

  async getAvailableLibrarySeats () {
    const res = await this.requestAuthenticated({
      service: 'thiapp',
      method: 'reservations',
      type: 1,
      subtype: 1,
      cmd: 'getavailabilities',
      data: '',
      format: 'json'
    })

    return res.data[1]
  }

  /**
   * TODO documentation
   */
  async addLibraryReservation (roomId, day, start, end, place) {
    const res = await this.requestAuthenticated({
      service: 'thiapp',
      method: 'reservations',
      type: 1,
      subtype: 1,
      cmd: 'addreservation',
      data: JSON.stringify({
        resource: roomId,
        at: day,
        from: start,
        to: end,
        place
      }),
      format: 'json'
    })

    return res.data[1][0]
  }

  /**
   * @param {string} reservationId Reservation ID returned by `getLibraryReservations`
   */
  async removeLibraryReservation (reservationId) {
    try {
      await this.requestAuthenticated({
        service: 'thiapp',
        method: 'reservations',
        type: 1,
        subtype: 1,
        cmd: 'delreservation',
        data: reservationId,
        format: 'json'
      })

      return true
    } catch (e) {
      // as of 2021-06 the API returns "Service not available" when the user has no reservations
      // thus we dont alert the error here, but just silently set the reservations to none
      if (e.data === 'No reservation data' || e.data === 'Service not available') {
        return true
      } else {
        throw e
      }
    }
  }

  async getImprint () {
    const res = await this.requestAuthenticated({
      service: 'thiapp',
      method: 'impressum',
      format: 'json'
    })

    return res.data[1]
  }
}

export default new AuthenticatedAPIClient()
