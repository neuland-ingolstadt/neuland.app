import { AnonymousAPIClient, THI_CERTS } from './anonymous-api'
import obtainFetchImplementation from '../fetch-implementations'

import packageInfo from '../../package.json'

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_THI_API_MODE || 'websocket-proxy'
const ENDPOINT_HOST = process.env.NEXT_PUBLIC_THI_API_HOST
const ENDPOINT_URL = '/webservice/production2/index.php'
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const USER_AGENT = `neuland.app/${packageInfo.version} (+${GIT_URL})`

/**
 * Client for accessing the API without authentication.
 * This client implements its own caching. If run in the browser,
 * responses will be cached in `localStorage` for `CACHE_TTL`.
 *
 * @see {@link https://github.com/neuland-ingolstadt/neuland.app/blob/develop/docs/thi-rest-api.md}
 */
export class LegacyAnonymousAPIClient extends AnonymousAPIClient {
  /**
   * Submits an API request to the THI backend using a WebSocket proxy
   */
  /**
   * Submits an API request to the THI backend using a WebSocket proxy
   */
  async request (params) {
    console.log(ENDPOINT_MODE)

    if (!this.connection) {
      this.connection = obtainFetchImplementation(ENDPOINT_MODE, {
        target: ENDPOINT_HOST,
        via: PROXY_URL,
        certs: THI_CERTS,
        closed: () => {
          this.connection = null
        },
        error: err => {
          console.error(err)
          this.connection = null
        }
      })
    }

    const resp = await this.connection.fetch(`https://${ENDPOINT_HOST}${ENDPOINT_URL}`, {
      method: 'POST',
      body: new URLSearchParams(params).toString(),
      headers: {
        Host: ENDPOINT_HOST,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      }
    })
    try {
      return await resp.json()
    } catch (e) {
      throw new Error(`Response is not valid JSON (${await resp.text()})`)
    }
  }
}

export default new LegacyAnonymousAPIClient()
