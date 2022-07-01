import { NoTokenError, ExpectedBasicStringError, NoValidTokenError } from './errors.js'

/**
 * Middleware: verify the request is authenticated with a valid JWT token.
 *
 * @param {import('itty-router').RouteHandler} handler
 * @returns {import('itty-router').RouteHandler}
 */
export function withAuthToken (handler) {
  /**
   * @param {Request} request
   * @param {import('./env').Env} env
   * @returns {Promise<Response>}
   */
  return async (request, env, ctx) => {
    const token = getTokenFromRequest(request)
    if (token !== env.SECRET) {
      throw new NoValidTokenError()
    }
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
  if (!header.toLowerCase().startsWith('basic ')) {
    throw new ExpectedBasicStringError()
  }

  return header.substring(6)
}
