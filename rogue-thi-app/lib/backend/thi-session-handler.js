import API from './anonymous-api'
import CredentialStorage from '../credential-storage'

const SESSION_EXPIRES = 3 * 60 * 60 * 1000
const CRED_NAME = 'credentials'
const CRED_ID = 'thi.de'

/**
 * Thrown when the user is not logged in.
 */
export class NoSessionError extends Error {
  constructor() {
    super('User is not logged in')
  }
}

/**
 * Thrown when the user is logged in as a guest.
 */
export class UnavailableSessionError extends Error {
  constructor() {
    super('User is logged in as guest')
  }
}

/**
 * Logs in the user and persists the session to localStorage
 */
export async function createSession(username, password, stayLoggedIn) {
  // convert to lowercase just to be safe
  // (the API used to show weird behavior when using upper case usernames)
  username = username.toLowerCase()
  // strip domain if user entered an email address
  username = username.replace(/@thi\.de$/, '')
  // strip username to remove whitespaces
  username = username.replace(/\s/g, '')

  const { session, isStudent } = await API.login(username, password)

  localStorage.session = session
  localStorage.sessionCreated = Date.now()
  localStorage.isStudent = isStudent

  const credStore = new CredentialStorage(CRED_NAME)
  if (stayLoggedIn) {
    await credStore.write(CRED_ID, { username, password })
  } else {
    await credStore.delete(CRED_ID)
  }
}

/**
 * Logs in the user as a guest.
 */
export async function createGuestSession() {
  await API.clearCache()
  localStorage.session = 'guest2'
}

/**
 * Calls a method with a session. If the session turns out to be invalid,
 * it attempts to fetch a new session and calls the method again.
 *
 * If a session can not be obtained, a NoSessionError is thrown.
 *
 * @param {object} method Method which will receive the session token
 * @returns {*} Value returned by `method`
 */
export async function callWithSession(method) {
  let session = localStorage.session
  const sessionCreated = parseInt(localStorage.sessionCreated)

  // redirect user if he never had a session
  if (!session) {
    throw new NoSessionError()
  } else if (
    session === 'guest2' ||
    process.env.NEXT_PUBLIC_GUEST_ONLY === 'true'
  ) {
    throw new UnavailableSessionError()
  }

  const credStore = new CredentialStorage(CRED_NAME)
  const { username, password } = (await credStore.read(CRED_ID)) || {}

  // log in if the session is older than SESSION_EXPIRES
  if (sessionCreated + SESSION_EXPIRES < Date.now() && username && password) {
    try {
      console.log('no session, logging in...')
      const { session: newSession, isStudent } = await API.login(
        username,
        password
      )
      session = newSession

      localStorage.session = session
      localStorage.sessionCreated = Date.now()
      localStorage.isStudent = isStudent
    } catch (e) {
      throw new NoSessionError()
    }
  }

  // otherwise attempt to call the method and see if it throws a session error
  try {
    return await method(session)
  } catch (e) {
    // the backend can throw different errors such as 'No Session' or 'Session Is Over'
    if (/session/i.test(e.message)) {
      if (username && password) {
        console.log(
          'seems to have received a session error trying to get a new session!'
        )
        try {
          const { session: newSession, isStudent } = await API.login(
            username,
            password
          )
          session = newSession

          localStorage.session = session
          localStorage.sessionCreated = Date.now()
          localStorage.isStudent = isStudent
        } catch (e) {
          throw new NoSessionError()
        }

        return await method(session)
      } else {
        throw new NoSessionError()
      }
    } else {
      throw e
    }
  }
}

/**
 * Logs out the user by deleting the session from localStorage.
 *
 * @param {object} router Next.js router object
 */
export async function forgetSession(router) {
  try {
    await API.logout(localStorage.session)
  } catch (e) {
    // ignore
  }

  localStorage.removeItem('session')
  localStorage.removeItem('sessionCreated')
  localStorage.removeItem('isStudent')

  const credStore = new CredentialStorage(CRED_NAME)
  await credStore.delete(CRED_ID)

  router.replace('/login')
}
