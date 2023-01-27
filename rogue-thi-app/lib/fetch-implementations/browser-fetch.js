/**
 * A fetch implementation that uses the actual `fetch` method.
 * This wrapper is necessary for compatibility with other implementations.
 */
export default class BrowserFetchConnection {
  async fetch (url, options) {
    return fetch(url, options)
  }
}
