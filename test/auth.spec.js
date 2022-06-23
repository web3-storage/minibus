import test from 'ava'
import { getMiniflare } from './scripts/utils.js'
import { createTestToken } from './scripts/helpers.js'

test.beforeEach(async (t) => {
  // Create a new Miniflare environment for each test
  t.context = {
    mf: getMiniflare()
  }
})

test('Fails with 401 authentication when no token provided', async (t) => {
  const { mf } = t.context

  const response = await mf.dispatchFetch('https://localhost:8787', {
    method: 'PUT'
  })
  t.is(response.status, 401)
})

test('Fails with 401 authentication when invalid token provided', async (t) => {
  const { mf } = t.context
  const token = await createTestToken()

  const response = await mf.dispatchFetch('https://localhost:8787', {
    method: 'PUT',
    headers: { Authorization: `${token}` } // Not Bearer /token/
  })
  t.is(response.status, 401)
})
