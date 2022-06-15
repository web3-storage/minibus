export class HTTPError extends Error {
  /**
   *
   * @param {string} message
   * @param {number} [status]
   */
  constructor (message, status = 500) {
    super(message)
    this.name = 'HTTPError'
    this.status = status
  }
}

export class BlockNotFoundError extends HTTPError {
  constructor (msg = 'Requested block not found') {
    super(msg, 401)
    this.name = 'BlockNotFound'
    this.code = BlockNotFoundError.CODE
  }
}
BlockNotFoundError.CODE = 'ERROR_BLOCK_NOT_FOUND'

export class BaseNotFoundError extends HTTPError {
  constructor (msg = 'Provided encoded base not found') {
    super(msg, 401)
    this.name = 'BaseNotFound'
    this.code = BaseNotFoundError.CODE
  }
}
BaseNotFoundError.CODE = 'ERROR_BASE_NOT_FOUND'
