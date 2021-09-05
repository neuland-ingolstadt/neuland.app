import { Http } from '@capacitor-community/http'

import { HttpResponse } from './index'

export default class CapacitorFetchConnection {
  async fetch (url, options) {
    const response = await Http.request({
      url,
      ...options
    })
    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    return new HttpResponse(response.status, body)
  }
}
