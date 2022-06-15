import { Response } from '@miniflare/core'

export function createR2Bucket () {
  const bucket = new Map()

  return {
    put: async (key, value, putOpts = {}) => {
      // TODO: Store metadata
      bucket.set(key, {
        body: value,
        httpMetadata: putOpts.httpMetadata || {},
        customMetadata: putOpts.customMetadata || {}
      })

      return Promise.resolve({
        httpMetadata: putOpts.httpMetadata,
        customMetadata: putOpts.customMetadata,
        size: value.length
      })
    },
    get: async (key) => {
      const value = bucket.get(key)
      if (!value) {
        return undefined
      }

      const response = new Response(value.body, { status: 200 })

      return Promise.resolve(
        Object.assign(response, {
          httpMetadata: value.httpMetadata || {},
          customMetadata: value.customMetadata || {},
          size: value.body.length
        })
      )
    },
    head: async (key) => {
      const value = bucket.get(key)
      if (!value) {
        return undefined
      }

      return Promise.resolve({
        httpMetadata: value.httpMetadata || {},
        customMetadata: value.customMetadata || {},
        size: value.body.length
      })
    },
    delete: async (key) => {
      bucket.delete(key)
      return Promise.resolve()
    }
  }
}
