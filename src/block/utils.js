import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'

import { BaseNotFoundError } from '../errors.js'

/**
 * Get multihash from CID if provided value is a cid.
 *
 * @param {string} value
 */
export function getMultihashFromCidValue (value) {
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
export async function toBase58btc (multihash, bases) {
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
