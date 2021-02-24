import * as forge from 'node-forge/lib/index.all'

/**
 * A helper class that can be used to dispatch an HTTP request using an HttpsConnection
 */
export default class HttpRequest {
  constructor (options) {
    this.options = options

    this.request = forge.http.createRequest(this.options.forge)
    this.response = forge.http.createResponse()
    this.buffer = forge.util.createBuffer()
  }

  getData () {
    return this.request.toString() + this.request.body
  }

  processData (data) {
    this.buffer.putBytes(data)
    if (!this.response.headerReceived) {
      this.response.readHeader(this.buffer)
    }

    if (this.response.headerReceived) {
      if (this.response.readBody(this.buffer)) {
        try {
          const data = JSON.parse(this.response.body)
          console.debug('Response:')
          console.debug(data)
          this.options.response(data)
          return true
        } catch (e) {
          if (e instanceof SyntaxError) {
            // e.g. 'Bad request'
            this.options.error(new Error(`Response is not valid JSON (${this.response.body})`))
            return true
          } else {
            this.options.error(e)
            return true
          }
        }
      } else {
        return false
      }
    } else {
      return false
    }
  }

  processError (error) {
    this.options.error(error)
  }
}
