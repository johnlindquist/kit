import * as all from "execa"
import type { Options } from "execa"
import { getCleanEnvForLaunch } from "../platform/base.js"

export let execa = all.execa
global.execa = execa

export let execaSync = all.execaSync
global.execaSync = execaSync

export let execaCommand = all.execaCommand
global.execaCommand = execaCommand

/**
 * Execute a shell command with a clean environment by default.
 *
 * The clean environment:
 * - Contains the user's normal shell environment (PATH, HOME, LANG, etc.)
 * - Does NOT contain Script Kit secrets from ~/.kenv/.env files
 * - Does NOT contain Kit-internal environment variables
 *
 * This prevents environment variable leakage when launching external applications
 * like terminals (iTerm, Terminal), editors (VS Code), or other GUI apps.
 *
 * To use the full process.env (including secrets), pass `env: process.env` in options.
 */
global.exec = ((command: string, options: Options = {}) => {
  const finalOptions: Options = {
    cwd: process.cwd(),
    // Use clean environment by default to prevent secret leakage
    // User can override by passing their own env in options
    env: getCleanEnvForLaunch(),
    ...options,
    shell: options.shell ?? true,
  }

  return execaCommand(command, finalOptions)
}) as unknown as typeof execaCommand
export let exec = global.exec

export let execaCommandSync = all.execaCommandSync
global.execaCommandSync = execaCommandSync

export let execaNode = all.execaNode
global.execaNode = execaNode

global.$ = all.$
export let $ = global.$