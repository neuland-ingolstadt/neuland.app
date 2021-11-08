import obtainFetchImplementation from './fetch-implementations'

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_NEULAND_API_MODE || 'direct'
const ENDPOINT_HOST = process.env.NEXT_PUBLIC_NEULAND_API_HOST || ''

class NeulandAPIClient {
  constructor () {
    // XXX we assume here we never set the endpoint mode to `websocket-proxy` for the neuland API
    this.connection = obtainFetchImplementation(ENDPOINT_MODE, {})
  }

  async performRequest (url) {
    const resp = await this.connection.fetch(`${ENDPOINT_HOST}${url}`)

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('API returned an error: ' + await resp.text())
    }
  }

  async getMensaPlan () {
    return this.performRequest('/api/mensa')
  }

  async getBusPlan (station) {
    return this.performRequest('/api/bus/' + encodeURIComponent(station))
  }

  async getTrainPlan (station) {
    return this.performRequest('/api/train/' + encodeURIComponent(station))
  }

  async getParkingData () {
    return this.performRequest('/api/parking')
  }

  async getCharingStationData () {
    return this.performRequest('/api/charging-stations')
  }

  async getCampusLifeEvents () {
    return this.performRequest('/api/cl-events')
  }

  async getThiEvents () {
    return this.performRequest('/api/thi-events')
  }
}

export default new NeulandAPIClient()
