import { globals } from './worker-globals.js'

export async function createTestToken () {
  const token = globals.SECRET

  return token
}
