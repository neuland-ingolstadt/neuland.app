import MemoryCache from './memory-cache'

/**
 * A MemoryCache that can populate itself from an asynchronous function (such as a network request)
 */
export default class AsyncMemoryCache extends MemoryCache {
  constructor ({ ttl }) {
    super({ ttl })
    this.promises = {}
  }

  /**
   * If there is a value cached under the given key, it is returned.
   * Otherwise producer is called exactly once to populate the cache.
   */
  async get (key, producer) {
    const cachedResult = super.get(key)
    if (cachedResult) {
      return cachedResult
    }

    if (this.promises.hasOwnProperty(key)) {
      return await this.promises[key]
    }

    try {
      const result = await (this.promises[key] = producer(key))

      super.set(key, result)

      return result
    } finally {
      delete this.promises[key]
    }
  }
}
