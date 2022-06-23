import test from 'ava'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { equals } from 'uint8arrays/equals'

import { CarReader, CarBlockIterator } from '@ipld/car'

import { getMiniflare } from './scripts/utils.js'
import { createTestToken } from './scripts/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.beforeEach(async (t) => {
  const token = await createTestToken()
  // Create a new Miniflare environment for each test
  t.context = {
    mf: getMiniflare(),
    token
  }
})

test('can put a car and read it', async (t) => {
  const { mf, token } = t.context

  const rootCid = 'bafybeicpxveeln3sd4scqlacrunxhzmvslnbgxa72evmqg7r27emdek464'
  const carPath = path.join(__dirname, 'fixtures', `${rootCid}.car`)
  const carStreamPutRequest = fs.createReadStream(carPath)

  // Put CAR to block service
  const putResponse = await mf.dispatchFetch('https://localhost:8787/car', {
    method: 'PUT',
    body: carStreamPutRequest,
    headers: { Authorization: `Bearer ${token}` }
  })
  t.deepEqual(putResponse.status, 200)

  const getResponse = await mf.dispatchFetch(`https://localhost:8787/car/${rootCid}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  t.deepEqual(getResponse.status, 200)

  const responseReader = await CarReader.fromIterable(getResponse.body)
  const responseRoots = await responseReader.getRoots()

  const carStreamValidation = fs.createReadStream(carPath)
  const fixtureCarIterator = await CarBlockIterator.fromIterable(carStreamValidation)
  const fixtureRoots = await fixtureCarIterator.getRoots()

  t.deepEqual(responseRoots.length, fixtureRoots.length)
  t.deepEqual(responseRoots[0], fixtureRoots[0])

  for await (const { cid, bytes } of fixtureCarIterator) {
    const responseBlock = await responseReader.get(cid)

    t.deepEqual(equals(responseBlock.bytes, bytes), true)
  }
})

test('fails to get CAR not previously added', async (t) => {
  const { mf, token } = t.context

  const rootCid = 'bafybeicpxveeln3sd4scqlacrunxhzmvslnbgxa72evmqg7r27emdek464'
  const getResponse = await mf.dispatchFetch(`https://localhost:8787/car/${rootCid}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  t.deepEqual(getResponse.status, 404)
  t.deepEqual(await getResponse.text(), `"Cannot find car index with cid ${rootCid}"`)
})
