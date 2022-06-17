/* eslint-env serviceworker, browser */

import { base32 } from 'multiformats/bases/base32'
import { sha256 } from 'multiformats/hashes/sha2'

import { JSONResponse } from '../utils/json-response.js'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle block put request
 *
 * @param {Request} request
 * @param {Env} env
 */
export async function blockPut (request, env) {
  const buffer = await request.arrayBuffer()
  const data = new Uint8Array(buffer)

  // Get multihash
  const digest = await sha256.digest(data)

  // Base 32 encoded for R2 key
  const key = base32.encode(digest.bytes)
  // TODO: code, digest...
  await env.BLOCKSTORE.put(key, data)

  return new JSONResponse({
    multihash: key // base32 encoded
  })
}
