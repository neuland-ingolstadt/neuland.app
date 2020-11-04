import { thiApiRequest } from './thi-api-request'

export async function obtainSession(router) {
  const session = localStorage.session

  if (!session) {
    // TODO re-login using saved password?
    router.push('/')
    throw new Error('No session available')
  }

  // TODO check isalive

  return session

}

export async function login (username, password) {
  const res = await thiApiRequest({
    service: 'session',
    method: 'open',
    format: 'json',
    username: username,
    passwd: password
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return {
    session: res.data[0]
  }
}

export async function isAlive (session) {
  const res = await thiApiRequest({
    service: 'session',
    method: 'isalive',
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return res.data === 'STATUS_OK'
}

export async function getPersonalData (session) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'persdata',
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return res.data[1]
}

export async function getTimetable (session, date) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'stpl',
    format: 'json',
    session,
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: 1900 + date.getYear(),
    details: 0
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return {
    semester: res.data[1],
    holidays: res.data[2],
    events: res.data[2],
    timetable: res.data[3]
  }
}

export async function getMensaPlan (session) {
  const res = await thiApiRequest({
    service: 'thiapp',
    method: 'mensa',
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return res.data[0]
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

  if (res.data === 'No reservation data') {
    return []
  }
  if (res.status !== 0) {
    throw res.data
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
    throw res.data
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
      place,
    }),
    format: 'json',
    session
  })

  if (res.status !== 0) {
    throw res.data
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

  if (res.data === 'No reservation data') {
    return true // dafuq THI API?
  }
  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return true
}
