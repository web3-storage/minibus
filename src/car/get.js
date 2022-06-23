/* eslint-env serviceworker, browser */
/* global Response, TransformStream */

import { CarWriter } from '@ipld/car'
import { CID } from 'multiformats/cid'
import { base32 } from 'multiformats/bases/base32'
import { create as createDigest } from 'multiformats/hashes/digest'
import { IndexSortedReader } from 'cardex'

import { BlockNotFoundError, CarNotFoundError } from '../errors.js'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle car get request, materializing CAR from the index.
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('..').Ctx} ctx
 */
export async function carGet (request, env, ctx) {
  // Get cached car if exists
  const cache = caches.default
  let res = await cache.match(request)
  if (res) {
    return res
  }
  const cid = request.params.cid

  // Get Index
  const r2IndexObject = await env.BLOCKSTORE.get(`${cid}.car.idx`)
  if (!r2IndexObject) {
    throw new CarNotFoundError(`Cannot find car index with cid ${cid}`)
  }

  const indexReader = IndexSortedReader.fromIterable(r2IndexObject.body)

  // Create a pipe and stream the response
  const { readable, writable } = new TransformStream()

  streamCarBlocks(writable, indexReader, env.BLOCKSTORE, cid)
  res = new Response(readable)

  // Store in cache
  ctx.waitUntil(cache.put(request, res.clone()))

  return res
}

/**
 * @param {WritableStream} writable
 * @param {IndexSortedReader} indexReader
 * @param {import('../env').R2Bucket} blockstore
 * @param {string} cid
 */
async function streamCarBlocks (writable, indexReader, blockstore, cid) {
  const responseWriter = writable.getWriter()
  const { writer, out } = await CarWriter.create([CID.parse(cid)])

  await Promise.all([
    (async () => {
      for await (const { digest } of indexReader.entries()) {
        // Get Block
        const key = base32.encode(digest)
        const r2BlockObject = await blockstore.get(key)

        if (!r2BlockObject) {
          throw new BlockNotFoundError(`Cannot find block on CAR with cid ${cid}`)
        }

        // Write block
        const multihashDigest = createDigest(r2BlockObject.customMetadata.digestCode, digest)
        const blockCid = CID.create(1, r2BlockObject.customMetadata.multicodecCode, multihashDigest)
        const bytes = new Uint8Array(await r2BlockObject.arrayBuffer())

        writer.put({ cid: blockCid, bytes })
      }

      await writer.close()
    })(),
    (async () => {
      for await (const bytes of out) {
        responseWriter.write(bytes)
      }
      await responseWriter.close()
    })()
  ])
}
