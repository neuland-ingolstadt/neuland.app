import MemoryCache from './memory-cache'

const DEFAULT_BACKOFF = 60000

/**
 * A MemoryCache that can populate itself from an asynchronous function (such as a network request).
 * It uses exponential backoff to avoid calling the producer too often when it throws an exception.
 */
export default class AsyncMemoryCache extends MemoryCache {
  /**
   * @param {number} ttl Seconds after which an entry should be discarded
   * @param {number} backoff Seconds to wait before retrying a failed request
   */
  constructor ({ ttl, backoff }) {
    super({ ttl })
    this.backoff = backoff || DEFAULT_BACKOFF
    this.timers = new Map()
  }

  /**
   * If there is a value cached under the given key, it is returned.
   * Otherwise producer is called exactly once to populate the cache.
   *
   * @param {object} producer Async function that returns the value to be cached
   */
  async get (key, producer) {
    // check if there is a cached result
    const promise = super.get(key)
    if (promise) {
      return await promise
    }

    // check if we need to back off
    const { until, count, error } = this.timers.get(key) || {}
    if (until && Date.now() < until) {
      console.debug(`Failed ${count} times, backing off until ${new Date(until)}`)
      throw error
    }

    try {
      // call the producer and remember the promise
      const promise = producer(key)
      super.set(key, promise)

      // wait until the promise resolves
      const result = await promise

      // the promise resolved successfully
      // clear the backoff timer
      this.timers.delete(key)

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
    }
  }

  /**
   * Prevents writing to the underlying cache.
   */
  set (key, value) {
    throw new Error('Values can not be set directly')
  }
}
