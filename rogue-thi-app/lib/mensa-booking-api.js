import obtainFetchImplementation from './fetch-implementations'
import { formatISODate, formatISOTime } from './date-utils'
import packageInfo from '../package.json'

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_NEULAND_API_MODE || 'websocket-proxy'
const ENDPOINT_HOST = 'togo.my-mensa.de'
const ENDPOINT_URL = '/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations'

const PROXY_URL = process.env.NEXT_PUBLIC_MENSA_PROXY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const USER_AGENT = `neuland.app/${packageInfo.version} (+${GIT_URL})`

// DST Root CA X3
// valid until 2021-09-30
const ENDPOINT_CERTS = [
  `-----BEGIN CERTIFICATE-----
  MIIDSjCCAjKgAwIBAgIQRK+wgNajJ7qJMDmGLvhAazANBgkqhkiG9w0BAQUFADA/
  MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT
  DkRTVCBSb290IENBIFgzMB4XDTAwMDkzMDIxMTIxOVoXDTIxMDkzMDE0MDExNVow
  PzEkMCIGA1UEChMbRGlnaXRhbCBTaWduYXR1cmUgVHJ1c3QgQ28uMRcwFQYDVQQD
  Ew5EU1QgUm9vdCBDQSBYMzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
  AN+v6ZdQCINXtMxiZfaQguzH0yxrMMpb7NnDfcdAwRgUi+DoM3ZJKuM/IUmTrE4O
  rz5Iy2Xu/NMhD2XSKtkyj4zl93ewEnu1lcCJo6m67XMuegwGMoOifooUMM0RoOEq
  OLl5CjH9UL2AZd+3UWODyOKIYepLYYHsUmu5ouJLGiifSKOeDNoJjj4XLh7dIN9b
  xiqKqy69cK3FCxolkHRyxXtqqzTWMIn/5WgTe1QLyNau7Fqckh49ZLOMxt+/yUFw
  7BZy1SbsOFU5Q9D8/RhcQPGX69Wam40dutolucbY38EVAjqr2m7xPi71XAicPNaD
  aeQQmxkqtilX4+U9m5/wAl0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNV
  HQ8BAf8EBAMCAQYwHQYDVR0OBBYEFMSnsaR7LHH62+FLkHX/xBVghYkQMA0GCSqG
  SIb3DQEBBQUAA4IBAQCjGiybFwBcqR7uKGY3Or+Dxz9LwwmglSBd49lZRNI+DT69
  ikugdB/OEIKcdBodfpga3csTS7MgROSR6cz8faXbauX+5v3gTt23ADq1cEmv8uXr
  AvHRAosZy5Q6XkjEGB5YGV8eAlrwDPGxrancWYaLbumR9YbK+rlmM6pZW87ipxZz
  R8srzJmwN0jP41ZL9c8PDHIyh8bwRLtTcm1D9SZImlJnt1ir/md2cXjbDaJWFBM5
  JDGFoqgCWjBH4d1QB7wCCZAA62RjYJsWvIjJEubSfZGL+T0yjWW06XyxV3bqxbYo
  Ob8VZRzI9neWagqNdwvYkQsEjgfbKbYK7p2CNTUQ
  -----END CERTIFICATE-----`
]

class MensaBookingApiClient {
  async performRequest (path, params) {
    if (!this.connection) {
      this.connection = obtainFetchImplementation(ENDPOINT_MODE, {
        proxy: PROXY_URL,
        certs: ENDPOINT_CERTS,
        host: ENDPOINT_HOST,
        closed: () => {
          this.connection = null
        },
        error: err => {
          console.error(err)
          this.connection = null
        }
      })
    }

    const resp = await this.connection.fetch(`https://${ENDPOINT_HOST}${ENDPOINT_URL}${path}`, {
      method: 'POST',
      body: new URLSearchParams(params).toString(),
      headers: {
        Host: ENDPOINT_HOST,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      }
    })

    if (resp.status === 200) {
      return await resp.json()
    } else {
      throw new Error('Mensa Booking API returned an error: ' + await resp.text())
    }
  }

  async requestVerificationEmail(email) {
    const resp = await this.performRequest('/request_access_code', { email })
    if (resp.data !== 'versendet') {
      throw new Error(`Could not request verification E-Mail ${resp.data}`)
    }
  }

  async checkVerificationCode(email, code) {
    const resp = await this.performRequest('/check_access_token', {
      email,
      accesscode: code
    })

    return resp !== 0
  }

  /**
   * Reserves a seat in the Mensa
   * The following fields are required in `params`:
   *   - firstName
   *   - lastName
   *   - address
   *   - postcode
   *   - city
   *   - email
   *   - code (email verification code)
   *   - timestamp (Date object)
   */
  async reserveSeat(params) {
    const data = await this.performRequest('/add_by_client', {
      dauer: 30,
      gruppe: 1,
      vorname: params.firstName,
      name: params.lastName,
      strasse_nr: params.address,
      plz: params.postcode,
      ort: params.city,
      telefon: '',
      email: params.email,
      accesscode: params.code,
      // save_allowed: 'on',
      nutzungsbedingungen: 'on',
      drei_g: 'on',
      date: '',
      date_val: 0,
      einrichtung_val: '7',
      einrichtung: 'Mensa Ingolstadt',
      zeitpunkt: formatISOTime(params.timestamp),
      tkid: '664',
      date_iso: formatISODate(params.timestamp)
    })

    if (data.message.status !== 'success') {
      throw new Error(data.message.info)
    }

    const {
      tag: day,
      uhrzeit_start: startTime,
      uhrzeit_ende: endTime,
      id,
      krz: code,
      tischgruppe: tableGroup,
      tischnr: table
    } = data.reservation.Reservation

    const start = new Date(`${day}T${startTime}`)
    const end = new Date(`${day}T${endTime}`)

    return {
      message: data.message.text,
      start,
      end,
      tableGroup,
      table,
      id,
      code,
      walletUrl: `https://togo.my-mensa.de/wallet/?c=erl77vB3r&order_id=${code}`
    }
  }
}

export default new MensaBookingApiClient()
