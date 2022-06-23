/* eslint-env serviceworker, browser */
/* global Response */

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle car put request.
 *
 * Store CAR files by writing the blocks to block storage
 * and writing the CAR header and a CARv2 index of the blocks in R2.
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('..').Ctx} ctx
 */
export async function carPut (request, env, ctx) {
  return new Response('Not yet implemented')
}
