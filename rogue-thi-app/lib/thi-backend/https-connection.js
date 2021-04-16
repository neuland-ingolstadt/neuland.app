import { tls, util } from 'node-forge/lib/index'
import http from 'node-forge/lib/http'

const DEFAULT_TIMEOUT = 5000

function ab2str (buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

function str2ab (str) {
  const buf = new Uint8Array(str.length)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    buf[i] = str.charCodeAt(i)
  }
  return buf
}

/**
 * A wrapper around node-forge that allows you to open a HTTPS connection proxied via WebSocket
 */
export default class HttpsConnection {
  constructor (options) {
    console.debug('Creating new connection')

    this.options = options
    this.requests = []

    this.webSocket = new WebSocket(options.proxy)
    this.webSocket.binaryType = 'arraybuffer'
    // socket established -> perform TLS handshake
    this.webSocket.addEventListener('open', () => this.tlsConnection.handshake())
    // socket closed -> tear down
    this.webSocket.addEventListener('close', () => this.close())
    // socket failed -> throw error
    this.webSocket.addEventListener('error', event => this._onError(new Error('WebSocket connection failed: ' + event)))
    // received data from server -> decrypt with TLS
    this.webSocket.addEventListener('message', event => this.tlsConnection.process(ab2str(event.data)))

    this.tlsConnection = tls.createConnection({
      server: false,
      caStore: options.certs,
      virtualHost: options.host,
      verify: (connection, verified, depth, certs) => this._onVerify(verified, depth, certs),
      connected: connection => this._onConnected(),
      tlsDataReady: connection => this._onTlsDataReady(),
      dataReady: connection => this._onDataReady(),
      closed: () => this.close(),
      error: (connection, error) => this._onError(error)
    })

    this._restartTimeout()
  }

  fetch (url, init) {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        throw new Error('Connection is closed')
      }

      const parsedUrl = new URL(url)

      if (parsedUrl.hostname !== this.options.host) {
        throw new Error('Can not fetch from this host')
      }

      this.requests.push(new HttpRequest({
        forge: {
          method: init.method || 'GET',
          path: parsedUrl.pathname + parsedUrl.search,
          body: init.body,
          headers: init.headers
        },
        response: data => resolve(new HttpResponse(data)),
        error: err => reject(err)
      }))

      if (!this.isConnected) {
        console.debug('Not connected yet, delaying')
        return
      }

      if (this.requests.length > 1) {
        console.debug('There is a running request, delaying')
        return
      }

      console.debug('No running requests, starting immediately')
      this._sendNextRequest()
    })
  }

  /**
   * Closes the socket and cancels all ongoing requests.
   */
  close () {
    if (this.closed) {
      return
    }
    this.closed = true

    this.requests.forEach(request => {
      request.processError(new Error('Connection was closed'))
    })

    this.tlsConnection.close()
    this.webSocket.close()
    this.options.closed()
  }

  _restartTimeout () {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    this.timeout = setTimeout(() => this._onTimeout(), this.options.timeout || DEFAULT_TIMEOUT)
  }

  /**
   * Starts the first request from the request queue.
   */
  _sendNextRequest () {
    if (this.requests.length > 0) {
      const request = this.requests[0]
      this.tlsConnection.prepare(request.getRequestData())
    }
  }

  /**
   * Verifies the TLS certificate.
   */
  _onVerify (verified, depth, certs) {
    if (certs[0].subject.getField('CN').value === this.options.host) {
      return verified
    } else {
      return false
    }
  }

  /**
   * Called when the TLS connection has been established.
   */
  _onConnected () {
    this.isConnected = true
    this._sendNextRequest()
  }

  /**
   * Called when encrypted data is ready to be sent to the server.
   */
  _onTlsDataReady () {
    const data = this.tlsConnection.tlsData.getBytes()
    this.webSocket.send(str2ab(data))

    this._restartTimeout()
  }

  /**
   * Called when decrypted data is ready to be processed.
   */
  _onDataReady () {
    const data = this.tlsConnection.data.getBytes()
    const request = this.requests[0]

    if (request.putResponseChunk(data)) {
      this.requests.shift()
      this._sendNextRequest()
    }

    this._restartTimeout()
  }

  /**
   * Called when the connection times out.
   */
  _onTimeout () {
    console.debug('Connection closed due to timeout')

    this.timeout = null
    this.close()
  }

  /**
   * Called when the connection errors out.
   */
  _onError (error) {
    this.options.error(error)
    this.close()
  }
}

/**
 * Helper class that holds the request data and the requests event handlers.
 */
class HttpRequest {
  constructor (options) {
    this.options = options

    this.request = http.createRequest(this.options.forge)
    this.response = http.createResponse()
    this.buffer = util.createBuffer()
  }

  /**
   * @returns The request headers and body.
   */
  getRequestData () {
    return this.request.toString() + this.request.body
  }

  /**
   * Processes a chunk of response data and call the appropirate event handlers if finished.
   * @returns `true` if the entire response has been received, `false` if more data is expected.
   */
  putResponseChunk (data) {
    this.buffer.putBytes(data)

    if (!this.response.headerReceived) {
      this.response.readHeader(this.buffer)
    }

    if (this.response.headerReceived) {
      if (this.response.readBody(this.buffer)) {
        try {
          this.options.response(this.response.body)
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

  /**
   * Call the error handlers to indicate an error.
   */
  processError (error) {
    this.options.error(error)
  }
}

/**
 * Helper class that mimics a `fetch` response.
 */
class HttpResponse {
  constructor (data) {
    this.data = data
  }

  async json () {
    return JSON.parse(this.data)
  }
}
