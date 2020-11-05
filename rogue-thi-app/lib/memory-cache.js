const CHECK_INTERVAL = 10000

export default class MemoryCache {
  constructor ({ ttl }) {
    this.ttl = ttl
    this.cache = {}
    this.interval = setInterval(() => this.checkExpiry(), CHECK_INTERVAL)
  }

  checkExpiry () {
    Object.keys(this.cache)
      .filter(x => this.cache[x].expiry < Date.now())
      .forEach(x => delete this.cache[x])
  }

  close () {
    clearInterval(this.interval)
  }

  get (key) {
    const json = this.cache[key]
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
    this.cache[key] = JSON.stringify({
      value,
      expiry: Date.now() + this.ttl
    })
  }

  flushAll () {
    this.cache = {}
  }
}
