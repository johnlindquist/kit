export {}
import { editor } from "./editor.api"

import {
  Key as KeyboardEnum,
  Channel,
  Mode,
} from "../core/enum.js"
import { KeyEnum } from "../core/keyboard.js"

import {
  ChannelHandler,
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
import { PlatformPath } from "path"

export interface AppState {
  input?: string
  inputChanged?: boolean
  flaggedValue?: any
  flag?: string
  tab?: string
  value?: any
  index?: number
  focused?: Choice
  history?: Script[]
  modifiers?: string[]
  count?: number
  name?: string
  description?: string
  script?: Script
  submitted?: boolean
  shortcut?: string
  paste?: string
  isPasteImage?: boolean
}

export interface AppMessage {
  channel: Channel
  pid: number
  newPid?: number
  state: AppState
  widgetId?: number
}

export interface Config {
  imagePath: string
  deleteSnippet: boolean
}

export interface EditorProps {
  options: EditorConfig
  height: number
  width: number
}

export type EditorOptions =
  editor.IStandaloneEditorConstructionOptions & {
    file?: string
    footer?: string
    scrollTo?: "top" | "center" | "bottom"
    hint?: string
    onInput?: PromptConfig["onInput"]
    onEscape?: PromptConfig["onEscape"]
    onAbandon?: PromptConfig["onAbandon"]
    onPaste?: PromptConfig["onPaste"]
    onBlur?: PromptConfig["onBlur"]
    onDrop?: PromptConfig["onDrop"]
    ignoreBlur?: boolean
    extraLibs?: { content: string; filePath: string }[]
  }

export type EditorConfig = string | EditorOptions

export type TextareaConfig = {
  placeholder?: string
  value?: string
  footer?: string
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
  (placeholderOrOptions?: string | TextareaConfig): Promise<
    string | void
  >
}

export interface Drop {
  (
    placeholder?:
      | string
      | {
          placeholder?: string
          hint?: string
        }
  ): Promise<any>
}
export interface Editor {
  (config?: EditorConfig & { hint?: string }): Promise<any>
}
export interface Form {
  (
    html?:
      | string
      | {
          html?: string
          hint?: string
        },
    formData?: any
  ): Promise<any>
}
export interface Div {
  (
    html?:
      | string
      | {
          placeholder?: string
          hint?: string
        },
    containerClass?: string
  ): Promise<any>
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
interface SetChoices {
  (
    choices: Choice[],
    className?: string,
    scripts?: boolean
  ): void
}

type SetTextAreaOptions = {
  value?: string
  placeholder?: string
}

export interface AppConfig {
  os: string
  isWin: boolean
  isMac: boolean
  assetPath: string
  version: string
  delimiter: string
  sep: string
}

export type GetAppData =
  | Channel.GET_ACTIVE_APP
  | Channel.GET_BACKGROUND
  | Channel.GET_MOUSE
  | Channel.GET_SCHEDULE
  | Channel.GET_BOUNDS
  | Channel.GET_SCREEN_INFO
  | Channel.GET_SCREENS_INFO
  | Channel.GET_SCRIPTS_STATE
  | Channel.GET_CLIPBOARD_HISTORY

export type SendNoOptions =
  | Channel.CLEAR_CACHE
  | Channel.CLEAR_CLIPBOARD_HISTORY
  | Channel.CLEAR_PREVIEW
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
  [Channel.GET_EDITOR_HISTORY]: undefined
  [Channel.GET_SCHEDULE]: undefined
  [Channel.GET_PROCESSES]: undefined
  [Channel.GET_BOUNDS]: undefined
  [Channel.GET_SCREEN_INFO]: undefined
  [Channel.GET_SCREENS_INFO]: undefined
  [Channel.GET_ACTIVE_APP]: undefined
  [Channel.GET_SCRIPTS_STATE]: undefined
  [Channel.GET_CLIPBOARD_HISTORY]: undefined
  [Channel.WIDGET_GET]: undefined
  [Channel.WIDGET_UPDATE]: {
    widgetId: number
    html: string
    options?: ShowOptions
  }
  [Channel.WIDGET_SET_STATE]: {
    state: any
  }
  [Channel.WIDGET_CAPTURE_PAGE]: undefined
  [Channel.WIDGET_CLICK]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_INPUT]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_END]: { widgetId: number }
  [Channel.WIDGET_FIT]: { widgetId: number }
  [Channel.WIDGET_SET_SIZE]: {
    widgetId: number
    width: number
    height: number
  }
  [Channel.WIDGET_SET_POSITION]: {
    widgetId: number
    x: number
    y: number
  }

  //
  [Channel.CLEAR_CACHE]: undefined
  [Channel.CLEAR_CLIPBOARD_HISTORY]: undefined
  [Channel.CLEAR_PROMPT_CACHE]: undefined
  [Channel.CLEAR_PREVIEW]: undefined
  [Channel.CONSOLE_CLEAR]: undefined
  [Channel.KIT_CLEAR]: undefined
  [Channel.KIT_PASTE]: undefined
  [Channel.HIDE_APP]: undefined
  [Channel.NEEDS_RESTART]: undefined
  [Channel.TOGGLE_TRAY]: undefined
  [Channel.UPDATE_APP]: undefined
  [Channel.QUIT_APP]: undefined
  //

  [Channel.APP_CONFIG]: AppConfig
  [Channel.CONSOLE_LOG]: string
  [Channel.CONSOLE_WARN]: string
  [Channel.SET_TRAY]: { label: string; scripts: string[] }
  [Channel.KIT_LOG]: string
  [Channel.KIT_WARN]: string
  [Channel.COPY_PATH_AS_PICTURE]: string
  [Channel.DEV_TOOLS]: any
  [Channel.EXIT]: number
  [Channel.NOTIFY]: {
    title: string
    message: string
    icon: string
  }
  [Channel.REMOVE_CLIPBOARD_HISTORY_ITEM]: string
  [Channel.SEND_KEYSTROKE]: Partial<KeyData>
  [Channel.SET_CONFIG]: Partial<Config>
  [Channel.SET_BOUNDS]: Partial<Rectangle>
  [Channel.SET_CHOICES]: Choice[]
  [Channel.SET_UNFILTERED_CHOICES]: Choice[]
  [Channel.SET_DESCRIPTION]: string
  [Channel.SET_DIV_HTML]: string
  [Channel.SET_EDITOR_CONFIG]: EditorConfig
  [Channel.SET_FLAGS]: FlagsOptions
  [Channel.SET_FORM_HTML]: { html: string; formData: any }
  [Channel.SET_HINT]: string
  [Channel.SET_IGNORE_BLUR]: boolean
  [Channel.SET_INPUT]: string
  [Channel.SET_FILTER_INPUT]: string
  [Channel.SET_FOCUSED]: string
  [Channel.SET_FOOTER]: string
  [Channel.SET_LOADING]: boolean
  [Channel.SET_LOG]: string
  [Channel.SET_LOGO]: string
  [Channel.SET_LOGIN]: boolean
  [Channel.SET_NAME]: string
  [Channel.SET_OPEN]: boolean
  [Channel.SET_PANEL]: string
  [Channel.SET_PID]: number
  [Channel.SET_PLACEHOLDER]: string
  [Channel.SET_PREVIEW]: string
  [Channel.SET_PROMPT_BLURRED]: boolean
  [Channel.SET_PROMPT_DATA]: PromptData
  [Channel.SET_PROMPT_PROP]: any
  [Channel.SET_READY]: boolean
  [Channel.SET_SCRIPT]: Script
  [Channel.SET_SCRIPT_HISTORY]: Script[]
  [Channel.SET_SPLASH_BODY]: string
  [Channel.SET_SPLASH_HEADER]: string
  [Channel.SET_SPLASH_PROGRESS]: number
  [Channel.SET_SUBMIT_VALUE]: any
  [Channel.SET_TAB_INDEX]: number
  [Channel.SET_TEXTAREA_CONFIG]: TextareaConfig
  [Channel.SET_TEXTAREA_VALUE]: string
  [Channel.SET_THEME]: any
  [Channel.START]: string
  [Channel.SHOW]: { options: ShowOptions; html: string }
  [Channel.SHOW_IMAGE]: {
    options: ShowOptions
    image: string | { src: string }
  }
  [Channel.SWITCH_KENV]: string
  [Channel.TERMINAL]: string
  [Channel.TOAST]: {
    text: string
    type: "info" | "error" | "success" | "warning"
  }
  [Channel.TOGGLE_BACKGROUND]: string
  [Channel.VALUE_INVALID]: string
  [Channel.TERMINATE_PROCESS]: number

  [Channel.KEYBOARD_CONFIG]: { autoDelayMs: number }
  [Channel.KEYBOARD_TYPE]: string
  [Channel.KEYBOARD_PRESS_KEY]: Key[]
  [Channel.KEYBOARD_RELEASE_KEY]: Key[]
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

