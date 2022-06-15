/* global BRANCH, VERSION, COMMITHASH, SENTRY_RELEASE */
import Toucan from 'toucan-js'

import { Multibases } from 'ipfs-core-utils/multibases'
import { bases } from 'multiformats/basics'

import pkg from '../package.json'
import { Logging } from './logs.js'

/**
 * @typedef {import('multiformats/bases/interface').MultibaseCodec<any>} MultibaseCodec
 *
 * @typedef {Object} EnvInput
 * @property {string} ENV
 * @property {string} [SENTRY_DSN]
 * @property {string} [LOGTAIL_TOKEN]
 * @property {R2Bucket} BLOCKSTORE
 *
 * @typedef {Object} EnvTransformed
 * @property {string} VERSION
 * @property {string} COMMITHASH
 * @property {string} BRANCH
 * @property {string} DEBUG
 * @property {string} SENTRY_RELEASE
 * @property {Multibases} bases
 * @property {Toucan} [sentry]
 * @property {Logging} [log]
 *
 * @typedef {EnvInput & EnvTransformed} Env
 */

/**
 * @param {Request} request
 * @param {Env} env
 * @param {import('.').Ctx} ctx
 */
export function envAll (request, env, ctx) {
  // These values are replaced at build time by esbuild `define`
  env.BRANCH = BRANCH
  env.VERSION = VERSION
  env.COMMITHASH = COMMITHASH
  env.SENTRY_RELEASE = SENTRY_RELEASE

  env.sentry = getSentry(request, env, ctx)

  env.log = new Logging(request, env, ctx)
  env.log.time('request')

  /** @type {MultibaseCodec[]} */
  const multibaseCodecs = Object.values(bases)
  env.bases = new Multibases({
    bases: multibaseCodecs
  })
}
/**
 * Get sentry instance if configured
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('.').Ctx} ctx
 */
function getSentry (request, env, ctx) {
  if (!env.SENTRY_DSN) {
    return
  }

  return new Toucan({
    request,
    dsn: env.SENTRY_DSN,
    context: ctx,
    allowedHeaders: ['user-agent'],
    allowedSearchParams: /(.*)/,
    debug: false,
    environment: env.ENV || 'dev',
    rewriteFrames: {
      // strip . from start of the filename ./worker.mjs as set by cloudflare, to make absolute path `/worker.mjs`
      iteratee: (frame) => ({
        ...frame,
        filename: frame.filename.substring(1)
      })
    },
    release: env.VERSION,
    pkg
  })
}

/**
 * From: https://github.com/cloudflare/workers-types
 *
 * @typedef {Object} R2PutOptions
 * @property {Headers} [httpMetadata]
 * @property {Record<string, string>} [customMetadata]
 *
 * @typedef {Object} R2Object
 * @property {Date} uploaded
 * @property {number} size
 * @property {Headers} [httpMetadata]
 * @property {Record<string, string>} [customMetadata]
 *
 * @typedef {Object} R2ObjectBody
 * @property {ReadableStream} body
 * @property {() => Promise<ArrayBuffer>} arrayBuffer
 * @property {() => Promise<string>} text
 * @property {() => Promise<JSON>} json
 * @property {() => Promise<Blob>} blob
 * @property {Date} uploaded
 * @property {Headers} [httpMetadata]
 * @property {Record<string, string>} [customMetadata]
 *
 * @typedef {Object} R2Bucket
 * @property {(key: string) => Promise<R2Object | null>} head
 * @property {(key: string) => Promise<Response & R2Object | null>} get
 * @property {(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null, options?: R2PutOptions) => Promise<R2Object>} put
 * @property {(key: string) => Promise<void>} delete
 */
