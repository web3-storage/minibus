/* eslint-env serviceworker, browser */
/* global Response */

import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'

import { BlockNotFoundError, BaseNotFoundError } from '../errors.js'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle block get request
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('../index').Ctx} ctx
 */
export async function blockGet (request, env, ctx) {
  // Get cached block if exists
  const cache = caches.default
  let res = await cache.match(request)
  if (res) {
    return res
  }

  const multihashOrCid = request.params.multihash

  // Permanently redirect to multihash if cid provided
  // Note that CIDv0 and multihash encoded as b58btc will be the same
  const multihashByCidValue = getMultihashFromCidValue(multihashOrCid)
  if (multihashByCidValue && multihashByCidValue !== multihashOrCid) {
    return Response.redirect(
      request.url.replace(multihashOrCid, multihashByCidValue),
      301
    )
  }

  const multihash = multihashOrCid
  const key = await toBase58btc(multihash, env.bases)

  const r2Object = await env.BLOCKSTORE.get(key)
  if (r2Object) {
    res = new Response(r2Object.body, {
      headers: {
        'Cache-Control': 'immutable'
      }
    })

    // Store in cache
    ctx.waitUntil(cache.put(request, res.clone()))

    return res
  }

  throw new BlockNotFoundError()
}

/**
 * Get multihash from CID if provided value is a cid.
 *
 * @param {string} value
 */
function getMultihashFromCidValue (value) {
  let multihash

  try {
    const cid = CID.parse(value)
    multihash = base58btc.encode(cid.multihash.bytes)
  } catch (err) {
    return
  }

  return multihash
}

/**
 * Encode given multihash into base58btc.
 *
 * @param {string} multihash
 * @param {import('ipfs-core-utils/multibases').Multibases} bases
 */
async function toBase58btc (multihash, bases) {
  let base
  try {
    const multibasePrefix = multihash[0]
    base = await bases.getBase(multibasePrefix)
  } catch (err) {
    throw new BaseNotFoundError()
  }

  let encodedMultihash = multihash
  // We use base58btc encoding internally for caching
  if (base.name !== base58btc.name) {
    const bytes = base.decoder.decode(multihash)

    // Base 58 encoded for R2 key
    encodedMultihash = base58btc.encode(bytes)
  }

  return encodedMultihash
}
