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
    let data = await this.performRequest(`${ENDPOINT}/api/reimanns`)

    if (lang !== 'de') {
      data = this.translateMealNames(data, lang)
    }

    return data
  }

  async getCanisiusPlan (lang) {
    let data = await this.performRequest(`${ENDPOINT}/api/canisius`)

    if (lang !== 'de') {
      data = this.translateMealNames(data, lang)
    }

    return data
  }

  async translateMealNames (data, lang) {
    const mealNames = data.flatMap(x => x.meals.map(y => y.name))
    const translatedMealNames = await this.translate(mealNames, 'de', lang)

    // replace meal names with data.map
    data.forEach((day, i) => {
      day.meals.forEach((meal, j) => {
        meal.originalName = meal.name
        meal.name = translatedMealNames[i * day.meals.length + j]
        meal.translated = true
      })
    })

    return data
  }

  async translate (text, source, target) {
    const res = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: 'text',
        api_key: ''
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    // return translated text
    const result = await res.json()
    return result.translatedText
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
