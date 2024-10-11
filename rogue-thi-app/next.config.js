const { i18n } = require('./next-i18next.config')

// https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md
/**
 * Update: December 2023, remove deprecated permissions
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#browser_compatibility
 */
const permissionPolicyFeatures = [
  'accelerometer',
  'autoplay',
  'camera',
  'cross-origin-isolated',
  'display-capture',
  'encrypted-media',
  'fullscreen',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'sync-xhr',
  'usb',
  'web-share',
  'xr-spatial-tracking',
]

const isDev = process.env.NODE_ENV === 'development'
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL
const API_URL = 'https://' + process.env.NEXT_PUBLIC_THI_API_HOST
const NEULAND_API = process.env.NEXT_PUBLIC_NEULAND_GRAPHQL_ENDPOINT

module.exports = {
  i18n,
  trailingSlash: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'deny',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: permissionPolicyFeatures.map((x) => x + '=()').join(', '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'none';
              img-src 'self';
              font-src 'self';
              connect-src 'self' tile.neuland.app ${PROXY_URL} ${API_URL} ${NEULAND_API};
              style-src 'self' 'unsafe-inline';
              script-src 'self'${isDev ? " 'unsafe-eval'" : ''};
              worker-src blob:;
              manifest-src 'self';
              `.replace(/\s+/g, ' '),
          },
        ],
      },
    ]
  },
}