export interface SetFocused {
  (id: string): void
}

export interface SetIgnoreBlur {
  (ignoreBlur: boolean): void
}

export interface SetLoading {
  (loading: boolean): void
}

export interface SetConfig {
  (config: Config): void
}

export interface SetPlaceholder {
  (placeholder: string): void
}

export interface SetPanel {
  (html: string, containerClasses?: string): void
}

export interface SetFooter {
  (footer: string): void
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

export interface GetEditorHistory {
  (): Promise<
    {
      content: string
      timestamp: string
    }[]
  >
}

export interface Submit {
  (value: any): void
}

export type ShowOptions =
  BrowserWindowConstructorOptions & {
    ttl?: number
    draggable?: boolean
  }

export interface ShowAppWindow {
  (content: string, options?: ShowOptions): void
}

export interface ClipboardItem {
  id: string
  name: string
  description: string
  value: string
  type: string
  timestamp: string
  maybeSecret: boolean
  preview?: string
}

export interface Keyboard {
  type: (text: string) => Promise<void>
  pressKey: (...keys: Key[]) => Promise<void>
  releaseKey: (...keys: Key[]) => Promise<void>
  config: (config: { autoDelayMs: number }) => Promise<void>
}

export interface ExecLog {
  (
    command: string,
    logger?: typeof console.log
  ): ReturnType<exec>
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

