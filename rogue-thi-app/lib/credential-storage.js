import { openDB } from 'idb'

const STORE_NAME = 'credentials'

function objectToArrayBuffer(obj) {
  return new TextEncoder().encode(JSON.stringify(obj))
}

function arrayBufferToObject(buf) {
  return JSON.parse(new TextDecoder().decode(buf))
}

/**
 * Stores credentials in IndexedDB, encrypted with a non-extractable key.
 * This does not prevent a bad actor from stealing credentials from a device
 * that he has access to, but at least the credentials are not stored in plain
 * text in localStorage.
 *
 * In the future (when Safari supports PasswordCredential), this should be
 * replaced with the Credential Management API.
 */
export default class CredentialStorage {
  /**
   * @param {string} name Namespace for the credential storage
   */
  constructor(name) {
    this.name = name

    if (typeof window === 'undefined') {
      throw new Error('Browser is required')
    }
    if (typeof window.indexedDB === 'undefined') {
      throw new Error('Browser does not support IndexedDB')
    }
    if (typeof window.crypto === 'undefined') {
      throw new Error('Browser does not support SubtleCrypto')
    }
  }

  async _openDatabase() {
    return await openDB(this.name, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      },
    })
  }

  /**
   * Saves credentials in the storage.
   * @param {string} id Unique identifier for this set of credentials
   * @param {object} data Object containing the credentials
   */
  async write(id, data) {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    )
    const iv = crypto.getRandomValues(new Uint8Array(12)) // AES-GCM typically uses a 12-byte IV

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      objectToArrayBuffer(data)
    )

    const db = await this._openDatabase()
    try {
      await db.put(STORE_NAME, { id, key, iv, encrypted })
    } finally {
      db.close()
    }
  }

  /**
   * Reads credentials from the storage.
   * @param {string} id Identifier as used in `write`
   * @returns {object} Object containing the credentials
   */
  async read(id) {
    const db = await this._openDatabase()
    try {
      const { key, iv, encrypted } = (await db.get(STORE_NAME, id)) || {}

      if (!key) {
        return
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encrypted
      )

      return arrayBufferToObject(decrypted)
    } finally {
      db.close()
    }
  }

  /**
   * Deletes a set of credentials from the storage
   * @param {string} id Identifier as used in `write`
   */
  async delete(id) {
    const db = await this._openDatabase()
    try {
      await db.delete(STORE_NAME, id)
    } finally {
      db.close()
    }
  }
}