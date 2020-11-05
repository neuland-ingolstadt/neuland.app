const CHECK_INTERVAL = 10000

export default class LocalStorageCache {
  constructor ({ namespace, ttl }) {
    this.namespace = namespace
    this.ttl = ttl
    this.interval = setInterval(() => this.checkExpiry(), CHECK_INTERVAL)
  }

  checkExpiry () {
    Object.keys(localStorage)
      .filter(x => x.startsWith(`${this.namespace}-`) && localStorage[x].expiry < Date.now())
      .forEach(x => delete localStorage[x])
  }

  close () {
    clearInterval(this.interval)
  }

  get (key) {
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

  set (key, value) {
    localStorage[`${this.namespace}-${key}`] = JSON.stringify({
      value,
      expiry: Date.now() + this.ttl
    })
  }

  flushAll () {
    let i = 0
    let key = localStorage.key(i)
    do {
      localStorage.removeItem(key)
      i++
      key = localStorage.key(i)
    } while(typeof key === 'string')
  }
}
