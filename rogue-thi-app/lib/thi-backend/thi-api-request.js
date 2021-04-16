/**
 * Client to interact with hiplan.thi.de via a websockify proxy.
 */

import HttpsConnection from './https-connection'
import { version } from '../../package.json'

const ENDPOINT_HOST = 'hiplan.thi.de'
const ENDPOINT_URL = '/webservice/production2/index.php'
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const USER_AGENT = `neuland.app/${version} (+${GIT_URL})`

// T-TeleSec GlobalRoot Class 2
// valid until 02.10.2033, 1:59:59 CEST
const THI_CERTS = [
  `-----BEGIN CERTIFICATE-----
  MIIDwzCCAqugAwIBAgIBATANBgkqhkiG9w0BAQsFADCBgjELMAkGA1UEBhMCREUx
  KzApBgNVBAoMIlQtU3lzdGVtcyBFbnRlcnByaXNlIFNlcnZpY2VzIEdtYkgxHzAd
  BgNVBAsMFlQtU3lzdGVtcyBUcnVzdCBDZW50ZXIxJTAjBgNVBAMMHFQtVGVsZVNl
  YyBHbG9iYWxSb290IENsYXNzIDIwHhcNMDgxMDAxMTA0MDE0WhcNMzMxMDAxMjM1
  OTU5WjCBgjELMAkGA1UEBhMCREUxKzApBgNVBAoMIlQtU3lzdGVtcyBFbnRlcnBy
  aXNlIFNlcnZpY2VzIEdtYkgxHzAdBgNVBAsMFlQtU3lzdGVtcyBUcnVzdCBDZW50
  ZXIxJTAjBgNVBAMMHFQtVGVsZVNlYyBHbG9iYWxSb290IENsYXNzIDIwggEiMA0G
  CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCqX9obX+hzkeXaXPSi5kfl82hVYAUd
  AqSzm1nzHoqvNK38DcLZSBnuaY/JIPwhqgcZ7bBcrGXHX+0CfHt8LRvWurmAwhiC
  FoT6ZrAIxlQjgeTNuUk/9k9uN0goOA/FvudocP05l03Sx5iRUKrERLMjfTlH6VJi
  1hKTXrcxlkIF+3anHqP1wvzpesVsqXFP6st4vGCvx9702cu+fjOlbpSD8DT6Iavq
  jnKgP6TeMFvvhk1qlVtDRKgQFRzlAVfFmPHmBiiRqiDFt1MmUUOyCxGVWOHAD3bZ
  wI18gfNycJ5v/hqO2V81xrJvNHy+SE/iWjnX2J14np+GPgNeGYtEotXHAgMBAAGj
  QjBAMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS/
  WSA2AHmgoCJrjNXyYdK4LMuCSjANBgkqhkiG9w0BAQsFAAOCAQEAMQOiYQsfdOhy
  NsZt+U2e+iKo4YFWz827n+qrkRk4r6p8FU3ztqONpfSO9kSpp+ghla0+AGIWiPAC
  uvxhI+YzmzB6azZie60EI4RYZeLbK4rnJVM3YlNfvNoBYimipidx5joifsFvHZVw
  IEoHNN/q/xWA5brXethbdXwFeilHfkCoMRN3zUA7tFFHei4R40cR3p1m0IvVVGb6
  g1XqfMIpiRvpb7PO4gWEyS8+eIVibslfwXhjdFjASBgMmTnrpMwatXlajRWc2BQN
  9noHV8cigwUtPJslJj0Ys6lDfMjIq2SPDqO/nBudMNva0Bkuqjzx+zOAduTNrRlP
  BSeOE6Fuwg==
  -----END CERTIFICATE-----`
]

let connection = null

/**
 * Submits an API request to the THI backend using a WebSocket proxy
 */
export async function thiApiRequest (params) {
  const paramList = []
  for (const key in params) { paramList.push(key + '=' + encodeURIComponent(params[key])) }

  if (!connection) {
    connection = new HttpsConnection({
      proxy: PROXY_URL,
      certs: THI_CERTS,
      host: ENDPOINT_HOST,
      closed: () => {
        connection = null
      },
      error: err => {
        console.error(err)
        connection = null
      }
    })
  }

  const resp = await connection.fetch(`https://${ENDPOINT_HOST}${ENDPOINT_URL}`, {
    method: 'POST',
    body: paramList.join('&'),
    headers: {
      Host: ENDPOINT_HOST,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    }
  })
  return await resp.json()
}
