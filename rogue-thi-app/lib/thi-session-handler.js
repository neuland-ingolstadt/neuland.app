import { isAlive, login } from './thi-api-client'

const SESSION_EXPIRES = 3 * 60 * 60 * 1000

export async function createSession (router, username, password, stayLoggedIn) {
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

  router.push('/')
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
    router.push('/login')
    return null
  }
}

export async function forgetSession (router) {
  delete localStorage.sesssion
  delete localStorage.sessionCreated
  delete localStorage.username
  delete localStorage.password

  router.push('/login')
}
