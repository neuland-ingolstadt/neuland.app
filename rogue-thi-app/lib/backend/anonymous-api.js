import LocalStorageCache from '../cache/localstorage-cache'
import MemoryCache from '../cache/memory-cache'
import obtainFetchImplementation from '../fetch-implementations'
import packageInfo from '../../package.json'

const CACHE_NAMESPACE = 'thi-api-client'
const CACHE_TTL = 10 * 60 * 1000

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_THI_API_MODE || 'websocket-proxy'
const API_KEY = process.env.NEXT_PUBLIC_THI_API_KEY
const ENDPOINT_HOST = 'hiplan.thi.de'
const ENDPOINT_URL = '/webservice/zits_s_40_test/index.php'
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const USER_AGENT = `neuland.app/${packageInfo.version} (+${GIT_URL})`

// AAA Certificate Services
// valid until 01.01.2029
const THI_CERTS = [
  `-----BEGIN CERTIFICATE-----
  MIIEMjCCAxqgAwIBAgIBATANBgkqhkiG9w0BAQUFADB7MQswCQYDVQQGEwJHQjEb
  MBkGA1UECAwSR3JlYXRlciBNYW5jaGVzdGVyMRAwDgYDVQQHDAdTYWxmb3JkMRow
  GAYDVQQKDBFDb21vZG8gQ0EgTGltaXRlZDEhMB8GA1UEAwwYQUFBIENlcnRpZmlj
  YXRlIFNlcnZpY2VzMB4XDTA0MDEwMTAwMDAwMFoXDTI4MTIzMTIzNTk1OVowezEL
  MAkGA1UEBhMCR0IxGzAZBgNVBAgMEkdyZWF0ZXIgTWFuY2hlc3RlcjEQMA4GA1UE
  BwwHU2FsZm9yZDEaMBgGA1UECgwRQ29tb2RvIENBIExpbWl0ZWQxITAfBgNVBAMM
  GEFBQSBDZXJ0aWZpY2F0ZSBTZXJ2aWNlczCCASIwDQYJKoZIhvcNAQEBBQADggEP
  ADCCAQoCggEBAL5AnfRu4ep2hxxNRUSOvkbIgwadwSr+GB+O5AL686tdUIoWMQua
  BtDFcCLNSS1UY8y2bmhGC1Pqy0wkwLxyTurxFa70VJoSCsN6sjNg4tqJVfMiWPPe
  3M/vg4aijJRPn2jymJBGhCfHdr/jzDUsi14HZGWCwEiwqJH5YZ92IFCokcdmtet4
  YgNW8IoaE+oxox6gmf049vYnMlhvB/VruPsUK6+3qszWY19zjNoFmag4qMsXeDZR
  rOme9Hg6jc8P2ULimAyrL58OAd7vn5lJ8S3frHRNG5i1R8XlKdH5kBjHYpy+g8cm
  ez6KJcfA3Z3mNWgQIJ2P2N7Sw4ScDV7oL8kCAwEAAaOBwDCBvTAdBgNVHQ4EFgQU
  oBEKIz6W8Qfs4q8p74Klf9AwpLQwDgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQF
  MAMBAf8wewYDVR0fBHQwcjA4oDagNIYyaHR0cDovL2NybC5jb21vZG9jYS5jb20v
  QUFBQ2VydGlmaWNhdGVTZXJ2aWNlcy5jcmwwNqA0oDKGMGh0dHA6Ly9jcmwuY29t
  b2RvLm5ldC9BQUFDZXJ0aWZpY2F0ZVNlcnZpY2VzLmNybDANBgkqhkiG9w0BAQUF
  AAOCAQEACFb8AvCb6P+k+tZ7xkSAzk/ExfYAWMymtrwUSWgEdujm7l3sAg9g1o1Q
  GE8mTgHj5rCl7r+8dFRBv/38ErjHT1r0iWAFf2C3BUrz9vHCv8S5dIa2LX1rzNLz
  Rt0vxuBqw8M0Ayx9lt1awg6nCpnBBYurDC/zXDrPbDdVCYfeU0BsWO/8tqtlbgT2
  G9w84FoVxp7Z8VlIMCFlA2zs6SFz7JsDoeA3raAVGI/6ugLOpyypEBMs1OUIJqsi
  l2D4kF501KKaU73yqWjgom7C12yxow+ev+to51byrvLjKzg6CYG1a4XXvi3tPxq3
  smPi9WIsgtRqAEFQ8TmDn5XpNpaYbg==
  -----END CERTIFICATE-----`
]

/**
 * Error that is thrown when the API indicates an error.
 */
export class APIError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {object} data Error data
   */
  constructor (status, data) {
    super(`${data} (${status})`)
    this.status = status
    this.data = data
  }
}

/**
 * Client for accessing the API without authentication.
 * This client implements its own caching. If run in the browser,
 * responses will be cached in `localStorage` for `CACHE_TTL`.
 *
 * @see {@link https://github.com/neuland-ingolstadt/neuland.app/blob/develop/docs/thi-rest-api.md}
 */
export class AnonymousAPIClient {
  constructor () {
    if (typeof localStorage === 'undefined') {
      this.cache = new MemoryCache({
        ttl: CACHE_TTL
      })
    } else {
      this.cache = new LocalStorageCache({
        namespace: CACHE_NAMESPACE,
        ttl: CACHE_TTL
      })
    }
  }

  /**
   * Submits an API request to the THI backend using a WebSocket proxy
   */
  async request (params) {
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
        'User-Agent': ENDPOINT_MODE !== 'direct' ? USER_AGENT : undefined,
        'X-API-KEY': API_KEY
      }
    })
    try {
      return await resp.json()
    } catch (e) {
      throw new Error(`Response is not valid JSON (${await resp.text()})`)
    }
  }

  /**
   * Creates a login session.
   */
  async login (username, passwd) {
    await this.clearCache()

    const res = await this.request({
      service: 'session',
      method: 'open',
      format: 'json',
      username,
      passwd
    })

    if (res.status !== 0) {
      throw new APIError(res.status, res.data)
    }

    return {
      session: res.data[0],
      isStudent: res.data[2] === 3
    }
  }

  /**
   * Checks whether the session is still valid.
   * @param {string} session Session token
   * @returns {boolean} `true` if the session is valid.
   */
  async isAlive (session) {
    const res = await this.request({
      service: 'session',
      method: 'isalive',
      format: 'json',
      session
    })

    return res.data === 'STATUS_OK'
  }

  /**
   * Destroys a session.
   * @param {string} session Session token
   * @returns {boolean} `true` if the session was destroyed.
   */
  async logout (session) {
    const res = await this.request({
      service: 'session',
      method: 'close',
      format: 'json',
      session
    })

    return res.data === 'STATUS_OK'
  }

  /**
   * Clears the response cache.
   * Should be called either before login or after logout
   * to prevent responses from different users from being mixed up.
   */
  async clearCache () {
    this.cache.flushAll()
  }
}

export default new AnonymousAPIClient()
