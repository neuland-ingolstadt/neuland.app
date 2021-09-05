import obtainFetchImplementation from './fetch-implementations'
import packageInfo from '../../package.json'

const ENDPOINT_MODE = process.env.NEXT_PUBLIC_NEULAND_API_MODE || 'websocket-proxy'
const ENDPOINT_HOST = 'togo.my-mensa.de'
const ENDPOINT_URL = '/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations'

const PROXY_URL = process.env.NEXT_PUBLIC_MENSA_PROXY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const USER_AGENT = `neuland.app/${packageInfo.version} (+${GIT_URL})`

// ISRG Root X1
// valid until 2035-06-04
const ENDPOINT_CERTS = [
  `-----BEGIN CERTIFICATE-----
  MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
  TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
  cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
  WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
  ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
  MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
  h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
  0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
  A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
  T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
  B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
  B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
  KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
  OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
  jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
  qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
  rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
  HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
  hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
  ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
  3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
  NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
  ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
  TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
  jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
  oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
  4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
  mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
  emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
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

    const resp = await this.connection.fetch(`${ENDPOINT_HOST}${ENDPOINT_URL}${path}`, {
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
    if (resp.status !== 200 || (await resp.json()).data !== 'versendet') {
      throw new Error(`Could not request verification E-Mail (${resp.status}) - ${await resp.text()}`)
    }
  }

  async checkVerificationCode(email, code) {
    const resp = await this.performRequest('/check_access_token', {
      email,
      accesscode: code
    })

    if (resp.status !== 200) {
      throw new Error(`Could not check verification code (${resp.status})`)
    }

    return (await resp.json()) !== 0
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
    const time = params.timestamp.toISOString()

    const resp = await this.performRequest('/', {
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
      date_val: 'on',
      date: '',
      einrichtung_val: '7',
      einrichtung: 'Mensa Ingolstadt',
      zeitpunkt: time.substr(11, 5),
      tkid: '664',
      date_iso: time.substr(0, 10)
    })

    if (resp.status !== 200) {
      throw new Error(`Could not reserve seat (${resp.status})`)
    }

    const data = await resp.json()
    if (data.message.status !== 'success') {
      throw new Error(data.message.text)
    }

    const {
      tag: day,
      uhrzeit_start: startTime,
      uhrzeit_ende: endTime,
      krz: code,
      tischgruppe: tableGroup,
      tischnr: table
    } = data.reservation

    const start = new Date(`${day}T${startTime}`)
    const end = new Date(`${day}T${endTime}`)

    return {
      message: data.message.text,
      start,
      end,
      tableGroup,
      table,
      code,
      walletUrl: `https://togo.my-mensa.de/wallet/?c=erl77vB3r&order_id=${code}`
    }
  }
}

export default new NeulandAPIClient()
