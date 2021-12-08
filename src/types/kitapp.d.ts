export {}
import { editor } from "./editor.api"

import { Channel, Mode } from "../core/enum.js"
import { KeyEnum } from "../core/keyboard.js"

import {
  Choice,
  Choices,
  FlagsOptions,
  PromptConfig,
  PromptData,
  Script,
} from "./core"
import {
  BrowserWindowConstructorOptions,
  Display,
  Rectangle,
} from "./electron"
import { Flags } from "./kit"

export type KeyType = {
  [key in keyof typeof KeyEnum]: string
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
  (html?: string, containerClass?: string): Promise<any>
}

export interface KeyData {
  key: KeyEnum
  keyCode: number
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
  (placeholder?: string | PromptConfig): Promise<KeyData>
}

export interface AppleScript {
  (script: string, options?: any): Promise<string>
}

type SetImage = string | { src: string }
type SetChoices = { choices: Choice[]; scripts: boolean }
type SetTextAreaOptions = {
  value?: string
  placeholder?: string
}

export type GetAppData =
  | Channel.GET_BACKGROUND
  | Channel.GET_MOUSE
  | Channel.GET_SCHEDULE
  | Channel.GET_BOUNDS
  | Channel.GET_SCREEN_INFO
  | Channel.GET_SCRIPTS_STATE
  | Channel.GET_CLIPBOARD_HISTORY

export type SendNoOptions =
  | Channel.CLEAR_CACHE
  | Channel.CLEAR_CLIPBOARD_HISTORY
  | Channel.CLEAR_PROMPT_CACHE
  | Channel.CONSOLE_CLEAR
  | Channel.KIT_CLEAR
  | Channel.HIDE_APP
  | Channel.NEEDS_RESTART
  | Channel.TOGGLE_TRAY
  | Channel.UPDATE_APP
  | Channel.QUIT_APP

export interface ChannelMap {
  // Figure these undefined out later
  [Channel.GET_BACKGROUND]: undefined
  [Channel.GET_MOUSE]: undefined
  [Channel.GET_SCHEDULE]: undefined
  [Channel.GET_BOUNDS]: undefined
  [Channel.GET_SCREEN_INFO]: undefined
  [Channel.GET_SCRIPTS_STATE]: undefined
  [Channel.GET_CLIPBOARD_HISTORY]: undefined

  //
  [Channel.CLEAR_CACHE]: undefined
  [Channel.CLEAR_CLIPBOARD_HISTORY]: undefined
  [Channel.CLEAR_PROMPT_CACHE]: undefined
  [Channel.CONSOLE_CLEAR]: undefined
  [Channel.KIT_CLEAR]: undefined
  [Channel.HIDE_APP]: undefined
  [Channel.NEEDS_RESTART]: undefined
  [Channel.TOGGLE_TRAY]: undefined
  [Channel.UPDATE_APP]: undefined
  [Channel.QUIT_APP]: undefined
  //

  [Channel.CONSOLE_LOG]: string
  [Channel.CONSOLE_WARN]: string
  [Channel.KIT_LOG]: string
  [Channel.KIT_WARN]: string
  [Channel.COPY_PATH_AS_PICTURE]: string
  [Channel.DEV_TOOLS]: any
  [Channel.EXIT]: boolean
  [Channel.REMOVE_CLIPBOARD_HISTORY_ITEM]: string
  [Channel.SEND_KEYSTROKE]: Partial<KeyData>
  [Channel.SET_BOUNDS]: Partial<Rectangle>
  [Channel.SET_CHOICES]: SetChoices
  [Channel.SET_UNFILTERED_CHOICES]: Choice[]
  [Channel.SET_DESCRIPTION]: string
  [Channel.SET_DIV_HTML]: string
  [Channel.SET_EDITOR_CONFIG]: EditorConfig
  [Channel.SET_FLAGS]: FlagsOptions
  [Channel.SET_FORM_HTML]: { html: string; formData: any }
  [Channel.SET_HINT]: string
  [Channel.SET_IGNORE_BLUR]: boolean
  [Channel.SET_INPUT]: string
  [Channel.SET_LOADING]: boolean
  [Channel.SET_LOG]: string
  [Channel.SET_LOGIN]: boolean
  [Channel.SET_MODE]: Mode
  [Channel.SET_NAME]: string
  [Channel.SET_PANEL]: string
  [Channel.SET_PID]: number
  [Channel.SET_PLACEHOLDER]: string
  [Channel.SET_PREVIEW]: string
  [Channel.SET_PROMPT_DATA]: PromptData
  [Channel.SET_PROMPT_PROP]: any
  [Channel.SET_SCRIPT]: Script
  [Channel.SET_SUBMIT_VALUE]: any
  [Channel.SET_TAB_INDEX]: number
  [Channel.SET_TEXTAREA_CONFIG]: TextareaConfig
  [Channel.SET_TEXTAREA_VALUE]: string
  [Channel.SET_THEME]: any
  [Channel.SHOW]: { options: ShowOptions; html: string }
  [Channel.SHOW_IMAGE]: {
    options: ShowOptions
    image: string | { src: string }
  }
  [Channel.SWITCH_KENV]: string
  [Channel.TOGGLE_BACKGROUND]: string
}
export interface Send {
  (channel: GetAppData | SendNoOptions): void
  <C extends keyof ChannelMap, T extends ChannelMap[C]>(
    channel: C,
    data: T
  ): void
}

