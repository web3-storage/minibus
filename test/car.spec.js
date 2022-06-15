import test from 'ava'

import { getMiniflare } from './scripts/utils.js'

test.beforeEach((t) => {
  // Create a new Miniflare environment for each test
  t.context = {
    mf: getMiniflare()
  }
})

test('car not implemented', async (t) => {
  const { mf } = t.context

  const response = await mf.dispatchFetch('https://localhost:8787/car/bafy')
  const carResult = await response.text()

  t.deepEqual(carResult, 'Not yet implemented')
})
