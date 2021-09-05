export default class BrowserFetchConnection {
  async fetch (url, options) {
    return fetch(url, options)
  }
}
