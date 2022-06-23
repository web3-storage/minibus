import * as JWT from '../../scripts/jwt.js'
import { globals } from './worker-globals.js'

export async function createTestToken () {
  const token = await JWT.sign(
    {
      iss: 'web3_storage_minibus',
      iat: Date.now(),
      name: 'test'
    },
    globals.SALT
  )

  return token
}
