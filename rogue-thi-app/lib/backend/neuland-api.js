import { Capacitor } from '@capacitor/core'
import obtainFetchImplementation from '../fetch-implementations'

const ENDPOINT = Capacitor.isNativePlatform() ? 'https://neuland.app' : ''
const ENDPOINT_MODE = process.env.NEXT_PUBLIC_NEULAND_API_MODE || 'direct'
const ENDPOINT_HOST = process.env.NEXT_PUBLIC_NEULAND_API_HOST || ''

class NeulandAPIClient {
  constructor () {
    // XXX we assume here we never set the endpoint mode to `websocket-proxy` for the neuland API
    this.connection = obtainFetchImplementation(ENDPOINT_MODE, {})
  }

  /**
   * Performs a request against the neuland.app API
   * @param {string} url
   */
  async performRequest (url) {
    const resp = await this.connection.fetch(`${ENDPOINT_HOST}${url}`)

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getMensaPlan (lang) {
    switch (lang) {
      case 'de':
        return this.performRequest(`${ENDPOINT}/api/mensa?lang=de`)
      case 'en':
        return this.performRequest(`${ENDPOINT}/api/mensa?lang=en`)
      default:
        throw new Error('Invalid language')
    }
  }

  async getReimannsPlan (lang) {
    return await this.performRequest(`${ENDPOINT}/api/reimanns`)
  }

  async getCanisiusPlan (lang) {
    return await this.performRequest(`${ENDPOINT}/api/canisius`)
  }

  /**
   * @param {string} station Bus station identifier
   */
  async getBusPlan (station) {
    return this.performRequest(`${ENDPOINT}/api/bus/${encodeURIComponent(station)}`)
  }

  /**
   * @param {string} station Train station identifier
   */
  async getTrainPlan (station) {
    return this.performRequest(`${ENDPOINT}/api/train/${encodeURIComponent(station)}`)
  }

  async getParkingData () {
    return this.performRequest(`${ENDPOINT}/api/parking`)
  }

  async getCharingStationData () {
    return this.performRequest(`${ENDPOINT}/api/charging-stations`)
  }

  async getCampusLifeEvents () {
    return this.performRequest(`${ENDPOINT}/api/cl-events`)
  }
}

export default new NeulandAPIClient()
