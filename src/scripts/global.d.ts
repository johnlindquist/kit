export {}

import { AxiosInstance } from "axios"
import * as shelljs from "shelljs"
import * as child_process from "child_process"
import * as fsPromises from "fs/promises"
import * as fs from "fs"
import * as handlebars from "handlebars"
import * as pathType from "path"
import * as _Type from "lodash"
import * as uuidType from "uuid"
import * as chalkType from "chalk"
import * as clipboardy from "clipboardy"
import { lowdb } from "lowdb"
import * as trashType from "trash"

interface PromptConfig {
  placeholder: string
  validate?: (
    choice: string
  ) => boolean | string | Promise<boolean | string>
  hint?: string
  input?: string
  secret?: boolean
}

type Choices<Value> =
  | string[]
  | Choice<Value>[]
  | (() => Choice<Value>[])
  | (() => Promise<Choice<Value>[]>)
  | ((
      input: string
    ) =>
      | Choice<Value>[]
      | ((input: string) => Promise<Choice<Value>[]>))

type Panel =
  | string
  | (() => string)
  | (() => Promise<string>)
  | ((input: string) => Promise<string | File[]>)

interface Arg<Value> {
  [key: string]: string
  (
    placeholderOrConfig?: string | PromptConfig,
    choicesOrPanel?: Choices<Value> | Panel
  ): Promise<string | Value | File[]>
}

interface Args extends Array<string> {}

interface UpdateArgs {
  (args: string[]): void
}

interface Env {
  [key: string]: string
  (
    envKey: string,
    promptConfig?: PromptConfig
  ): Promise<string>
}

interface Path {
  (...pathParts: string[]): string
}

interface Inspect {
  (data: any, extension: string): Promise<void>
}

interface CompileTemplate {
  (template: string, vars: any): Promise<string>
}

interface OnTab {
  (name: string, fn: () => void): Promise<void>
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

interface SetAppProp {
  (value: any): void
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

declare global {
  interface Choice<Value> {
    name: string
    value: Value
    description?: string
    img?: string
    html?: string
  }
  namespace NodeJS {
    interface Global {
      //preload/api.cjs
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
      readFile: typeof fsPromises.readFile
      writeFile: typeof fsPromises.writeFile
      appendFile: typeof fsPromises.appendFile
      createWriteStream: typeof fs.createWriteStream
      readdir: typeof fsPromises.readdir
      compile: typeof handlebars.compile

      cwd: typeof process.cwd
      pid: typeof process.pid
      stderr: typeof process.stderr
      stdin: typeof process.stdin
      stdout: typeof process.stdout
      uptime: typeof process.uptime

      path: typeof pathType

      _: typeof _

      uuid: typeof uuidType.v4
      chalk: typeof chalkType
      paste: typeof clipboardy.read
      copy: typeof clipboardy.write
      db: lowdb

      trash: typeof trashType
      rm: typeof trashType

      wait: (time: number) => Promise<undefined>

      checkProcess: (processId: number) => string

      home: (pathParts: string[]) => string

      isFile: (file: string) => Promise<boolean>
      isDir: (dir: string) => Promise<boolean>
      isBin: (bin: string) => Promise<boolean>

      //preload/kit.cjs
      arg: Arg<any>
      argOpts: any
      env: Env

      kitPath: Path
      kenvPath: Path
      libPath: Path
      kitScriptFromPath: Path
      kitFromPath: Path

      //Need help with import wrappers

      tmp: Path
      inspect: Inspect

      compileTemplate: CompileTemplate

      onTab: OnTab
      md: Markdown

      applescript: AppleScript
      send: Send

      attemptImport: KitModuleLoader
      npm: KitModuleLoader
      main: KitModuleLoader
      kit: KitModuleLoader
      cli: KitModuleLoader
      setup: KitModuleLoader
      run: KitModuleLoader

      setPlaceholder: SetAppProp
      setPanel: SetAppProp
      setHint: SetAppProp

      show: ShowAppWindow
      showImage: ShowAppWindow

      edit: Edit

      args: Args
      updateArgs: UpdateArgs
    }
  }
  //preload/api.cjs
  let cd: typeof shelljs.cd
  let cp: typeof shelljs.cp
  let chmod: typeof shelljs.chmod
  let echo: typeof shelljs.echo
  let exec: typeof shelljs.exec
  let exit: typeof shelljs.exit
  let grep: typeof shelljs.grep
  let ln: typeof shelljs.ln
  let ls: typeof shelljs.ls
  let mkdir: typeof shelljs.mkdir
  let mv: typeof shelljs.mv
  let sed: typeof shelljs.sed
  let tempdir: typeof shelljs.tempdir
  let test: typeof shelljs.test
  let which: typeof shelljs.which
  let spawn: typeof child_process.spawn
  let spawnSync: typeof child_process.spawnSync
  let fork: typeof child_process.fork
  let get: AxiosInstance["get"]
  let put: AxiosInstance["put"]
  let post: AxiosInstance["post"]
  let patch: AxiosInstance["patch"]
  let readFile: typeof fsPromises.readFile
  let writeFile: typeof fsPromises.writeFile
  let appendFile: typeof fsPromises.appendFile
  let createWriteStream: typeof fs.createWriteStream
  let readdir: typeof fsPromises.readdir
  let compile: typeof handlebars.compile

  let cwd: typeof process.cwd
  let pid: typeof process.pid
  let stderr: typeof process.stderr
  let stdin: typeof process.stdin
  let stdout: typeof process.stdout
  let uptime: typeof process.uptime

  let path: typeof pathType

  let _: typeof _Type

  let uuid: typeof uuidType.v4
  let chalk: typeof chalkType
  let paste: typeof clipboardy.read
  let copy: typeof clipboardy.write
  let db: lowdb

  let trash: typeof trashType
  let rm: typeof trashType

  let wait: (time: number) => Promise<undefined>

  let checkProcess: (processId: number) => string

  let home: (pathParts: string[]) => string

  let isFile: (file: string) => Promise<boolean>
  let isDir: (dir: string) => Promise<boolean>
  let isBin: (bin: string) => Promise<boolean>

  //preload/kit.cjs
  let arg: Arg<any>
  let argOpts: any
  let env: Env

  let kitPath: Path
  let kenvPath: Path
  let libPath: Path
  let kitScriptFromPath: Path
  let kitFromPath: Path

  let tmp: Path
  let inspect: Inspect

  let compileTemplate: CompileTemplate

  let onTab: OnTab
  let md: Markdown

  let applescript: AppleScript
  let send: Send

  let attemptImport: KitModuleLoader
  let npm: KitModuleLoader
  let main: KitModuleLoader
  let cli: KitModuleLoader
  let setup: KitModuleLoader
  let run: KitModuleLoader

  let setPlaceholder: SetAppProp
  let setPanel: SetAppProp
  let setHint: SetAppProp

  let show: ShowAppWindow
  let showImage: ShowAppWindow

  let edit: Edit

  let args: Args
  let updateArgs: UpdateArgs
}
