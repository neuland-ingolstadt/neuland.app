import { thiApiRequest } from './thi-api-request'

export async function obtainSession(router) {
  let session = localStorage.session
  const age = parseInt(localStorage.sessionCreated)
  const username = localStorage.username
  const password = localStorage.password

  console.log(age, session && age && age + 3 * 60 * 60 * 1000 < Date.now())

  if (session && age && age + 3 * 60 * 60 * 1000 < Date.now()) {
    if(!await isAlive(session))
      session = false
  }

  if (!session && username && password) {
    try {
      session = await login(username, password)
      localStorage.sessionCreated = Date.now()
    }
    catch(e) {
      router.push('/login')
      throw e
    }
  }

  if (!session) {
    router.push('/login')
  }

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
