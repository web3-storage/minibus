/* eslint-env serviceworker */
/* global crypto */

/** @type {Record<string, HmacImportParams>} */
const algorithms = {
  HS256: {
    name: 'HMAC',
    hash: {
      name: 'SHA-256'
    }
  }
}

// Adapted from https://chromium.googlesource.com/chromium/blink/+/master/LayoutTests/crypto/subtle/hmac/sign-verify.html
const Base64URL = {
  stringify: function (/** @type {Uint8Array} */ a) {
    // @ts-ignore
    const base64string = btoa(String.fromCharCode.apply(0, a))
    return base64string
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  },
  parse: function (/** @type {string} */ s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
    return new Uint8Array(
      // @ts-ignore
      Array.prototype.map.call(atob(s), function (c) {
        return c.charCodeAt(0)
      })
    )
  }
}

/**
 * @param {any} s
 */
function isString (s) {
  return typeof s === 'string'
}

/**
 * @param {string | number | boolean} str
 */
function utf8ToUint8Array (str) {
  str = btoa(unescape(encodeURIComponent(str)))
  return Base64URL.parse(str)
}

/**
 * @param {string} token
 * @param {string} secret
 * @param {string} alg
 */
export async function verify (token, secret, alg = 'HS256') {
  if (!isString(token)) {
    throw new Error('token must be a string')
  }

  if (!isString(secret)) {
    throw new Error('secret must be a string')
  }

  if (!isString(alg)) {
    throw new Error('alg must be a string')
  }

  const tokenParts = token.split('.')

  if (tokenParts.length !== 3) {
    return false
  }

  const importAlgorithm = algorithms[alg]

  if (!importAlgorithm) {
    throw new Error('algorithm not found')
  }

  const keyData = utf8ToUint8Array(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    importAlgorithm,
    false,
    ['sign']
  )
  const headerPayload = tokenParts.slice(0, 2).join('.')
  const signature = tokenParts[2]
  const signedHeaderPayload = await crypto.subtle.sign(
    importAlgorithm.name,
    key,
    utf8ToUint8Array(headerPayload)
  )

  return Base64URL.stringify(new Uint8Array(signedHeaderPayload)) === signature
}
