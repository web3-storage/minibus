#!/usr/bin/env node
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import sade from 'sade'

import { buildCmd } from './build.js'
import { createJwtCmd } from './jwt.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({
  path: path.join(__dirname, '..', '.env')
})

const prog = sade('block-service')

prog
  .command('build')
  .describe('Build the worker.')
  .option('--env', 'Environment', process.env.ENV)
  .action(buildCmd)
  .command('jwt create')
  .describe('Create JWT to interact with service.')
  .option('--env', 'Environment', process.env.ENV)
  .action(createJwtCmd)

prog.parse(process.argv)
