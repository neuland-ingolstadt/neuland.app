import { APIError } from './anonymous-api'
import { callWithSession } from './thi-session-handler'

import { extractFacultyFromPersonalData, extractSpoFromPersonalData } from './authenticated-api'
import { LegacyAnonymousAPIClient } from './anonymous-legacy-api'

const KEY_GET_PERSONAL_DATA = 'getPersonalDataLegacy'
const KEY_GET_TIMETABLE = 'getTimetableLegacy'
const KEY_GET_EXAMS = 'getExamsLegacy'
const KEY_GET_GRADES = 'getGradesLegacy'
const KEY_GET_MENSA_PLAN = 'getMensaPlanLegacy'
const KEY_GET_FREE_ROOMS = 'getFreeRoomsLegacy'
const KEY_GET_PARKING_DATA = 'getCampusParkingDataLegacy'
const KEY_GET_PERSONAL_LECTURERS = 'getPersonalLecturersLegacy'
const KEY_GET_LECTURERS = 'getLecturersLegacy'

/**
 * Client for accessing the API as a particular user.
 *
 * @see {@link https://github.com/neuland-ingolstadt/neuland.app/blob/develop/docs/thi-rest-api.md}
 */
export class LegacyAuthenticatedAPIClient extends LegacyAnonymousAPIClient {
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

  async getPersonalData () {
    const res = await this.requestCached(KEY_GET_PERSONAL_DATA, {
      service: 'thiapp',
      method: 'persdata',
      format: 'json'
    })

    return res
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
        timetable: res.data[3]
      }
    } catch (e) {
      // when the user did not select any classes, the timetable returns 'Query not possible'
      if (e.data === 'Query not possible' || e.data === 'Time table does not exist') {
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

      return res
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
    throw new Error('Not implemented')
  }

  async getAvailableLibrarySeats () {
    throw new Error('Not implemented')
  }

  async addLibraryReservation (roomId, day, start, end, place) {
    throw new Error('Not implemented')
  }

  /**
   * @param {string} reservationId Reservation ID returned by `getLibraryReservations`
   */
  async removeLibraryReservation (reservationId) {
    throw new Error('Not implemented')
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

export default new LegacyAuthenticatedAPIClient()
