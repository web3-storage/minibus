import test from 'ava'

import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { base16 } from 'multiformats/bases/base16'
import { base58btc } from 'multiformats/bases/base58'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blob } from '@web-std/fetch'
import { getMiniflare } from './scripts/utils.js'
import { createTestToken } from './scripts/helpers.js'

test.beforeEach(async (t) => {
  const token = await createTestToken()
  // Create a new Miniflare environment for each test
  t.context = {
    mf: getMiniflare(),
    token
  }
})

test('can put and get block with default multihash', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const putBlob = new Blob([data])

  const putResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'PUT',
    body: putBlob,
    headers: { Authorization: `Bearer ${token}` }
  })
  const blockPutResult = await putResponse.json()
  t.truthy(blockPutResult.multihash)

  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${blockPutResult.multihash}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const getBlob = await getResponse.blob()
  t.deepEqual(putBlob.size, getBlob.size)

  const getData = await getBlob.text()
  t.deepEqual(data, getData)
})

test('can put and get block with different multihash encoding', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const putBlob = new Blob([data])

  const putResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'PUT',
    body: putBlob,
    headers: { Authorization: `Bearer ${token}` }
  })
  const blockPutResult = await putResponse.json()
  t.truthy(blockPutResult.multihash)

  const b58Bytes = base58btc.decode(blockPutResult.multihash)
  const b16Multihash = base16.encode(b58Bytes)

  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${b16Multihash}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const getBlob = await getResponse.blob()
  t.deepEqual(putBlob.size, getBlob.size)

  const getData = await getBlob.text()
  t.deepEqual(data, getData)
})

test('fails to get block not previously added', async (t) => {
  const { mf, token } = t.context

  const validMultihash = 'zQmYGx7Wzqe5prvEsTSzYBQN8xViYUM9qsWJSF5EENLcNmM'
  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${validMultihash}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  t.deepEqual(getResponse.status, 404)
  t.deepEqual(await getResponse.text(), '"Requested block not found"')
})

test('fails to get block when non supported multihash prefix is provided', async (t) => {
  const { mf, token } = t.context

  const unsupportedMultihash = 'w122093a23971a914e5eacbf0a8d25154cda309c3c1c72fbb9914d47c60f3cb681588'
  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${unsupportedMultihash}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  t.deepEqual(getResponse.status, 400)
  t.deepEqual(await getResponse.text(), '"Provided encoded base not found"')
})

test('redirects to get multihash if tried to get cid', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const putBlob = new Blob([data])

  const putResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'PUT',
    body: putBlob,
    headers: { Authorization: `Bearer ${token}` }
  })
  const blockPutResult = await putResponse.json()
  t.truthy(blockPutResult.multihash)

  const digestBlob = new Uint8Array(await (new Blob([data])).arrayBuffer())
  const digest = await sha256.digest(digestBlob)
  const cid = CID.createV1(raw.code, digest)

  const getResponseFromCid = await mf.dispatchFetch(`https://localhost:8787/${cid.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  t.is(getResponseFromCid.status, 301)
  t.is(getResponseFromCid.headers.get('location'), `https://localhost:8787/${blockPutResult.multihash}`)
})
