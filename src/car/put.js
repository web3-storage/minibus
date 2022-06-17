/* eslint-env serviceworker, browser */
/* global Response */

// import { CID } from 'multiformats/cid'
import { concat } from 'uint8arrays/concat'
import { base32 } from 'multiformats/bases/base32'
import { CarBlockIterator, CarIndexer } from '@ipld/car'
import { IndexSortedWriter } from 'cardex'

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle car put request.
 *
 * Store CAR files by writing the blocks to block storage
 * and writing the CAR header and a CARv2 index of the blocks in R2.
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('..').Ctx} ctx
 */
export async function carPut (request, env, ctx) {
  const [carBlockInStream, indexerInStream] = request.body.tee()

  // Blocks reader
  const blockReader = await CarBlockIterator.fromIterable(carBlockInStream)
  const roots = await blockReader.getRoots()

  // Indexer
  const indexerReader = await CarIndexer.fromIterable(indexerInStream)
  const { writer, out } = IndexSortedWriter.create()

  await Promise.all([
    // Read Blocks to Blockstore
    (async () => {
      for await (const { cid, bytes } of blockReader) {
        // Base 32 encoded for R2 key
        const key = base32.encode(cid.multihash.digest)
        await env.BLOCKSTORE.put(key, bytes, {
          customMetadata: {
            multicodecCode: cid.code,
            digestCode: cid.multihash.code
          }
        })
      }
    })(),
    // Create Index
    (async () => {
      for await (const blockIndexData of indexerReader) {
        await writer.put(blockIndexData)
      }
      await writer.close()
    })(),
    // Write index
    (async () => {
      const chunks = []
      for await (const chunk of out) {
        chunks.push(chunk)
      }
      const index = concat(chunks)
      // Index key
      const key = `${roots[0].toString()}.car.idx`
      await env.BLOCKSTORE.put(key, index)
    })()
  ])

  return new Response()
}
