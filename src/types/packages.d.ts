export {}
import * as shelljs from "shelljs"
import * as clipboardy from "clipboardy"
import { Notification } from "node-notifier"

export type Trash = typeof import("trash")
export type KitNotification = string | Notification

export interface Notify {
  (notification: KitNotification)
}

export interface OnTab {
  (name: string, fn: () => void): void
}

export interface PackagesApi {
  cd: typeof shelljs.cd
  cp: typeof shelljs.cp
  chmod: typeof shelljs.chmod
  echo: typeof shelljs.echo
  exec: typeof shelljs.exec
  exit: typeof shelljs.exit
  grep: typeof shelljs.grep
  ln: typeof shelljs.ln
  ls: typeof shelljs.ls
  mkdir: typeof shelljs.mkdir
  mv: typeof shelljs.mv
  sed: typeof shelljs.sed
  tempdir: typeof shelljs.tempdir
  test: typeof shelljs.test
  which: typeof shelljs.which

  cwd: typeof process.cwd
  pid: typeof process.pid
  stderr: typeof process.stderr
  stdin: typeof process.stdin
  stdout: typeof process.stdout
  uptime: typeof process.uptime

  path: typeof import("path")

  paste: typeof clipboardy.read
  copy: typeof clipboardy.write
  trash: Trash
  rm: Trash
  notify: Notify
}

declare global {
  var cd: typeof shelljs.cd
  var cp: typeof shelljs.cp
  var chmod: typeof shelljs.chmod
  var echo: typeof shelljs.echo
  var exec: typeof shelljs.exec
  var exit: typeof shelljs.exit
  var grep: typeof shelljs.grep
  var ln: typeof shelljs.ln
  var ls: typeof shelljs.ls
  var mkdir: typeof shelljs.mkdir
  var mv: typeof shelljs.mv
  var sed: typeof shelljs.sed
  var tempdir: typeof shelljs.tempdir
  var test: typeof shelljs.test
  var which: typeof shelljs.which

  var cwd: typeof process.cwd

  var path: typeof import("path")

  var paste: typeof clipboardy.read
  var copy: typeof clipboardy.write

  var trash: Trash
  var rm: Trash

  var notify: Notify

  var memoryMap: Map<string, any>

  var onTabIndex: number
}
