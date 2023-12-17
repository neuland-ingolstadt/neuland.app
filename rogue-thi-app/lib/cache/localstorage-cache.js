const CHECK_INTERVAL = 10000

/**
 * A cache that persists to localStorage and deletes entries after a certain amount of time
 */
export default class LocalStorageCache {
  /**
   * @param {string} namespace Unique key which all cache entries will be prefixed with
   * @param {number} ttl Seconds after which an entry should be discarded
   */
  constructor({ namespace, ttl }) {
    this.namespace = namespace
    this.ttl = ttl
    this.interval = setInterval(() => this.checkExpiry(), CHECK_INTERVAL)
  }

  /**
   * Removes expired cache entries.
   */
  checkExpiry() {
    Object.keys(localStorage)
      .filter(
        (x) =>
          x.startsWith(`${this.namespace}-`) &&
          localStorage[x].expiry < Date.now()
      )
      .forEach((x) => delete localStorage[x])
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
    const json = localStorage[`${this.namespace}-${key}`]
    if (!json) {
      return undefined
    }

    const { value, expiry } = JSON.parse(json)
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
    localStorage[`${this.namespace}-${key}`] = JSON.stringify({
      value,
      expiry: Date.now() + this.ttl,
    })
  }

  /**
   * Deletes a cached value.
   * @param {string} key Cache key
   */
  delete(key) {
    delete localStorage[`${this.namespace}-${key}`]
  }

  /**
   * Removes all cache entries.
   */
  flushAll() {
    Object.keys(localStorage)
      .filter((x) => x.startsWith(`${this.namespace}-`))
      .forEach((x) => delete localStorage[x])
  }
}