  setFocused: SetFocused
  setPlaceholder: SetPlaceholder
  setDiv: SetPanel
  setPanel: SetPanel
  setFooter: SetFooter
  setPreview: SetPreview
  setPrompt: SetPrompt
  setBounds: SetBounds
  getBounds: GetBounds
  getActiveScreen: GetActiveScreen
  setHint: SetHint
  setName: SetName
  setDescription: SetDescription
  setInput: SetInput
  setFilterInput: SetInput
  setTextareaValue: SetTextareaValue

  setIgnoreBlur: SetIgnoreBlur
  setLoading: SetLoading

  setConfig: SetConfig

  show: ShowAppWindow
  showImage: ShowAppWindow

  currentOnTab: any

  setChoices: SetChoices
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
  getEditorHistory: GetEditorHistory
  removeClipboardItem: (id: string) => void
  setTab: (tabName: string) => void
  submit: Submit
  mainScript: () => Promise<void>

  appKeystroke: SendKeystroke
  Key: typeof KeyboardEnum

  log: typeof console.log
  warn: typeof console.warn

  keyboard: Keyboard
  execLog: ExecLog
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
  var textarea: TextArea
  var drop: Drop
  var div: Div
  var editor: Editor
  var hotkey: Hotkey
  var send: Send

  var setFocused: SetFocused
  var setPlaceholder: SetPlaceholder
  var setPanel: SetPanel
  var setFooter: SetFooter
  var setChoices: SetChoices
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
  var setFilterInput: SetInput
  var setTextareaValue: SetTextareaValue
  var setIgnoreBlur: SetIgnoreBlur
  var setLoading: SetLoading

  var setConfig: SetConfig

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var hide: () => Promise<void>

  var dev: (object?: any) => void
  var getClipboardHistory: () => Promise<ClipboardItem[]>
  var clearClipboardHistory: () => void
  var getEditorHistory: GetEditorHistory
  var removeClipboardItem: (id: string) => void
  var setTab: (tabName: string) => void
  var submit: Submit
  var mainScript: () => Promise<void>

  var appKeystroke: SendKeystroke
  var Key: typeof KeyboardEnum

  var log: typeof console.log
  var warn: typeof console.warn

  var keyboard: Keyboard

  var execLog: ExecLog
}
