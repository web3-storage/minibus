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

test('can post and get block with default multihash', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const postBlob = new Blob([data])

  const postResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'POST',
    body: postBlob,
    headers: { Authorization: `Basic ${token}` }
  })
  const blockPostResult = await postResponse.json()
  t.truthy(blockPostResult.multihash)

  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${blockPostResult.multihash}`, {
    headers: { Authorization: `Basic ${token}` }
  })
  const getBlob = await getResponse.blob()
  t.deepEqual(postBlob.size, getBlob.size)

  const getData = await getBlob.text()
  t.deepEqual(data, getData)
})

test('can post and get block with different multihash encoding', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const postBlob = new Blob([data])

  const postResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'POST',
    body: postBlob,
    headers: { Authorization: `Basic ${token}` }
  })
  const blockPostResult = await postResponse.json()
  t.truthy(blockPostResult.multihash)

  const b58Bytes = base58btc.decode(blockPostResult.multihash)
  const b16Multihash = base16.encode(b58Bytes)

  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${b16Multihash}`, {
    headers: { Authorization: `Basic ${token}` }
  })
  const getBlob = await getResponse.blob()
  t.deepEqual(postBlob.size, getBlob.size)

  const getData = await getBlob.text()
  t.deepEqual(data, getData)
})

test('fails to get block not previously added', async (t) => {
  const { mf, token } = t.context

  const validMultihash = 'zQmYGx7Wzqe5prvEsTSzYBQN8xViYUM9qsWJSF5EENLcNmM'
  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${validMultihash}`, {
    headers: { Authorization: `Basic ${token}` }
  })

  t.deepEqual(getResponse.status, 404)
  t.deepEqual(await getResponse.text(), '"Requested block not found"')
})

test('can post and block head', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const postBlob = new Blob([data])

  const postResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'POST',
    body: postBlob,
    headers: { Authorization: `Basic ${token}` }
  })
  const blockPostResult = await postResponse.json()
  t.truthy(blockPostResult.multihash)

  const headResponse = await mf.dispatchFetch(`https://localhost:8787/${blockPostResult.multihash}`, {
    method: 'HEAD',
    headers: { Authorization: `Basic ${token}` }
  })
  t.deepEqual(postBlob.size, Number(headResponse.headers.get('content-length')))
})

test('head block fails when not previously added', async (t) => {
  const { mf, token } = t.context

  const validMultihash = 'zQmYGx7Wzqe5prvEsTSzYBQN8xViYUM9qsWJSF5EENLcNmM'
  const headResponse = await mf.dispatchFetch(`https://localhost:8787/${validMultihash}`, {
    method: 'HEAD',
    headers: { Authorization: `Basic ${token}` }
  })

  t.deepEqual(headResponse.status, 404)
  t.deepEqual(await headResponse.text(), '"Requested block not found"')
})

test('fails to get block when non supported multihash prefix is provided', async (t) => {
  const { mf, token } = t.context

  const unsupportedMultihash = 'w122093a23971a914e5eacbf0a8d25154cda309c3c1c72fbb9914d47c60f3cb681588'
  const getResponse = await mf.dispatchFetch(`https://localhost:8787/${unsupportedMultihash}`, {
    headers: { Authorization: `Basic ${token}` }
  })

  t.deepEqual(getResponse.status, 400)
  t.deepEqual(await getResponse.text(), '"Provided encoded base not found"')
})

test('redirects to get multihash if tried to get cid', async (t) => {
  const { mf, token } = t.context

  const data = JSON.stringify({ hello: 'world' })
  const postBlob = new Blob([data])

  const postResponse = await mf.dispatchFetch('https://localhost:8787', {
    method: 'POST',
    body: postBlob,
    headers: { Authorization: `Basic ${token}` }
  })
  const blockPostResult = await postResponse.json()
  t.truthy(blockPostResult.multihash)

  const digestBlob = new Uint8Array(await (new Blob([data])).arrayBuffer())
  const digest = await sha256.digest(digestBlob)
  const cid = CID.createV1(raw.code, digest)

  const getResponseFromCid = await mf.dispatchFetch(`https://localhost:8787/${cid.toString()}`, {
    headers: { Authorization: `Basic ${token}` }
  })
  t.is(getResponseFromCid.status, 301)
  t.is(getResponseFromCid.headers.get('location'), `https://localhost:8787/${blockPostResult.multihash}`)
})
