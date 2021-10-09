export {}

import { AppApi } from "./app"
import {
  Choices,
  FlagsOptions,
  Panel,
  PromptConfig,
  Script,
} from "./core"
import { PackagesApi } from "./packages"
import { PlatformApi } from "./platform"

interface Arg {
  [key: string]: any
  <T = string>(
    placeholderOrConfig?: string | PromptConfig,
    choicesOrPanel?: Choices<T> | Panel
  ): Promise<T>
}

interface EnvConfig extends PromptConfig {
  reset?: boolean
}
interface Env {
  (
    envKey: string,
    promptConfig?:
      | string
      | EnvConfig
      | (() => Promise<string>)
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

interface OnTab {
  (name: string, fn: () => void): void
}

interface KitModuleLoader {
  (
    packageName: string,
    ...moduleArgs: string[]
  ): Promise<any>
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

type DB = typeof import("../core/db").db

interface GetScripts {
  (fromCache: boolean): Promise<Script[]>
}

type FlagFn = (flags: FlagsOptions) => void
type Flags = {
  [key: string]: boolean | string
}

interface SelectKitEditor {
  (reset: boolean): Promise<string>
}

interface KitApi {
  db: DB

  wait: Wait

  checkProcess: (processId: number) => string

  home: PathFn
  isFile: IsCheck
  isDir: IsCheck
  isBin: IsCheck

  //preload/kit.cjs
  arg: Arg
  env: Env
  argOpts: any

  kitPath: PathFn
  kenvPath: PathFn
  tmpPath: PathFn

  inspect: Inspect

  onTab: OnTab

  attemptImport: KitModuleLoader
  npm: KitModuleLoader
  setup: KitModuleLoader

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

  kitPrevChoices: Choices<any>

  getScripts: GetScripts

  memoryMap: Map<string, any>

  selectKitEditor: SelectKitEditor

  kit: Run
  run: Run

  flag: Flags
  setFlags: FlagFn
}

type Run = (command: string, args?: string) => Promise<any>

declare global {
  type GlobalApi = AppApi &
    KitApi &
    PackagesApi &
    PlatformApi
  namespace NodeJS {
    interface Global extends GlobalApi {}
  }

  var edit: Edit

  var kitPath: PathFn
  var kenvPath: PathFn
  /**
   * Generate a path `~/.kenv/tmp/{command}/...parts`
   *
   * @example
   * ```
   * tmpPath("taco.txt") // ~/.kenv/tmp/command/taco.txt
   * ```
   */
  var tmpPath: PathFn

  var attemptImport: KitModuleLoader
  var npm: KitModuleLoader
  var kit: Run
  var run: Run
  var setup: KitModuleLoader

  var env: Env
  var arg: Arg
  var onTab: OnTab
  var args: Args

  var updateArgs: UpdateArgs
  var argOpts: any

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
  var hide: () => void
  var flag: Flags
  var setFlags: FlagFn
}
