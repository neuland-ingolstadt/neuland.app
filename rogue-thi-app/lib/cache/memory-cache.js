const CHECK_INTERVAL = 10000

/**
 * A simple cache that deletes entries after a certain amount of time
 */
export default class MemoryCache {
  /**
   * @param {number} ttl Seconds after which an entry should be discarded
   */
  constructor ({ ttl }) {
    this.ttl = ttl
    this.cache = new Map()
    this.interval = setInterval(() => this.checkExpiry(), CHECK_INTERVAL)
  }

  checkExpiry () {
    Object.keys(this.cache)
      .filter(x => this.cache.get(x).expiry < Date.now())
      .forEach(x => this.cache.delete(x))
  }

  close () {
    clearInterval(this.interval)
  }

  get (key) {
    const json = this.cache.get(key)
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

  set (key, value) {
    this.cache.set(key, JSON.stringify({
      value,
      expiry: Date.now() + this.ttl
    }))
  }

  flushAll () {
    this.cache.clear()
  }
}
