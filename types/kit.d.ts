export {}

import {
  PromptData,
  Script,
  Choice,
  EditorConfig,
  TextareaConfig,
} from "../src/core/type"
import { Mode, UI } from "../src/core/enum"
import { AxiosInstance } from "axios"
import * as shelljs from "shelljs"
import * as child_process from "child_process"
import * as fsPromises from "fs/promises"
import * as fs from "fs"
import * as handlebars from "handlebars"
import * as uuidType from "uuid"
import * as clipboardy from "clipboardy"
import * as trashType from "trash"
import { LoDashStatic } from "lodash"
import { ChalkFunction } from "chalk"
import { CLI } from "./cli"
import { Main } from "./main"
import { Lib } from "./lib"
import { JSONFile, Low } from "lowdb"
import { NodeNotifier } from "node-notifier/index"

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

interface KitModuleLoader {
  (
    packageName: string,
    ...moduleArgs: string[]
  ): Promise<any>
}
interface CliModuleLoader {
  (
    packageName: keyof CLI,
    ...moduleArgs: string[]
  ): Promise<any>
}
interface LibModuleLoader {
  (
    packageName: keyof Lib,
    ...moduleArgs: string[]
  ): Promise<any>
}

interface MainModuleLoader {
  (
    packageName: keyof Main,
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

interface KitApi {
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

  uuid: typeof uuidType.v4
  chalk: ChalkFunction
  paste: typeof clipboardy.read
  copy: typeof clipboardy.write
  db: DB

  trash: typeof trashType
  rm: typeof trashType

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
  libPath: PathFn

  kitMenuCachePath: () => string

  tmp: PathFn
  inspect: Inspect

  compileTemplate: CompileTemplate

  onTab: OnTab
  md: Markdown

  applescript: AppleScript
  send: Send

  attemptImport: KitModuleLoader
  npm: KitModuleLoader
  main: MainModuleLoader
  lib: LibModuleLoader
  cli: CliModuleLoader
  setup: KitModuleLoader
  run: KitModuleLoader

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

  runSub: (
    scriptPath: string,
    ...runArgs: string[]
  ) => Promise<any>

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
  download: typeof import("download")
  degit: typeof import("degit")

  kit: Kit

  openLog: () => void

  hide: () => void
  flag: Flags
  setFlags: FlagFn
}

type GlobalKit = KitApi & typeof import("api/lib")

declare global {
  type FlagsOptions = {
    [key: string]:
      | {
          shortcut?: string
          name?: string
          description?: string
        }
      | undefined
  }

  type Choices<Value> =
    | string[]
    | Choice<Value>[]
    | (() => Choice<Value>[])
    | (() => Promise<Choice<Value>[]>)
    | Promise<Choice<any>[]>
    | GenerateChoices

  interface GenerateChoices {
    (input: string): Choice<any>[] | Promise<Choice<any>[]>
  }
  interface PromptConfig
    extends Partial<
      Omit<PromptData, "choices" | "id" | "script">
    > {
    validate?: (
      choice: string
    ) => boolean | string | Promise<boolean | string>
    choices?: Choices<any> | Panel
    flags?: FlagsOptions
  }

  interface Background {
    filePath: string
    process: {
      spawnargs: string[]
      pid: number
      start: string
    }
  }

  interface Schedule extends Choice {
    date: Date
  }

  interface Notify {
    (notification: string | Notification): NodeNotifier
  }

  namespace NodeJS {
    interface Global extends GlobalKit {}
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

  var download: typeof import("download")
  var degit: typeof import("degit")

  var trash: typeof trashType.default
  var rm: typeof trashType

  var kitPath: PathFn
  var kenvPath: PathFn

  var attemptImport: KitModuleLoader
  var npm: KitModuleLoader
  var main: KitModuleLoader
  var kit: Kit
  var lib: KitModuleLoader
  var cli: CliModuleLoader
  var setup: KitModuleLoader
  var run: KitModuleLoader

  var env: Env
  var arg: Arg
  var textarea: TextArea
  var drop: Drop
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

  var copyPathAsImage: typeof import("lib/file").copyPathAsImage
  var fileSearch: typeof import("lib/file").fileSearch
  var focusTab: typeof import("lib/browser").focusTab
  var focusWindow: typeof import("lib/desktop").focusWindow
  var getActiveAppBounds: typeof import("lib/desktop").getActiveAppBounds
  var getActiveScreen: typeof import("lib/desktop").getActiveScreen
  var getActiveTab: typeof import("lib/browser").getActiveTab
  var getMousePosition: typeof import("lib/desktop").getMousePosition
  var getScreens: typeof import("lib/desktop").getScreens
  var getSelectedFile: typeof import("lib/file").getSelectedFile
  var getSelectedText: typeof import("lib/text").getSelectedText
  var getTabs: typeof import("lib/browser").getTabs
  var getWindows: typeof import("lib/desktop").getWindows
  var getWindowsBounds: typeof import("lib/desktop").getWindowsBounds
  var lock: typeof import("lib/system").lock
  var organizeWindows: typeof import("lib/desktop").organizeWindows
  var playAudioFile: typeof import("lib/audio").playAudioFile
  var quitAllApps: typeof import("lib/system").quitAllApps
  var say: typeof import("lib/speech").say
  var scatterWindows: typeof import("lib/desktop").scatterWindows
  var setActiveAppBounds: typeof import("lib/desktop").setActiveAppBounds
  var setSelectedText: typeof import("lib/text").setSelectedText
  var setWindowBoundsByIndex: typeof import("lib/desktop").setWindowBoundsByIndex
  var setWindowPosition: typeof import("lib/desktop").setWindowPosition
  var setWindowPositionByIndex: typeof import("lib/desktop").setWindowPositionByIndex
  var setWindowSize: typeof import("lib/desktop").setWindowSize
  var setWindowSizeByIndex: typeof import("lib/desktop").setWindowSizeByIndex
  var keystroke: typeof import("lib/keyboard").keystroke
  var shutdown: typeof import("lib/system").shutdown
  var sleep: typeof import("lib/system").sleep
  var tileWindow: typeof import("lib/desktop").tileWindow
  var scrapeSelector: typeof import("lib/browser").scrapeSelector
  var scrapeAttribute: typeof import("lib/browser").scrapeAttribute

  var getScripts: GetScripts

  var $: typeof import("zx").$

  var openLog: () => void
  var hide: () => void
  var flag: Flags
  var setFlags: FlagFn
}

type Run = (command: string) => Promise<any>
type Kit = Omit<GlobalKit, "kit"> & Run
