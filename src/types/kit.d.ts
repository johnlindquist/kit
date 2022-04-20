export {}

import {
  Choices,
  FlagsOptions,
  Panel,
  PromptConfig,
  Script,
} from "./core"

export interface Arg {
  [key: string]: any
  <T = string>(
    placeholderOrConfig?: string | PromptConfig,
    choicesOrPanel?: Choices<T> | Panel
  ): Promise<T>
}

export interface EnvConfig extends PromptConfig {
  reset?: boolean
}
export interface Env {
  (
    envKey: string,
    promptConfig?:
      | string
      | EnvConfig
      | (() => Promise<string>)
  ): Promise<string>
  [key: string]: any
}

export interface Args extends Array<string> {}

export interface UpdateArgs {
  (args: string[]): void
}

export interface PathFn {
  (...pathParts: string[]): string
}

export interface Inspect {
  (data: any, extension?: string): Promise<void>
}

export interface OnTab {
  (
    name: string,
    fn: (input?: string) => void | Promise<void>
  ): void
}

export interface OnExit {
  (fn: () => void): void
}

export interface KitModuleLoader {
  (
    packageName: string,
    ...moduleArgs: string[]
  ): Promise<any>
}
export interface Edit {
  (
    file: string,
    dir?: string,
    line?: string | number,
    col?: string | number
  ): Promise<void>
}

export interface Browse {
  (url: string): ReturnType<exec>
}

export interface Wait {
  (time: number, submitValue?: any): Promise<void>
}

export interface IsCheck {
  (file: string): Promise<boolean>
}

type DB = typeof import("../core/db").db

export interface GetScripts {
  (fromCache?: boolean): Promise<Script[]>
}

export type FlagFn = (flags: FlagsOptions) => void
export type PrepFlags = (
  flags: FlagsOptions
) => FlagsOptions
export type Flags = {
  [key: string]: boolean | string
  cmd?: string
  ctrl?: string
  shift?: string
  option?: string
  alt?: string
}

export interface SelectKitEditor {
  (reset: boolean): Promise<string>
}

export interface SelectScript {
  (
    message?: string,
    fromCache?: boolean,
    xf?: (x: Script[]) => Script[]
  ): Promise<Script>
  (
    message: PromptConfig,
    fromCache?: boolean,
    xf?: (x: Script[]) => Script[]
  ): Promise<Script | string>
}

export interface Kenv {
  name: string
  dirPath: string
}
export interface SelectKenv {
  (ignorePattern?: RegExp): Promise<Kenv>
}

export interface Highlight {
  (
    markdown: string,
    containerClass?: string,
    injectStyles?: string
  ): Promise<string>
}
export interface KitApi {
  isWin: boolean
  db: DB

  wait: Wait

  checkProcess: (processId: number) => string

  /**
   * @example
   * ```
   * let pathToProject =  await home("projects", "my-code-project")
   * // /Users/johnlindquist/projects/my-code-project
   * ```
   */
  home: PathFn
  isFile: IsCheck
  isDir: IsCheck
  isBin: IsCheck
  /**
   * @example
   * ```
   * let value =  await arg()
   * ```
   */
  arg: Arg
  /**
   * @example
   * ```
   * // Reads from .env or prompts if not set
   * let SOME_ENV_VAR = await env("SOME_ENV_VAR")
   * ```
   */
  env: Env
  argOpts: string[]

  kitPath: PathFn
  kenvPath: PathFn
  /**
   * Generate a path `~/.kenv/tmp/{command}/...parts`
   *
   * @example
   * ```
   * tmpPath("taco.txt") // ~/.kenv/tmp/command/taco.txt
   * ```
   */
  tmpPath: PathFn

  inspect: Inspect

  onTab: OnTab
  onExit: OnExit

  attemptImport: KitModuleLoader
  npm: KitModuleLoader
  setup: KitModuleLoader

  edit: Edit
  browse: Browse

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

  kitPrevChoices: Choices<any>

  getScripts: GetScripts

  memoryMap: Map<string, any>

  selectKitEditor: SelectKitEditor

  kit: Run
  run: Run

  flag: Flags
  setFlags: FlagFn
  prepFlags: PrepFlags
  selectScript: SelectScript
  selectKenv: SelectKenv
  highlight: Highlight
}

interface KeyValue {
  [key: string]: any
}

interface Run {
  (command: string, ...args: string[]): Promise<any>
}

declare global {
  var isWin: boolean
  var edit: Edit
  var browse: Browse

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
  var onTab: OnTab
  var onExit: OnExit
  var args: Args

  var updateArgs: UpdateArgs
  var argOpts: string[]

  var wait: Wait

  var home: PathFn
  var isFile: IsCheck
  var isDir: IsCheck
  var isBin: IsCheck

  var inspect: Inspect

  var db: DB

  var memoryMap: Map<string, any>

  var onTabIndex: number

  var selectKitEditor: SelectKitEditor

  var getScripts: GetScripts
  var hide: () => Promise<void>
  var flag: Flags
  var setFlags: FlagFn
  var prepFlags: PrepFlags

  var selectScript: SelectScript
  var selectKenv: SelectKenv
  var highlight: Highlight

  var terminal: (script: string) => Promise<string>
  var iterm: (iterm: string) => Promise<string>
}
