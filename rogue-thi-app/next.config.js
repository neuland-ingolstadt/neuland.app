const { i18n } = require('./next-i18next.config')

// https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md
const permissionPolicyFeatures = [
  'accelerometer',
  'ambient-light-sensor',
  'autoplay',
  'battery',
  'camera',
  'cross-origin-isolated',
  'display-capture',
  'document-domain',
  'encrypted-media',
  'fullscreen',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'navigation-override',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'sync-xhr',
  'usb',
  'web-share',
  'xr-spatial-tracking'
]

const isDev = process.env.NODE_ENV === 'development'
const DEEPL_ENDPOINT = process.env.NEXT_PUBLIC_DEEPL_ENDPOINT || ''

module.exports = {
  i18n,
  trailingSlash: true,
  async headers () {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'deny'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Permissions-Policy',
            value: permissionPolicyFeatures
              .map(x => x + '=()')
              .join(', ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'none';
              img-src 'self' data: https://tile.openstreetmap.org;
              font-src 'self';
              connect-src 'self' wss://proxy.neuland.app https://hiplan.thi.de ${DEEPL_ENDPOINT};
              style-src 'self' 'unsafe-inline';
              script-src 'self'${isDev ? ' \'unsafe-eval\'' : ''};
              manifest-src 'self';
              prefetch-src 'self';
              `.replace(/\s+/g, ' ')
          }
        ]
      }
    ]
  }
}
