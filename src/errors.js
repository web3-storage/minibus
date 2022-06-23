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

export class NoTokenError extends HTTPError {
  constructor (msg = 'No token found in `Authorization: Bearer ` header') {
    super(msg, 401)
    this.name = 'NoToken'
    this.code = NoTokenError.CODE
  }
}
NoTokenError.CODE = 'ERROR_NO_TOKEN'

export class ExpectedBearerStringError extends HTTPError {
  constructor (msg = 'Expected argument to be a string in the `Bearer {token}` format') {
    super(msg, 401)
    this.name = 'ExpectedBearerString'
    this.code = ExpectedBearerStringError.CODE
  }
}
ExpectedBearerStringError.CODE = 'ERROR_NO_TOKEN'

export class BlockNotFoundError extends HTTPError {
  constructor (msg = 'Requested block not found') {
    super(msg, 404)
    this.name = 'BlockNotFound'
    this.code = BlockNotFoundError.CODE
  }
}
BlockNotFoundError.CODE = 'ERROR_BLOCK_NOT_FOUND'

export class BlockSizeInvalidError extends HTTPError {
  constructor (msg = 'Provided block has invalid size') {
    super(msg, 400)
    this.name = 'BlockSizeInvalid'
    this.code = BlockSizeInvalidError.CODE
  }
}
BlockSizeInvalidError.CODE = 'ERROR_BLOCK_SIZE_INVALID'

export class BaseNotFoundError extends HTTPError {
  constructor (msg = 'Provided encoded base not found') {
    super(msg, 400)
    this.name = 'BaseNotFound'
    this.code = BaseNotFoundError.CODE
  }
}
BaseNotFoundError.CODE = 'ERROR_BASE_NOT_FOUND'
