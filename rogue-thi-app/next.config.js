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
            value: 'max-age=31536000'
          }
        ]
      }
    ]
  }
}
