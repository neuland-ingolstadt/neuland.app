import MemoryCache from './memory-cache'
import LocalStorageCache from './localstorage-cache'

const CACHE_NAMESPACE = 'reimplemented-api-client'
const CACHE_TTL = 10 * 60 * 1000

const KEY_GET_MENSA_PLAN = 'getMensaPlan'

let cache
if (typeof localStorage === 'undefined') {
  cache = new MemoryCache({
    ttl: CACHE_TTL
  })
} else {
  cache = new LocalStorageCache({
    namespace: CACHE_NAMESPACE,
    ttl: CACHE_TTL
  })
}

export async function getMensaPlan () {
  let res = cache.get(KEY_GET_MENSA_PLAN)
  if (!res) {
    res = await fetch('/api/mensa').then(res => res.json())
  }

  cache.set(KEY_GET_MENSA_PLAN, res)

  return res
}