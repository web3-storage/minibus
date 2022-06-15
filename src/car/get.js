/* eslint-env serviceworker, browser */
/* global Response */

/**
 * @typedef {import('../env').Env} Env
 */

/**
 * Handle car get request
 *
 * @param {Request} request
 * @param {Env} env
 * @param {import('..').Ctx} ctx
 */
export async function carGet (request, env, ctx) {
  return new Response('Not yet implemented')
}
