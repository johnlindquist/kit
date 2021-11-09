export {}
import { editor } from "./editor.api"

import { Channel, Mode } from "../core/enum.js"

import {
  Choice,
  Choices,
  PromptConfig,
  PromptData,
} from "./core"
import { Display, Rectangle } from "./electron"

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
  bounds?: Partial<Rectangle>
}

export interface EditorProps {
  options: EditorConfig
  height: number
  width: number
}

export type EditorOptions =
  editor.IStandaloneEditorConstructionOptions & {
    scrollTo?: "top" | "center" | "bottom"
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

export interface TextArea {
  (
    placeholderOrOptions?: string | TextareaConfig
  ): Promise<string>
}
export interface Drop {
  (hint?: string): Promise<any>
}
export interface Editor {
  (config?: EditorConfig): Promise<any>
}
export interface Form {
  (html?: string, formData?: any): Promise<any>
}
export interface Div {
  (html?: string, containerClass?: string): Promise<void>
}

export interface KeyData {
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
export interface Hotkey {
  (placeholder?: string): Promise<KeyData>
}

export interface AppleScript {
  (script: string, options?: any): Promise<string>
}

export interface Send {
  (channel: string, data?: any): void
}

export interface SetAppProp {
  (value: any): void
}
export interface SetPanel {
  (html: string, containerClasses?: string): void
}
export interface SetPreview {
  (html: string, containerClasses?: string): void
}
export interface SetBounds {
  (bounds: Partial<Rectangle>): void
}
export interface GetBounds {
  (): Promise<Rectangle>
}
export interface GetBounds {
  (): Promise<Rectangle>
}

export interface GetActiveScreen {
  (): Promise<Display>
}

export interface ShowAppWindow {
  (content: string, options?: any): void
}
interface ClipboardItem {
  value: string
  type: string
  timestamp: string
  secret: boolean
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
  setPreview: SetPreview
  setBounds: SetBounds
  getBounds: GetBounds
  getActiveScreen: GetActiveScreen
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

  devTools: (object: any) => void
  getClipboardHistory: () => Promise<ClipboardItem[]>
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
  var setPreview: SetPreview
  var setBounds: SetBounds
  var getBounds: GetBounds
  var getActiveScreen: GetActiveScreen
  var setHint: SetAppProp
  var setInput: SetAppProp
  var setIgnoreBlur: SetAppProp

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var hide: () => void

  var devTools: (object: any) => void
  var getClipboardHistory: () => Promise<ClipboardItem[]>
}
