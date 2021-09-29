export {}
import { editor } from "./editor.api"

import { Channel, Mode } from "../core/enum.js"

import {
  Choice,
  Choices,
  PromptConfig,
  PromptData,
} from "./core"

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

interface AppleScript {
  (script: string, options?: any): Promise<string>
}

interface Send {
  (channel: string, data?: any): void
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

export interface AppApi {
  textarea: TextArea
  drop: Drop
  editor: Editor
  form: Form
  div: Div
  hotkey: Hotkey

  kitPrompt: (promptConfig: PromptConfig) => Promise<any>
  send: Send

  setPlaceholder: SetAppProp
  setPanel: SetPanel
  setLog: SetPanel
  setHint: SetAppProp
  setInput: SetAppProp
  setIgnoreBlur: SetAppProp

  show: ShowAppWindow
  showImage: ShowAppWindow

  setMode: (mode: Mode) => void

  currentOnTab: any

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

  memoryMap: Map<string, any>

  hide: () => void
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

declare global {
  namespace NodeJS {
    interface Global extends AppApi {}
  }
  var cwd: typeof process.cwd

  var path: typeof import("path")

  var textarea: TextArea
  var drop: Drop
  var div: Div
  var editor: Editor
  var hotkey: Hotkey
  var send: Send

  var setPlaceholder: SetAppProp
  var setPanel: SetPanel
  var setLog: SetPanel
  var setHint: SetAppProp
  var setInput: SetAppProp
  var setIgnoreBluer: SetAppProp

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var openLog: () => void
  var hide: () => void
}
