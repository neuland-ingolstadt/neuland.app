import { Http } from '@capacitor-community/http'

import { HttpResponse } from './index'

export default class CapacitorFetchConnection {
  async fetch (url, options) {
    const ctHeader = options && options.headers && Object.entries(options.headers).find(([key]) => key.toLowerCase() === 'content-type')
    const mime = ctHeader ? ctHeader[1].split(';')[0] : null

    // parse body because capacitor expects a non-serialized data object
    let data = undefined
    if (!options || !options.body) {
      // mimimi
    } else if (mime === 'application/x-www-form-urlencoded') {
      data = Object.fromEntries(new URLSearchParams(options.body).entries())
    } else if (mime === 'application/json') {
      data = JSON.parse(options.body)
    } else {
      throw new Error(`Unsupported mime type: ${mime}`)
    }

    const response = await Http.request({
      url,
      data: data,
      ...options
    })
    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    return new HttpResponse(response.status, body)
  }
}
