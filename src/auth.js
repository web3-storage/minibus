import * as JWT from './utils/jwt.js'
import { NoTokenError, ExpectedBearerStringError } from './errors.js'

/**
 * Middleware: verify the request is authenticated with a valid JWT token.
 *
 * @param {import('itty-router').RouteHandler} handler
 * @returns {import('itty-router').RouteHandler}
 */
export function withAuthToken (handler) {
  /**
   * @param {Request} request
   * @param {import('./env').Env}
   * @returns {Promise<Response>}
   */
  return async (request, env, ctx) => {
    const token = getTokenFromRequest(request)

    await JWT.verify(token, env.SALT)
    return handler(request, env, ctx)
  }
}

function getTokenFromRequest (request) {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader) {
    throw new NoTokenError()
  }

  const token = parseAuthorizationHeader(authHeader)
  if (!token) {
    throw new NoTokenError()
  }
  return token
}

function parseAuthorizationHeader (header) {
  if (!header.toLowerCase().startsWith('bearer ')) {
    throw new ExpectedBearerStringError()
  }

  return header.substring(7)
}
