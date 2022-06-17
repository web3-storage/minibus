/* eslint-env serviceworker, browser */
/* global Response */

import { base32 } from 'multiformats/bases/base32'

import { BlockNotFoundError, BaseNotFoundError } from '../errors.js'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle block get request
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('./index').Ctx} ctx
 */
export async function blockGet (request, env, ctx) {
  // Get cached block if exists
  const cache = caches.default
  let res = await cache.match(request)
  if (res) {
    return res
  }

  const multihash = request.params.multihash

  let base
  try {
    const multibasePrefix = multihash[0]
    base = await env.bases.getBase(multibasePrefix)
  } catch (err) {
    throw new BaseNotFoundError()
  }

  let key = multihash
  // We use base32 encoding internally for caching
  if (base.name !== base32.name) {
    const bytes = base.decoder.decode(multihash)

    // Base 32 encoded for R2 key
    key = base32.encode(bytes)
  }

  const r2Object = await env.BLOCKSTORE.get(key)
  if (r2Object) {
    res = new Response(r2Object.body)

    // Store in cache
    ctx.waitUntil(cache.put(request, res.clone()))

    return res
  }

  throw new BlockNotFoundError()
}
