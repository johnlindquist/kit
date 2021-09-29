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
import { Low } from "lowdb"
import { NodeNotifier } from "node-notifier"
import { LibApi } from "./lib"
import { editor } from "./editor.api"
import {
  Channel,
  Mode,
  ProcessType,
  UI,
} from "../core/enum.js"

export interface Choice<Value = any> {
  name: string
  value?: Value
  description?: string
  focused?: string
  img?: string
  icon?: string
  html?: string
  preview?: string
  id?: string
  shortcode?: string[]
  className?: string
  tag?: string
  shortcut?: string
  drag?:
    | {
        format?: string
        data?: string
      }
    | string
}

export interface Script extends Choice {
  filePath: string
  command: string
  menu?: string
  shortcut?: string
  friendlyShortcut?: string
  alias?: string
  author?: string
  twitter?: string
  exclude?: boolean
  schedule?: string
  system?: string
  watch?: string
  background?: string
  isRunning?: boolean
  type: ProcessType
  requiresPrompt: boolean
  timeout?: number
  tabs?: string[]
  kenv: string
  tag?: string
  log?: boolean
  hasFlags?: boolean
}

type InputType =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"

export interface PromptData {
  id: number
  script: Script
  ui: UI
  placeholder: string
  kitScript: string
  choices: Choice[]
  tabs: string[]
  ignoreBlur: boolean
  textarea?: boolean
  secret?: boolean
  strict?: boolean
  mode?: Mode
  className?: string
  hint?: string
  input?: string
  selected?: string
  type?: InputType
}

export interface MessageData extends PromptData {
  channel: Channel
  pid: number
  log?: string
  warn?: string
  path?: string
  filePath?: string
  name?: string
  args?: string[]
  ignore?: boolean
  text?: string
  options?: any
  image?: any
  html?: string
  info?: string
  input?: string
  scripts?: boolean
  kenvPath?: string
  hint?: string
  tabIndex?: number
}

export enum Secret {
  password = "password",
  text = "text",
}

export interface EditorProps {
  options: EditorConfig
  height: number
  width: number
}

export type EditorOptions =
  editor.IStandaloneEditorConstructionOptions & {
    scrollTo: "top" | "center" | "bottom"
  }

export type EditorConfig = string | EditorOptions

export type TextareaConfig = {
  placeholder?: string
  value?: string
}

export type EditorRef = editor.IStandaloneCodeEditor

export type PromptBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type PromptDb = {
  screens: {
    [screenId: string]: {
      [scriptId: string]: PromptBounds
    }
  }
}

type Trash = typeof import("trash")
type Download = typeof import("download")

type Panel =
  | string
  | (() => string)
  | (() => Promise<string>)
  | ((input: string) => Promise<any>)

interface Arg {
  [key: string]: any
  <T = string>(
    placeholderOrConfig?: string | PromptConfig,
    choicesOrPanel?: Choices<T> | Panel
  ): Promise<T>
}

interface TextArea {
  (
    placeholderOrOptions?: string | TextareaConfig
  ): Promise<string>
}
interface Drop {
  (hint?: string): Promise<any>
}
interface Editor {
  (config?: EditorConfig): Promise<any>
}
interface Form {
  (html?: string, formData?: any): Promise<any>
}
interface Div {
  (html?: string, containerClass?: string): Promise<void>
}

interface KeyData {
  key: string
  command: boolean
  shift: boolean
  option: boolean
  control: boolean
  fn: boolean
  hyper: boolean
  os: boolean
  super: boolean
  win: boolean
  shortcut: string
}
interface Hotkey {
  (placeholder?: string): Promise<KeyData>
}

interface EnvConfig extends PromptConfig {
  reset?: boolean
}
interface Env {
  (
    envKey: string,
    promptConfig?: EnvConfig | (() => Promise<string>)
  ): Promise<string>
  [key: string]: any
}

interface Args extends Array<string> {}

interface UpdateArgs {
  (args: string[]): void
}

interface PathFn {
  (...pathParts: string[]): string
}

interface Inspect {
  (data: any, extension?: string): Promise<void>
}

interface CompileTemplate {
  (template: string, vars: any): Promise<string>
}

interface OnTab {
  (name: string, fn: () => void): void
}

interface Markdown {
  (markdown: string): string
}

interface AppleScript {
  (script: string, options?: any): Promise<string>
}

interface Send {
  (channel: string, data?: any): void
}

export interface KitModuleLoader {
  (
    packageName: string,
    ...moduleArgs: string[]
  ): Promise<any>
}

interface SetAppProp {
  (value: any): void
}
interface SetPanel {
  (html: string, containerClasses?: string): void
}

interface ShowAppWindow {
  (content: string, options?: any): void
}

interface Edit {
  (
    file: string,
    dir?: string,
    line?: string | number,
    col?: string | number
  ): Promise<void>
}

interface Wait {
  (time: number): Promise<void>
}

interface IsCheck {
  (file: string): Promise<boolean>
}

interface DB {
  (
    key: string,
    defaults?: any,
    forceReload?: boolean
  ): Promise<Low<any> | any>
}

interface GetScripts {
  (fromCache: boolean): Promise<Script[]>
}

export type FlagFn = (flags: FlagsOptions) => void
export type Flags = {
  [key: string]: boolean | string
}

