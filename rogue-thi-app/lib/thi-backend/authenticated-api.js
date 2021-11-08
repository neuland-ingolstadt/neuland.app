import { APIError, AnonymousAPIClient } from './anonymous-api'
import {
  convertThiMensaPlan,
  extractFacultyFromPersonalData,
  extractSpoFromPersonalData
} from './thi-api-conversion'
import { callWithSession } from './thi-session-handler'

const KEY_GET_PERSONAL_DATA = 'getPersonalData'
const KEY_GET_TIMETABLE = 'getTimetable'
const KEY_GET_EXAMS = 'getExams'
const KEY_GET_GRADES = 'getGrades'
const KEY_GET_MENSA_PLAN = 'getMensaPlan'
const KEY_GET_FREE_ROOMS = 'getFreeRooms'
const KEY_GET_PARKING_DATA = 'getCampusParkingData'
const KEY_GET_PERSONAL_LECTURERS = 'getPersonalLecturers'
const KEY_GET_LECTURERS = 'getLecturers'

export class AuthenticatedAPIClient extends AnonymousAPIClient {
  constructor () {
    super()

    this.sessionHandler = callWithSession
  }

  /**
   * Performs an authenticated request against the API
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

    return convertThiMensaPlan(res.data)
  }

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