export interface SendData<C extends keyof ChannelMap> {
  pid: number
  kitScript: string
  channel: C
  value: ChannelMap[C]
}

export type GenericSendData = SendData<keyof ChannelMap>

export interface SetHint {
  (hint: string): void
}

export interface SetName {
  (name: string): void
}

export interface SetDescription {
  (description: string): void
}

export interface SetInput {
  (input: string): void
}

export interface SetTextareaValue {
  (value: string): void
}

export interface SetIgnoreBlur {
  (ignoreBlur: boolean): void
}

export interface SetLoading {
  (loading: boolean): void
}

export interface SetPlaceholder {
  (placeholder: string): void
}

export interface SetPanel {
  (html: string, containerClasses?: string): void
}
export interface SetPrompt {
  (config: Partial<PromptData>): void
}
export interface SetPreview {
  (html: string, containerClasses?: string): void
}
export interface SetBounds {
  (bounds: Partial<Rectangle>): void
}

export interface SendKeystroke {
  (keyData: Partial<KeyData>): void
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

type ShowOptions = BrowserWindowConstructorOptions & {
  ttl?: number
}

export interface ShowAppWindow {
  (content: string, options?: ShowOptions): void
}
interface ClipboardItem {
  name: string
  description: string
  value: string
  type: string
  timestamp: string
  maybeSecret: boolean
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

  setPlaceholder: SetPlaceholder
  setDiv: SetPanel
  setPanel: SetPanel
  setPreview: SetPreview
  setPrompt: SetPrompt
  setBounds: SetBounds
  getBounds: GetBounds
  getActiveScreen: GetActiveScreen
  setHint: SetHint
  setName: SetName
  setDescription: SetDescription
  setInput: SetInput
  setTextareaValue: SetTextareaValue

  setIgnoreBlur: SetIgnoreBlur
  setLoading: SetLoading

  show: ShowAppWindow
  showImage: ShowAppWindow

  setMode: (mode: Mode) => void

  currentOnTab: any

  setChoices: (
    choices: Choices<any>,
    className?: string
  ) => void
  getDataFromApp: (channel: Channel) => Promise<any>
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

  hide: () => Promise<void>

  dev: (object: any) => void
  getClipboardHistory: () => Promise<ClipboardItem[]>
  removeClipboardItem: (id: string) => void
  setTab: (tabName: string) => void
  submit: (value: any) => void
  mainScript: () => Promise<void>

  appKeystroke: SendKeystroke
  Key: KeyType
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

  var setPlaceholder: SetPlaceholder
  var setPanel: SetPanel
  var setDiv: SetPanel
  var setPreview: SetPreview
  var setPrompt: SetPrompt
  var setBounds: SetBounds
  var getBounds: GetBounds
  var getActiveScreen: GetActiveScreen
  var setHint: SetHint
  var setName: SetName
  var setDescription: SetDescription
  var setInput: SetInput
  var setTextareaValue: SetTextareaValue
  var setIgnoreBlur: SetIgnoreBlur
  var setLoading: SetLoading

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var hide: () => Promise<void>

  var dev: (object: any) => void
  var getClipboardHistory: () => Promise<ClipboardItem[]>
  var removeClipboardItem: (id: string) => void
  var setTab: (tabName: string) => void
  var submit: (value: any) => void
  var mainScript: () => Promise<void>

  var appKeystroke: SendKeystroke
  var Key: KeyType
}
