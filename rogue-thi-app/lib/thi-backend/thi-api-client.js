import { thiApiRequest } from './thi-api-request'
import { convertThiMensaPlan } from './thi-api-conversion'
import MemoryCache from '../cache/memory-cache'
import LocalStorageCache from '../cache/localstorage-cache'

const CACHE_NAMESPACE = 'thi-api-client'
const CACHE_TTL = 10 * 60 * 1000

const KEY_GET_PERSONAL_DATA = 'getPersonalData'
const KEY_GET_TIMETABLE = 'getTimetable'
const KEY_GET_EXAMS = 'getExams'
const KEY_GET_GRADES = 'getGrades'
const KEY_GET_MENSA_PLAN = 'getMensaPlan'
const KEY_GET_FREE_ROOMS = 'getFreeRooms'
const KEY_GET_PARKING_DATA = 'getCampusParkingData'
const KEY_GET_PERSONAL_LECTURERS = 'getPersonalLecturers'
const KEY_GET_LECTURERS = 'getLecturers'

let cache
if (typeof localStorage === 'undefined') {
  cache = new MemoryCache({
    ttl: CACHE_TTL
  })
} else {
  cache = new LocalStorageCache({
    namespace: CACHE_NAMESPACE,
    ttl: CACHE_TTL
  })
}

async function cachedThiApiRequest (cacheKey, options) {
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  const res = await thiApiRequest(options)
  if (res.status !== 0) {
    throw new Error(res.data)
  }

  cache.set(cacheKey, res)
  return res
}

export async function login (username, password) {
  cache.flushAll()

  const res = await thiApiRequest({
    service: 'session',
    method: 'open',
    format: 'json',
    username: username,
    passwd: password
  })

  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return res.data[0]
}

export async function isAlive (session) {
  const res = await thiApiRequest({
    service: 'session',
    method: 'isalive',
    format: 'json',
    session
  })

  return res.data === 'STATUS_OK'
}

export async function getPersonalData (session) {
  const res = await cachedThiApiRequest(KEY_GET_PERSONAL_DATA, {
    service: 'thiapp',
    method: 'persdata',
    format: 'json',
    session
  })

  return res.data[1]
}

export async function getTimetable (session, date, detailed = false) {
  const key = `${KEY_GET_TIMETABLE}-${date.toDateString()}-${detailed}`
  const res = await cachedThiApiRequest(key, {
    service: 'thiapp',
    method: 'stpl',
    format: 'json',
    session,
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

export async function getExams (session) {
  const res = await cachedThiApiRequest(KEY_GET_EXAMS, {
    service: 'thiapp',
    method: 'exams',
    format: 'json',
    session
  })

  return res.data[1]
}

export async function getGrades (session) {
  const res = await cachedThiApiRequest(KEY_GET_GRADES, {
    service: 'thiapp',
    method: 'grades',
    format: 'json',
    session
  })

  return res.data[1]
}

export async function getMensaPlan (session) {
  const res = await cachedThiApiRequest(KEY_GET_MENSA_PLAN, {
    service: 'thiapp',
    method: 'mensa',
    format: 'json',
    session
  })

  return convertThiMensaPlan(res.data)
}

export async function getFreeRooms (session, date) {
  const key = `${KEY_GET_FREE_ROOMS}-${date.toDateString()}`
  const res = await cachedThiApiRequest(key, {
    service: 'thiapp',
    method: 'rooms',
    format: 'json',
    session,
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: 1900 + date.getYear()
  })

  return res.data[1]
}

export async function getCampusParkingData (session) {
  const res = await cachedThiApiRequest(KEY_GET_PARKING_DATA, {
    service: 'thiapp',
    method: 'parking',
    format: 'json',
    session
  })

  return res.data
}

export async function getPersonalLecturers (session) {
  const res = await cachedThiApiRequest(KEY_GET_PERSONAL_LECTURERS, {
    service: 'thiapp',
    method: 'stpllecturers',
    format: 'json',
    session
  })

  return res.data[1]
}

export async function getLecturers (session, from, to) {
  const key = `${KEY_GET_LECTURERS}-${from}-${to}`
  const res = await cachedThiApiRequest(key, {
    service: 'thiapp',
    method: 'lecturers',
    format: 'json',
    from,
    to,
    session
  })

  return res.data[1]
}

export async function getLibraryReservations (session) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'reservations',
    type: 1,
    subtype: 1,
    cmd: 'getreservation',
    data: '',
    format: 'json',
    session
  })

  // as of 2021-06 the API returns "Service not available" when the user has no reservations
  // thus we dont alert the error here, but just silently set the reservations to none
  if (res.data === 'No reservation data' || res.status === -112) {
    return []
  }
  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return res.data[1]
}

export async function getAvailableLibrarySeats (session) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'reservations',
    type: 1,
    subtype: 1,
    cmd: 'getavailabilities',
    data: '',
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return res.data[1]
}

export async function addLibraryReservation (session, roomId, day, start, end, place) {
  const res = await thiApiRequest({
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
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return res.data[1][0]
}

export async function removeLibraryReservation (session, reservationId) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'reservations',
    type: 1,
    subtype: 1,
    cmd: 'delreservation',
    data: reservationId,
    format: 'json',
    session
  })

  // as of 2021-06 the API returns "Service not available" when the user has no reservations
  // thus we dont alert the error here, but just silently set the reservations to none
  if (res.data === 'No reservation data' || res.status === -112) {
    return true
  }
  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return true
}

export async function getImprint (session) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'impressum',
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw new Error(res.data)
  } // e.g. 'Wrong credentials'

  return res.data[1]
}
