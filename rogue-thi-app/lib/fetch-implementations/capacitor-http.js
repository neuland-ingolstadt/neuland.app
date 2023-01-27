import { Http } from '@capacitor-community/http'

import { HttpResponse } from './index'

function getHeaderValue (headers, header) {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === header.toLowerCase())
  return value ? value[1] : null
}

function getContentType (headers) {
  const value = getHeaderValue(headers, 'Content-Type')
  return value ? value.split(';')[0] : null
}

/**
 * A fetch implementation which uses the Capacitor HTTP client in the background.
 */
export default class CapacitorFetchConnection {
  async fetch (url, options) {
    // parse body because capacitor expects a non-serialized data object
    const mime = options && options.headers && getContentType(options.headers)
    let data
    if (!options || !options.body) {
      // mimimi
    } else if (mime === 'application/x-www-form-urlencoded') {
      data = Object.fromEntries(new URLSearchParams(options.body).entries())
    } else if (mime === 'application/json') {
      data = JSON.parse(options.body)
    } else {
      throw new Error(`Unsupported mime type: ${mime}`)
    }

    const resp = await Http.request({
      method: 'GET',
      ...options,
      url,
      data
    })
    const respMime = getContentType(resp.headers)
    let respData
    if (respMime === 'application/json') {
      respData = JSON.stringify(resp.data)
    } else {
      respData = resp.data
    }
    return new HttpResponse(resp.status, respData)
  }
}
