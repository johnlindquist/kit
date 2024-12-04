import * as all from "execa"
import type { Options } from "execa"

export let execa = all.execa
global.execa = execa

export let execaSync = all.execaSync
global.execaSync = execaSync

export let execaCommand = all.execaCommand
global.execaCommand = execaCommand
global.exec = ((command: string, options: Options = { shell: true, cwd: process.cwd() }) => {
  return execaCommand(command, options)
}) as unknown as typeof execaCommand
export let exec = global.exec

export let execaCommandSync = all.execaCommandSync
global.execaCommandSync = execaCommandSync

export let execaNode = all.execaNode
global.execaNode = execaNode

global.$ = all.$
export let $ = global.$