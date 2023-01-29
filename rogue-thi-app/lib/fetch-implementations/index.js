import BrowserFetchConnection from './browser-fetch'
import CapacitorFetchConnection from './capacitor-http'
import WebSocketProxyConnection from 'fetch-bypass-cors'

/**
 * Helper class that mimics a `fetch` response.
 */
export class HttpResponse {
  /**
   * @param {number} status HTTP status code
   * @param {object} data Error data
   */
  constructor (status, data) {
    this.status = status
    this.data = data
  }

  async text () {
    return this.data
  }

  async json () {
    return JSON.parse(this.data)
  }
}

/**
 * Returns a suitable fetch implementation.
 * @param {string} mode Either `direct`, `capacitor` or `websocket-proxy`
 * @param {object} options Connection parameters, only used by the proxy
 * @returns An object with a `fetch` method.
 */
export default function obtainFetchImplementation (mode, options) {
  if (mode === 'direct') {
    return new BrowserFetchConnection(options)
  } else if (mode === 'capacitor') {
    return new CapacitorFetchConnection(options)
  } else if (mode === 'websocket-proxy') {
    return new WebSocketProxyConnection(options)
  } else {
    throw new Error(`Unknown fetch implementation: ${mode}`)
  }
}
