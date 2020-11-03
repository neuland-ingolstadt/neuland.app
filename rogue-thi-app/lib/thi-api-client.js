import { thiApiRequest } from './thi-api-request'

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
    day: date.getDay(),
    month: date.getMonth(),
    year: 1900 + date.getYear(),
    details: 0
  })

  if (res.status !== 0) {
    throw res.data
  } // e.g. 'Wrong credentials'

  return {
    semester: res.data[0],
    today: res.data[1],
    timestamp: res.data[2],
    events: res.data[3]
  }
}
