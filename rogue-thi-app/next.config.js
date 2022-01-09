// https://github.com/w3c/webappsec-permissions-policy/issues/189#issuecomment-904783021
const permissionPolicyFeatures = [
  'accelerometer',
  'ambient-light-sensor',
  'attribution-reporting',
  'autoplay',
  'battery',
  'camera',
  'clipboard-read',
  'clipboard-write',
  'conversion-measurement',
  'cross-origin-isolated',
  'direct-sockets',
  'display-capture',
  'document-domain',
  'encrypted-media',
  'execution-while-not-rendered',
  'execution-while-out-of-viewport',
  'focus-without-user-activation',
  'fullscreen',
  'gamepad',
  'geolocation',
  'gyroscope',
  'hid',
  'idle-detection',
  'interest-cohort',
  'magnetometer',
  'microphone',
  'midi',
  'navigation-override',
  'otp-credentials',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'serial',
  'shared-autofill',
  'speaker-selection',
  'storage-access-api',
  'sync-script',
  'sync-xhr',
  'trust-token-redemption',
  'usb',
  'vertical-scroll',
  'wake-lock',
  'web-share',
  'window-placement',
  'xr-spatial-tracking'
]

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
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
              img-src 'self' data: https://*.tile.openstreetmap.org;
              connect-src 'self' wss://proxy.neuland.app;
              style-src 'self' 'unsafe-inline';
              script-src 'self'${isDev ? ' \'unsafe-eval\'' : ''};
              manifest-src 'self';
              `.replace(/\s+/g, ' ')
          }
        ]
      }
    ]
  }
}
