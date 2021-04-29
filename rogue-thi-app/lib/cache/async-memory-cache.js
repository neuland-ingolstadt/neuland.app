import MemoryCache from './memory-cache'

const DEFAULT_BACKOFF = 60000

/**
 * A MemoryCache that can populate itself from an asynchronous function (such as a network request).
 * It uses exponential backoff to avoid calling the producer too often when it throws an exception.
 */
export default class AsyncMemoryCache extends MemoryCache {
  constructor ({ ttl, backoff }) {
    super({ ttl })
    this.backoff = backoff || DEFAULT_BACKOFF
    this.promises = new Map()
    this.timers = new Map()
  }

  /**
   * If there is a value cached under the given key, it is returned.
   * Otherwise producer is called exactly once to populate the cache.
   */
  async get (key, producer) {
    // check if there is a cached result
    const cachedValue = super.get(key)
    if (cachedValue) {
      return cachedValue
    }

    // check if we need to back off
    const { until, count, error } = this.timers.get(key) || {}
    if (until && Date.now() < until) {
      console.debug(`Failed ${count} times, backing off until ${new Date(until)}`)
      throw error
    }

    // check if there is an ongoing promise
    if (this.promises.has(key)) {
      return await this.promises.get(key)
    }

    try {
      // call the producer and remember the promise
      const promise = producer(key)
      this.promises.set(key, promise)

      // wait until the promise resolves
      const result = await promise

      // the promise resolved successfully
      // clear the backoff timer and remember the result
      this.timers.delete(key)
      super.set(key, result)

      // return the result
      return result
    } catch (e) {
      // the promise rejected
      // back off exponentially
      this.timers.set(key, {
        until: Date.now() + this.backoff * 2 ** (count || 0),
        count: (count || 0) + 1,
        error: e
      })

      throw e
    } finally {
      // clean up the promise
      this.promises.delete(key)
    }
  }
}
