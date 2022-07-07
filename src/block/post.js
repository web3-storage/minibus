/* eslint-env serviceworker, browser */

import { base58btc } from 'multiformats/bases/base58'
import { sha256 } from 'multiformats/hashes/sha2'

import { MAX_BLOCK_SIZE } from '../constants.js'
import { JSONResponse } from '../utils/json-response.js'

import { BlockSizeInvalidError } from '../errors.js'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle block post request
 *
 * @param {Request} request
 * @param {Env} env
 */
export async function blockPost (request, env) {
  const buffer = await request.arrayBuffer()
  const data = new Uint8Array(buffer)

  if (data.byteLength >= MAX_BLOCK_SIZE) {
    throw new BlockSizeInvalidError()
  }

  const digestResult = await sha256.digest(data)
  // base58btc encoded for R2 key
  const key = base58btc.encode(digestResult.bytes)

  await env.BLOCKSTORE.put(key, data, {
    customMetadata: {
      digestCode: sha256.code
    }
  })

  return new JSONResponse({
    multihash: key // base58btc encoded
  })
}
