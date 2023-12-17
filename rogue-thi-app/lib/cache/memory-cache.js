const CHECK_INTERVAL = 10000

/**
 * A simple cache that deletes entries after a certain amount of time
 */
export default class MemoryCache {
  /**
   * @param {number} ttl Seconds after which an entry should be discarded
   */
  constructor({ ttl }) {
    this.ttl = ttl
    this.cache = new Map()
    this.interval = setInterval(() => this.checkExpiry(), CHECK_INTERVAL)
  }

  /**
   * Removes expired cache entries.
   */
  checkExpiry() {
    Object.keys(this.cache)
      .filter((x) => this.cache.get(x).expiry < Date.now())
      .forEach((x) => this.cache.delete(x))
  }

  /**
   * Stops the cache.
   */
  close() {
    clearInterval(this.interval)
  }

  /**
   * Returns a cached value or `undefined` if no value is found.
   * @param {string} key Cache key
   * @returns {*} Cached value
   */
  get(key) {
    const json = this.cache.get(key)
    if (!json) {
      return undefined
    }

    const { value, expiry } = json
    if (expiry > Date.now()) {
      return value
    } else {
      return undefined
    }
  }

  /**
   * Caches a value.
   * @param {string} key Cache key
   * @param {*} value Value to be cached (must be serializable)
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    })
  }

  /**
   * Deletes a cached value.
   * @param {string} key Cache key
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Removes all cache entries.
   */
  flushAll() {
    this.cache.clear()
  }
}
