import { isAlive, login } from './thi-api-client'

const SESSION_EXPIRES = 3 * 60 * 60 * 1000

export async function createSession (router, username, password, stayLoggedIn) {
  // convert to lowercase just to be safe
  // (the API used to show weird behavior when using upper case usernames)
  username = username.toLowerCase()
  // strip domain if user entered an email address
  username = username.replace(/@thi\.de$/, '')

  const session = await login(username, password)

  localStorage.session = session
  localStorage.sessionCreated = Date.now()

  if (stayLoggedIn) {
    localStorage.username = username
    localStorage.password = password
  } else {
    delete localStorage.username
    delete localStorage.password
  }

  router.replace('/')
}

export async function callWithSession (onSessionFailure, callback) {
  let session = localStorage.session
  const username = localStorage.username
  const password = localStorage.password

  if (!session && username && password) {
    try {
      console.log('no session, logging in...')
      session = await login(username, password)
      localStorage.session = session
      localStorage.sessionCreated = Date.now()
    } catch (e) {
      onSessionFailure(e)
      return
    }
  }

  let retVal
  try {
    retVal = await callback(session)
  } catch (e) {
    if (e.message === 'No Session' && username && password) {
      console.log('seems to have received a session error trying to get a new session!')
      try {
        session = await login(username, password)
        localStorage.session = session
        localStorage.sessionCreated = Date.now()
      } catch (e) {
        onSessionFailure(e)
        return
      }

      retVal = await callback(session)
    } else if (e.message === 'No Session') {
      onSessionFailure(e)
      return
    } else {
      throw e
    }
  }

  return retVal
}

export async function obtainSession (router) {
  let session = localStorage.session
  const age = parseInt(localStorage.sessionCreated)
  const username = localStorage.username
  const password = localStorage.password

  // invalidate expired session
  if (age + SESSION_EXPIRES < Date.now() || !await isAlive(session)) {
    console.log('Invalidating session')

    session = null
  }

  // try to log in again
  if (!session && username && password) {
    try {
      console.log('Logging in again')

      session = await login(username, password)
      localStorage.session = session
      localStorage.sessionCreated = Date.now()
    } catch (e) {
      console.log('Failed to log in again')

      console.error(e)
    }
  }

  if (session) {
    return session
  } else {
    router.replace('/login')
    return null
  }
}

export async function forgetSession (router) {
  delete localStorage.session
  delete localStorage.sessionCreated
  delete localStorage.username
  delete localStorage.password

  router.replace('/login')
}
