export {}
import { AxiosInstance } from "axios"
import * as shelljs from "shelljs"
import * as child_process from "child_process"
import * as fsPromises from "fs/promises"
import * as fs from "fs"
import * as handlebars from "handlebars"
import * as clipboardy from "clipboardy"
import { LoDashStatic } from "lodash"
import { ChalkFunction } from "chalk"
import { Notification } from "node-notifier"


export type Trash = typeof import("trash")
export type Download = typeof import("download")
export type KitNotification = string | Notification

export interface Notify {
  (notification: KitNotification)
}

export interface CompileTemplate {
  (template: string, vars: any): Promise<string>
}

export interface OnTab {
  (name: string, fn: () => void): void
}

export interface Markdown {
  (markdown: string): string
}

export type UUID = typeof import("crypto").randomUUID


export type WriteJson = typeof import("fs-extra").writeJson

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
  spawn: typeof child_process.spawn
  spawnSync: typeof child_process.spawnSync
  fork: typeof child_process.fork
  get: AxiosInstance["get"]
  put: AxiosInstance["put"]
  post: AxiosInstance["post"]
  patch: AxiosInstance["patch"]
  fetch: typeof import("node-fetch")
  readFile: typeof fsPromises.readFile
  writeFile: typeof fsPromises.writeFile
  appendFile: typeof fsPromises.appendFile
  copyFile: typeof fsPromises.copyFile

  createReadStream: typeof fs.createReadStream
  createWriteStream: typeof fs.createWriteStream
  readdir: typeof fsPromises.readdir
  compile: typeof handlebars.compile

  cwd: typeof process.cwd
  pid: typeof process.pid
  stderr: typeof process.stderr
  stdin: typeof process.stdin
  stdout: typeof process.stdout
  uptime: typeof process.uptime

  path: typeof import("path")

  _: LoDashStatic

  uuid: UUID
  chalk: ChalkFunction
  paste: typeof clipboardy.read
  copy: typeof clipboardy.write
  trash: Trash
  rm: Trash
  compileTemplate: CompileTemplate
  md: Markdown
  notify: Notify
  $: typeof import("zx").$

  download: Download
  degit: typeof import("degit")
  emptyDir: typeof import("fs-extra").emptyDir
  ensureFile: typeof import("fs-extra").ensureFile
  ensureDir: typeof import("fs-extra").ensureDir
  ensureLink: typeof import("fs-extra").ensureLink
  ensureSymlink: typeof import("fs-extra").ensureSymlink
  mkdirp: typeof import("fs-extra").mkdirp
  mkdirs: typeof import("fs-extra").mkdirs
  outputFile: typeof import("fs-extra").outputFile
  outputJson: typeof import("fs-extra").outputJson
  pathExists: typeof import("fs-extra").pathExists
  readJson: typeof import("fs-extra").readJson
  remove: typeof import("fs-extra").remove


  writeJson: WriteJson
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
  var spawn: typeof child_process.spawn
  var spawnSync: typeof child_process.spawnSync
  var fork: typeof child_process.fork
  var get: AxiosInstance["get"]
  var put: AxiosInstance["put"]
  var post: AxiosInstance["post"]
  var patch: AxiosInstance["patch"]
  var readFile: typeof fsPromises.readFile
  var writeFile: typeof fsPromises.writeFile
  var appendFile: typeof fsPromises.appendFile
  var copyFile: typeof fsPromises.copyFile
  var createWriteStream: typeof fs.createWriteStream
  var createReadStream: typeof fs.createReadStream
  var readdir: typeof fsPromises.readdir
  var compile: typeof handlebars.compile

  var cwd: typeof process.cwd

  var path: typeof import("path")

  var paste: typeof clipboardy.read
  var copy: typeof clipboardy.write
  var chalk: ChalkFunction

  var download: Download
  var degit: typeof import("degit")
  var trash: Trash
  var rm: Trash

  var md: Markdown



  var notify: Notify

  var memoryMap: Map<string, any>

  var onTabIndex: number

  var $: typeof import("zx").$
  var _: LoDashStatic

  var uuid: UUID

  var emptyDir: typeof import("fs-extra").emptyDir
  var ensureFile: typeof import("fs-extra").ensureFile
  var ensureDir: typeof import("fs-extra").ensureDir
  var ensureLink: typeof import("fs-extra").ensureLink
  var ensureSymlink: typeof import("fs-extra").ensureSymlink
  var mkdirp: typeof import("fs-extra").mkdirp
  var mkdirs: typeof import("fs-extra").mkdirs
  var outputFile: typeof import("fs-extra").outputFile
  var outputJson: typeof import("fs-extra").outputJson
  var pathExists: typeof import("fs-extra").pathExists
  var readJson: typeof import("fs-extra").readJson
  var remove: typeof import("fs-extra").remove
  var writeJson: WriteJson
}