interface SelectKitEditor {
  (reset: boolean): Promise<string>
}

type UUID = typeof import("crypto").randomUUID

export interface KitApi {
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
  db: DB

  trash: Trash
  rm: Trash

  wait: Wait

  checkProcess: (processId: number) => string

  home: PathFn
  isFile: IsCheck
  isDir: IsCheck
  isBin: IsCheck

  //preload/kit.cjs
  arg: Arg
  textarea: TextArea
  drop: Drop
  editor: Editor
  form: Form
  div: Div
  hotkey: Hotkey
  env: Env
  argOpts: any

  kitPrompt: (promptConfig: PromptConfig) => Promise<any>

  kitPath: PathFn
  kenvPath: PathFn
  tmpPath: PathFn

  kitMenuCachePath: () => string

  inspect: Inspect

  compileTemplate: CompileTemplate

  onTab: OnTab
  md: Markdown

  applescript: AppleScript
  send: Send

  attemptImport: KitModuleLoader
  npm: KitModuleLoader
  setup: KitModuleLoader

  setPlaceholder: SetAppProp
  setPanel: SetPanel
  setLog: SetPanel
  setHint: SetAppProp
  setInput: SetAppProp
  setIgnoreBlur: SetAppProp

  show: ShowAppWindow
  showImage: ShowAppWindow

  edit: Edit

  args: Args
  updateArgs: UpdateArgs

  kitScript: string

  terminal: (script: string) => Promise<string>
  iterm: (iterm: string) => Promise<string>

  onTabs: {
    name: string
    fn: (input?: string) => void | Promise<any>
  }[]
  onTabIndex: number

  setMode: (mode: Mode) => void

  currentOnTab: any
  kitPrevChoices: Choices<any>

  setChoices: (
    choices: Choices<any>,
    className?: string
  ) => void
  getDataFromApp: (channel: string) => Promise<any>
  getBackgroundTasks: () => Promise<{
    channel: string
    tasks: Background[]
  }>
  getSchedule: () => Promise<{
    channel: string
    schedule: Schedule[]
  }>
  getScriptsState: () => Promise<{
    channel: string
    tasks: Background[]
    schedule: Schedule[]
  }>

  notify: Notify

  getScripts: GetScripts

  memoryMap: Map<string, any>

  selectKitEditor: SelectKitEditor

  $: typeof import("zx").$
  download: Download
  degit: typeof import("degit")

  kit: Run
  run: Run

  openLog: () => void

  hide: () => void
  flag: Flags
  setFlags: FlagFn

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
  writeJson: typeof import("fs-extra").writeJson
}

type Run = (command: string, args?: string) => Promise<any>

export type FlagsOptions = {
  [key: string]:
    | {
        shortcut?: string
        name?: string
        description?: string
      }
    | undefined
}

export type Choices<Value> =
  | string[]
  | Choice<Value>[]
  | (() => Choice<Value>[])
  | (() => Promise<Choice<Value>[]>)
  | Promise<Choice<any>[]>
  | GenerateChoices

export interface GenerateChoices {
  (input: string): Choice<any>[] | Promise<Choice<any>[]>
}
export interface PromptConfig
  extends Partial<
    Omit<PromptData, "choices" | "id" | "script">
  > {
  validate?: (
    choice: string
  ) => boolean | string | Promise<boolean | string>
  choices?: Choices<any> | Panel
  flags?: FlagsOptions
}

export interface Background {
  filePath: string
  process: {
    spawnargs: string[]
    pid: number
    start: string
  }
}

export interface Schedule extends Choice {
  date: Date
}

export interface Notify {
  (notification: string | Notification): NodeNotifier
}

declare global {
  type GlobalApi = KitApi & LibApi
  namespace NodeJS {
    interface Global extends GlobalApi {}
  }

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
  var edit: Edit

  var chalk: ChalkFunction

  var download: Download
  var degit: typeof import("degit")

  var trash: Trash
  var rm: Trash

  var kitPath: PathFn
  var kenvPath: PathFn
  var tmpPath: PathFn

  var attemptImport: KitModuleLoader
  var npm: KitModuleLoader
  var kit: Run
  var run: Run
  var setup: KitModuleLoader

  var env: Env
  var arg: Arg
  var textarea: TextArea
  var drop: Drop
  var div: Div
  var editor: Editor
  var hotkey: Hotkey
  var onTab: OnTab
  var applescript: AppleScript
  var send: Send
  var args: Args

  var updateArgs: UpdateArgs
  var argOpts: any

  var setPlaceholder: SetAppProp
  var setPanel: SetPanel
  var setLog: SetPanel
  var setHint: SetAppProp
  var setInput: SetAppProp
  var setIgnoreBluer: SetAppProp

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var wait: Wait

  var home: PathFn
  var isFile: IsCheck
  var isDir: IsCheck
  var isBin: IsCheck

  var inspect: Inspect

  var db: DB

  var md: Markdown
  var notify: Notify

  var memoryMap: Map<string, any>

  var onTabIndex: number

  var selectKitEditor: SelectKitEditor

  var getScripts: GetScripts

  var $: typeof import("zx").$

  var openLog: () => void
  var hide: () => void
  var flag: Flags
  var setFlags: FlagFn
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
  var writeJson: typeof import("fs-extra").writeJson
}
