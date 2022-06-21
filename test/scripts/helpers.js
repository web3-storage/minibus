import * as JWT from './jwt.js'
import { globals } from './worker-globals.js'

export async function createTestToken ({
  publicAddress = `0x73573${Date.now()}`,
  issuer = `did:eth:${publicAddress}`
} = {}) {
  const token = await JWT.sign(
    {
      sub: issuer,
      iss: 'web3_storage_minibus',
      iat: Date.now(),
      name: 'test'
    },
    globals.SALT
  )

  return token
}
