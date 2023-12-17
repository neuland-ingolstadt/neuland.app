import obtainFetchImplementation from '../fetch-implementations'

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_NEULAND_API_MODE || 'direct'
const ENDPOINT_HOST = process.env.NEXT_PUBLIC_NEULAND_API_HOST || ''

class NeulandAPIClient {
  /**
   * Performs a request against the neuland.app API
   * @param {string} url
   */
  async performRequest(url) {
    if (!this.connection) {
      // XXX we assume here we never set the endpoint mode to `websocket-proxy` for the neuland API
      this.connection = await obtainFetchImplementation(ENDPOINT_MODE, {})
    }
    const resp = await this.connection.fetch(`${ENDPOINT_HOST}${url}`)

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + (await resp.text()))
    }
  }

  async getMensaPlan() {
    return this.performRequest('/api/mensa/?version=v2')
  }

  async getReimannsPlan() {
    return this.performRequest('/api/reimanns/?version=v2')
  }

  async getCanisiusPlan() {
    return this.performRequest('/api/canisius/?version=v2')
  }

  /**
   * @param {string} station Bus station identifier
   */
  async getBusPlan(station) {
    return this.performRequest(`/api/bus/${encodeURIComponent(station)}`)
  }

  /**
   * @param {string} station Train station identifier
   */
  async getTrainPlan(station) {
    return this.performRequest(`/api/train/${encodeURIComponent(station)}`)
  }

  async getParkingData() {
    return this.performRequest('/api/parking/')
  }

  async getCharingStationData() {
    return this.performRequest('/api/charging-stations/')
  }

  async getCampusLifeEvents() {
    return this.performRequest('/api/cl-events/')
  }
}

export default new NeulandAPIClient()
