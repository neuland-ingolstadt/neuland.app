import MemoryCache from './cache/memory-cache'

/**
 * This is a wrapper for the fetch method.
 * It caches responses and combines concurrent requests into one.
 */
export default class CachedHttpClient {
  constructor ({ ttl }) {
    this.promises = {}
    this.cache = new MemoryCache({ ttl })
  }

  /**
   * If there is a value cached under the given key, it is returned.
   * Otherwise producer is called exactly once to populate the cache.
   */
  async _get (key, producer) {
    const cachedResult = this.cache.get(key)
    if (cachedResult) {
      return cachedResult
    }

    const promise = this.promises[key]
    if (promise) {
      return await promise
    }

    const result = await (this.promises[key] = producer(key))

    this.cache.set(key, result)

    delete this.promises[key]

    return result
  }

  /**
   * Fetches a JSON file.
   * This uses the URL as a cache key, so beware of fetching private data.
   */
  async fetchJson (url, options) {
    return this._get(url, url => fetch(url, options).then(resp => resp.json()))
  }

  /**
   * Fetches a text file.
   * This uses the URL as a cache key, so beware of fetching private data.
   */
  async fetchText (url, options) {
    return this._get(url, url => fetch(url, options).then(resp => resp.text()))
  }
}
