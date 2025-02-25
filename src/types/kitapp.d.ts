import { execaCommand as exec } from 'execa'
import type { editor as editorApi } from './editor.api.d.ts'

import { type Key as CoreKeyEnum, Channel, Mode, type statuses, type PROMPT as PROMPT_OBJECT } from '../core/enum.js'

import type { AppDb } from '../core/db.js'

import {
  type Action,
  type AppState,
  ChannelHandler,
  type Choice,
  Choices,
  type FlagsObject,
  type PromptConfig,
  type PromptData,
  type ScoredChoice,
  type Script,
  type Shortcut
} from './core.js'
import type { BrowserWindowConstructorOptions, Display, Rectangle } from './electron.js'

import type { Trash } from './packages.js'
import type { marked } from '../globals/marked.js'
import type { Token as MarkedToken } from "marked"
import type { ChildProcess } from 'node:child_process'
import type { UiohookKeyboardEvent, UiohookMouseEvent, UiohookWheelEvent } from './io.js'
import type { KeyEnum } from '../core/keyboard.js'
import type { FileSearchOptions } from './platform.js'
import type { NotificationConstructorOptions } from './notify.js'
import type { ShebangConfig } from '../core/shebang.js'
import type { Readable } from 'node:stream'

export type Status = (typeof statuses)[number]

export interface AppMessage {
  channel: Channel
  pid: number
  newPid?: number
  state: AppState
  widgetId?: number
  promptId: string
  env?: Record<string, string>
}

export interface Config {
  imagePath: string
  deleteSnippet: boolean
}

export interface BaseMessage {
  text: string
  position: string
  type: string
}

// Todo: Implement more methods and fix types accordingly
export interface IMessage extends BaseMessage {
  id: string | number
  title: string
  focus: boolean
  date: number | Date
  dateString?: string
  avatar?: string
  titleColor: string
  forwarded: boolean
  replyButton: boolean
  removeButton: boolean
  status: 'waiting' | 'sent' | 'received' | 'read'
  copiableDate?: boolean
  retracted: boolean
  className?: string
  renderHTML?: boolean
}

export type Message = string | Partial<IMessage>

export type Notify = (bodyOrOptions: NotificationConstructorOptions | string) => Promise<void>

export type Chat = ((config?: PromptConfig, actions?: Action[]) => Promise<Message[]>) & {
  addMessage: (message: Message) => void
  setMessage: (index: number, message: Message) => void
  getMessages: () => Promise<BaseMessage[]>
  setMessages: (messages: Message[]) => Promise<void>
  pushToken: (token: string) => Promise<void>
}

interface ToastOptions {
  /**
   * Pause the timer when the mouse hover the toast.
   * `Default: true`
   */
  pauseOnHover?: boolean
  /**
   * Pause the toast when the window loses focus.
   * `Default: true`
   */
  pauseOnFocusLoss?: boolean
  /**
   * Remove the toast when clicked.
   * `Default: true`
   */
  closeOnClick?: boolean
  /**
   * Set the delay in ms to close the toast automatically.
   * Use `false` to prevent the toast from closing.
   * `Default: 5000`
   */
  autoClose?: number | false
  /**
   * Hide or show the progress bar.
   * `Default: false`
   */
  hideProgressBar?: boolean
  /**
   * Allow toast to be draggable
   * `Default: 'touch'`
   */
  draggable?: boolean | 'mouse' | 'touch'
  /**
   * The percentage of the toast's width it takes for a drag to dismiss a toast
   * `Default: 80`
   */
  draggablePercent?: number
}
export type Toast = (toast: string, options?: ToastOptions) => void

export type Prompt = {
  closeActions(): Promise<void>
  close(): void
  openActions(): void
  setInput(input: string): void
  focus(): Promise<void>
  blur(): Promise<void>
  hide(): Promise<void>
}

export type Mic = ((config?: MicConfig) => Promise<Buffer>) & {
  stop: () => Promise<Buffer>
  start: (config?: MicConfig) => Promise<string>
  stream: Readable
}

export type WebCam = (config?: PromptConfig) => Promise<string>

export type Speech = (config?: PromptConfig) => Promise<string>

export type Screenshot = (displayId?: number, bounds?: Rectangle) => Promise<Buffer>

export type ScreenshotConfig = {
  displayId?: Parameters<Screenshot>[0]
  bounds?: Parameters<Screenshot>[1]
}

export type MediaDeviceInfo = {
  name: string
  description: string
  group: string
  value: {
    deviceId: string
    kind: string
    label: string
    groupId: string
  }
  deviceId: string
  kind: string
  label: string
  groupId: string
}

export type GetMediaDevices = () => Promise<MediaDeviceInfo[]>

export type GetTypedText = () => Promise<string>

export type Find = (placeholderOrConfig?: string | PromptConfig, options?: FileSearchOptions) => Promise<string>

export type Editor = ((config?: EditorConfig & { hint?: string }, actions?: Action[]) => Promise<string>) & {
  setSuggestions: (suggestions: string[]) => Promise<void>
  setConfig: (config: EditorConfig) => Promise<void>
  append: (text: string) => Promise<void>
  getSelection: () => Promise<{
    text: string
    start: number
    end: number
  }>
  getCursorOffset: () => Promise<number>
  moveCursor: (offset: number) => Promise<void>
  insertText: (text: string) => Promise<void>
  setText: (text: string) => Promise<void>
  // setCodeHint: (hint: string) => Promise<void>
}

export interface EditorProps {
  options: EditorConfig
  height: number
  width: number
}

export type EditorOptions = editorApi.IStandaloneEditorConstructionOptions & {
  file?: string
  footer?: string
  scrollTo?: 'top' | 'center' | 'bottom'
  hint?: string
  onInput?: PromptConfig['onInput']
  onEscape?: PromptConfig['onEscape']
  onAbandon?: PromptConfig['onAbandon']
  onPaste?: PromptConfig['onPaste']
  onBlur?: PromptConfig['onBlur']
  onDrop?: PromptConfig['onDrop']
  extraLibs?: { content: string; filePath: string }[]
  template?: string
  suggestions?: string[]
  actions?: Action[]
}

export type EditorConfig = string | (PromptConfig & EditorOptions)

export type MicConfig = PromptConfig & {
  filePath?: string
  timeSlice?: number
}

export interface TextareaConfig extends PromptConfig {
  value?: string
}

export type EditorRef = editorApi.IStandaloneCodeEditor

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

export type TextArea = (placeholderOrOptions?: string | TextareaConfig) => Promise<string | void>

export type Drop = (placeholder?: string | PromptConfig, actions?: Action[]) => Promise<any>
export type Template = (template: string, config?: EditorConfig, actions?: Action[]) => Promise<string>
export type OldForm = (
  html?:
    | string
    | {
        html?: string
        hint?: string
      },
  formData?: any
) => Promise<any>

export type Form = (html: string | PromptConfig, formData?: any, actions?: Action[]) => Promise<any>

type Field =
  | {
      label?: string
      placeholder?: string
      value?: string
      type?: string
      required?: boolean
      min?: number
      max?: number
      step?: number
      pattern?: string
      [key: string]: string | boolean | number
    }
  | string

export type Fields = (fields: Field[] | (PromptConfig & { fields: Field[] }), actions?: Action[]) => Promise<string[]>

export type AudioOptions = {
  filePath: string
  playbackRate?: number
}

type EmojiObject = {
  activeSkinTone: string
  emoji: string
  names: string[]
  unified: string
  unifiedWithoutSkinTone: string
}

export type Emoji = (config?: PromptConfig) => Promise<EmojiObject>

export interface DivConfig extends PromptConfig {
  html: string
  placeholder?: string
  hint?: string
  footer?: string
  containerClasses?: string
}

export type Div = (html?: string | DivConfig, actions?: Action[]) => Promise<any>

export interface KeyData {
  key: KeyEnum
  keyCode: string
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
export type Hotkey = (placeholder?: string | PromptConfig) => Promise<KeyData>

type SetImage = string | { src: string }

type AddChoice = (choice: string | Choice) => Promise<void>

type SetChoices = (
  choices: (Choice | string)[],
  config?: {
    className?: string
    skipInitialSearch?: boolean
    inputRegex?: string
    generated?: boolean
  }
) => Promise<void>

type SetFormData = (formData: any) => Promise<void>

type AppendChoices = (choices: Choice[]) => Promise<void>

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

export interface KitStatus {
  status: Status
  message: string
}

export type Appearance = 'light' | 'dark'

type DisabledThottlingConfig = Pick<
  PromptConfig,
  'headerClassName' | 'footerClassName' | 'ui' | 'inputHeight' | 'itemHeight' | 'placeholder' | 'scriptPath'
>

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
  | Channel.CLIPBOARD_SYNC_HISTORY
  | Channel.CLEAR_PREVIEW
  | Channel.CLEAR_PROMPT_CACHE
  | Channel.CLEAR_TABS
  | Channel.CONSOLE_CLEAR
  | Channel.KIT_CLEAR
  | Channel.HIDE_APP
  | Channel.BLUR_APP
  | Channel.NEEDS_RESTART
  | Channel.TOGGLE_TRAY
  | Channel.UPDATE_APP
  | Channel.QUIT_APP
  | Channel.OPEN_DEV_TOOLS
  | Channel.OPEN_MENU
  | Channel.FOCUS
  | Channel.SHOW_EMOJI_PANEL
  | Channel.BEEP
  | Channel.PING
  | Channel.PONG
export interface ChannelMap {
  // Figure these undefined out later
  [Channel.KIT_LOADING]: string
  [Channel.KIT_READY]: string
  [Channel.MAIN_MENU_READY]: string
  [Channel.ERROR]: {
    script: string
    message?: string
    stack?: string
  }
  [Channel.VALUE_SUBMITTED]: any
  [Channel.GET_BACKGROUND]: undefined
  [Channel.GET_COLOR]: undefined
  [Channel.GET_TYPED_TEXT]: undefined
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
  [Channel.GET_APP_STATE]: undefined
  [Channel.CUT_TEXT]: undefined
  [Channel.START_DRAG]: {
    filePath: string
    iconPath?: string
  }
  [Channel.WIDGET_GET]: undefined
  [Channel.WIDGET_UPDATE]: {
    widgetId: number
    html: string
    options?: ShowOptions
  }
  [Channel.WIDGET_EXECUTE_JAVASCRIPT]: {
    widgetId: number
    js: string
  }
  [Channel.WIDGET_SET_STATE]: {
    state: any
  }
  [Channel.WIDGET_CAPTURE_PAGE]: undefined
  [Channel.WIDGET_CLICK]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_DROP]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_MOUSE_DOWN]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_INPUT]: {
    targetId: string
    windowId: number
  }
  [Channel.WIDGET_DRAG_START]: {
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

  [Channel.WIDGET_CALL]: {
    widgetId: number
    method: string
    args?: any[]
  }

  //

  [Channel.CLEAR_CACHE]: undefined
  [Channel.CLEAR_SCRIPTS_MEMORY]: undefined
  [Channel.CLEAR_TABS]: string[]
  [Channel.CLIPBOARD_SYNC_HISTORY]: undefined
  [Channel.CLEAR_PROMPT_CACHE]: undefined
  [Channel.CLEAR_PREVIEW]: undefined
  [Channel.CONSOLE_CLEAR]: undefined
  [Channel.KIT_CLEAR]: undefined
  [Channel.KIT_PASTE]: undefined
  [Channel.HIDE_APP]: HideOptions
  [Channel.BLUR_APP]: undefined
  [Channel.NEEDS_RESTART]: undefined
  [Channel.TOGGLE_TRAY]: undefined
  [Channel.UPDATE_APP]: undefined
  [Channel.QUIT_APP]: undefined
  [Channel.PRO_STATUS]: undefined
  //

  [Channel.APP_CONFIG]: AppConfig
  [Channel.APP_DB]: AppDb
  [Channel.ADD_CHOICE]: Choice
  [Channel.CONSOLE_LOG]: string
  [Channel.CONSOLE_WARN]: string
  [Channel.CONSOLE_ERROR]: string
  [Channel.CONSOLE_INFO]: string
  [Channel.TERM_EXIT]: string
  [Channel.TERM_KILL]: string
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
  [Channel.SHEBANG]: ShebangConfig
  [Channel.SELECT_FILE]: string
  [Channel.SELECT_FOLDER]: string
  [Channel.REVEAL_FILE]: string
  [Channel.PLAY_AUDIO]: AudioOptions
  [Channel.STOP_AUDIO]: undefined
  [Channel.STOP_MIC]: undefined
  [Channel.SPEAK_TEXT]: any

  [Channel.REMOVE_CLIPBOARD_HISTORY_ITEM]: string
  [Channel.SEND_KEYSTROKE]: Partial<KeyData>
  [Channel.SET_CONFIG]: Partial<Config>
  [Channel.SET_DISABLE_SUBMIT]: boolean
  [Channel.SET_BOUNDS]: Partial<Rectangle>
  [Channel.SET_CHOICES]: {
    choices: Choice[]
    skipInitialSearch?: boolean
    inputRegex?: string
    generated?: boolean
  }
  [Channel.SET_FORM_DATA]: {
    [key: string]: string
  }
  [Channel.SET_UNFILTERED_CHOICES]: Choice[]
  [Channel.SET_CHOICES_CONFIG]: { preload: boolean }
  [Channel.SET_SCORED_CHOICES]: ScoredChoice[]
  [Channel.SET_SCORED_FLAGS]: ScoredChoice[]
  [Channel.SET_DARK]: boolean

  [Channel.SET_DESCRIPTION]: string
  [Channel.SET_EDITOR_CONFIG]: EditorConfig
  [Channel.SET_EDITOR_SUGGESTIONS]: string[]
  [Channel.APPEND_EDITOR_VALUE]: string
  [Channel.SET_ENTER]: string
  [Channel.SET_FIELDS]: Field[]
  [Channel.SET_FLAGS]: FlagsObject
  [Channel.SET_FLAG_VALUE]: any
  [Channel.SET_FORM_HTML]: { html: string; formData: any }
  [Channel.SET_FORM]: PromptConfig[]
  [Channel.SET_HINT]: string
  [Channel.SET_IGNORE_BLUR]: boolean
  [Channel.SET_KIT_STATE]: any
  [Channel.SET_INPUT]: string
  [Channel.APPEND_INPUT]: string
  [Channel.SCROLL_TO]: 'top' | 'bottom' | 'center' | null
  [Channel.SET_FILTER_INPUT]: string
  [Channel.SET_FOCUSED]: string
  [Channel.SET_FOOTER]: string
  [Channel.SET_LOADING]: boolean
  [Channel.SET_PROGRESS]: number
  [Channel.SET_RUNNING]: boolean
  [Channel.SET_LOG]: string
  [Channel.SET_LOGO]: string
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
  [Channel.SET_RESIZE]: boolean
  [Channel.SET_PAUSE_RESIZE]: boolean
  [Channel.SET_RESIZING]: boolean
  [Channel.SET_SCRIPT]: Script
  [Channel.SET_SHORTCUTS]: Shortcut[]
  [Channel.DEBUG_SCRIPT]: Script
  [Channel.SET_SCRIPT_HISTORY]: Script[]
  [Channel.SET_SPLASH_BODY]: string
  [Channel.SET_SPLASH_HEADER]: string
  [Channel.SET_SPLASH_PROGRESS]: number
  [Channel.SET_STATUS]: KitStatus
  [Channel.SET_SELECTED_TEXT]: string
  [Channel.SET_SUBMIT_VALUE]: any
  [Channel.SET_TAB_INDEX]: number
  [Channel.SET_TEXTAREA_CONFIG]: TextareaConfig
  [Channel.SET_TEXTAREA_VALUE]: string
  [Channel.SET_THEME]: any
  [Channel.SET_TEMP_THEME]: any
  [Channel.SET_VALUE]: any
  [Channel.START]: string
  [Channel.SHOW]: { options: ShowOptions; html: string }
  [Channel.SHOW_LOG_WINDOW]: string
  [Channel.SHOW_IMAGE]: {
    options: ShowOptions
    image: string | { src: string }
  }
  [Channel.SWITCH_KENV]: string
  [Channel.TERMINAL]: string
  [Channel.TERM_WRITE]: string
  [Channel.TOAST]: {
    text: string
    options: any
  }
  [Channel.TOGGLE_BACKGROUND]: string
  [Channel.SET_SEARCH_DEBOUNCE]: boolean
  [Channel.VALUE_INVALID]: string
  [Channel.TERMINATE_PROCESS]: number

  [Channel.KEYBOARD_CONFIG]: { autoDelayMs: number }
  [Channel.KEYBOARD_TYPE]: string
  [Channel.KEYBOARD_PRESS_KEY]: CoreKeyEnum[]
  [Channel.KEYBOARD_RELEASE_KEY]: CoreKeyEnum[]

  [Channel.SCRIPT_CHANGED]: Script
  [Channel.SCRIPT_REMOVED]: Script
  [Channel.SCRIPT_ADDED]: Script

  [Channel.TRASH]: {
    input: Parameters<Trash>[0]
    options: Parameters<Trash>[1]
  }

  [Channel.COPY]: string
  [Channel.PASTE]: undefined

  [Channel.VERIFY_FULL_DISK_ACCESS]: undefined
  [Channel.SET_ALWAYS_ON_TOP]: boolean
  [Channel.SET_APPEARANCE]: Appearance
  [Channel.PRELOAD]: string
  [Channel.MIC_STREAM]: boolean
  [Channel.START_MIC]: MicConfig
  [Channel.SCREENSHOT]: ScreenshotConfig
  [Channel.SYSTEM_CLICK]: boolean
  [Channel.SYSTEM_KEYDOWN]: boolean
  [Channel.SYSTEM_KEYUP]: boolean
  [Channel.SYSTEM_MOUSEDOWN]: boolean
  [Channel.SYSTEM_MOUSEUP]: boolean
  [Channel.SYSTEM_MOUSEMOVE]: boolean
  [Channel.SYSTEM_WHEEL]: boolean
  [Channel.STAMP_SCRIPT]: Script
  [Channel.VITE_WIDGET_SEND]: any
}
export interface Send {
  (channel: Channel | GetAppData | SendNoOptions): void
  <C extends keyof ChannelMap, T extends ChannelMap[C]>(channel: C, data: T): void
}

export interface SendData<C extends keyof ChannelMap> {
  pid: number
  kitScript: string
  channel: C
  value: ChannelMap[C]
}

export type GenericSendData = SendData<keyof ChannelMap>

export type SetHint = (hint: string) => void

export type SetName = (name: string) => void

export type SetDescription = (description: string) => void

export type SetInput = (input: string) => Promise<void>

export type ScrollTo = (location: 'top' | 'bottom' | 'center') => Promise<void>

export type SetTextareaValue = (value: string) => void

export type SetIgnoreBlur = (ignoreBlur: boolean) => void

export type SetFocused = (id: string) => void

export type SetResize = (resize: boolean) => void

export type SetLoading = (loading: boolean) => void

export type SetProgress = (progress: number) => void
export type ShowDeprecated = (message: string) => Promise<void>

export type SetStatus = (status: KitStatus) => void

export interface KitTheme {
  '--color-primary-light': string
  '--color-secondary-light': string
  '--color-primary': string
  '--color-secondary-dark': string
  '--color-background-light': string
  '--color-background-dark': string
  '--opacity-themelight': string
  '--opacity-themedark': string
  name: string
  foreground: string
  background: string
  accent: string
  ui: string
  opacity: string
}

export type SetTheme = (theme: string) => Promise<void>

export type SetPlaceholder = (placeholder: string) => Promise<void>

export type SetEnter = (text: string) => Promise<void>

export type SetPanel = (html: string, containerClasses?: string) => Promise<void>

export type SetFooter = (footer: string) => Promise<void>

export type SetPrompt = (config: Partial<PromptData>) => Promise<void>
export type SetPreview = (html: string, containerClasses?: string) => Promise<void>
export type SetBounds = (bounds: Partial<Rectangle>) => Promise<void>

export type SendKeystroke = (keyData: Partial<KeyData>) => void

export type GetBounds = () => Promise<Rectangle>

export type GetActiveScreen = () => Promise<Display>

export type GetEditorHistory = () => Promise<
  {
    content: string
    timestamp: string
  }[]
>

export type Submit = (value: any) => Promise<void>

export type ShowOptions = BrowserWindowConstructorOptions & {
  ttl?: number
  draggable?: boolean
  center?: boolean
}

export type ShowAppWindow = (content: string, options?: ShowOptions) => Promise<void>

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

export interface System {
  onClick: typeof global.onClick
  onMousedown: typeof global.onMousedown
  onMouseup: typeof global.onMouseup
  onWheel: typeof global.onWheel
  onKeydown: typeof global.onKeydown
  onKeyup: typeof global.onKeyup
}
/**
 * A handler for a script event. Receives the full path to the script that was affected
 * @param script The script that was added, changed, or removed.
 */
type ScriptHandler = (scriptPath: string) => void
type ScriptEventHandler = (handler: ScriptHandler) => removeListener

export type App = {
  /**
   * A handler for a script event. Receives the full path to the script that was added.
   * @param scriptPath The full path to the script that was added
   */
  onScriptAdded?: ScriptEventHandler
  /**
   * A handler for a script event. Receives the full path to the script that was changed.
   * @param scriptPath The full path to the script that was changed
   */
  onScriptChanged?: ScriptEventHandler
  /**
   * A handler for a script event. Receives the full path to the script that was removed.
   * @param scriptPath The full path to the script that was removed
   */
  onScriptRemoved?: ScriptEventHandler
}

export interface Keyboard {
  type: (...text: (string | Key)[]) => Promise<void>
  /**
   * Types text or keys with a delay between each keystroke.
   * @param config Configuration object for typing.
   * @param config.rate The delay in milliseconds between keystrokes. Note: values less than 700 can give weird results.
   * @param config.textOrKeys The text or keys to type.
   */
  typeDelayed: (config: {
    rate?: number
    textOrKeys: string | Key[]
  }) => Promise<void>
  /**
   * Presses a key.
   * @param keys The keys to press.
   */
  pressKey: (...keys: CoreKeyEnum[]) => Promise<void>
  /**
   * Releases a key.
   * @param keys The keys to release.
   */
  releaseKey: (...keys: CoreKeyEnum[]) => Promise<void>
  /**
   * Taps a key.
   * @param keys The keys to tap.
   */
  tap: (...keys: CoreKeyEnum[]) => Promise<void>
  /**
   * @deprecated Use `keyboard.typeDelayed` or set `KIT_TYPING_RATE` and use `keyboard.type` instead.
   */
  config: (config: { autoDelayMs: number }) => Promise<void>
}

export interface Mouse {
  leftClick: () => Promise<void>
  rightClick: () => Promise<void>
  move: (points: { x: number; y: number }[]) => Promise<void>
  setPosition: (position: {
    x: number
    y: number
  }) => Promise<void>
}

export interface Bookmark {
  title: string
  url: string
}

export interface KitClipboard {
  readText: () => Promise<string>
  readHTML: () => Promise<string>
  readImage: () => Promise<Buffer>
  readRTF: () => Promise<string>
  readBookmark: () => Promise<Bookmark>
  readFindText: () => Promise<string>

  writeText: (text: string) => Promise<void>
  writeHTML: (html: string) => Promise<void>
  writeImage: (image: Buffer) => Promise<void>
  writeRTF: (rtf: string) => Promise<void>
  writeBookmark: (bookmark: Bookmark) => Promise<void>
  writeFindText: (text: string) => Promise<void>

  clear: () => Promise<void>
}

export type RegisterShortcut = (shortcut: string, callback: () => void) => Promise<void>

export type UnregisterShortcut = (shortcut: string) => Promise<void>

export type GuideSection = {
  name: string
  raw: string
  group: string
  comments: {
    [key: string]: string
  }
}
export type Docs<T = any> = (
  markdownPath: string,
  options?:
    | Partial<PromptConfig>
    | ((sections?: GuideSection[], tokens?: MarkedToken[]) => Promise<Partial<PromptConfig>>)
) => Promise<T>

export type ExecLog = (command: string, logger?: typeof console.log) => ChildProcess

export interface AppApi {
  textarea: TextArea
  drop: Drop
  editor: Editor
  template: Template
  form: Form
  fields: Fields
  emoji: Emoji
  div: Div
  hotkey: Hotkey
  prompt: Prompt

  kitPrompt: (promptConfig: PromptConfig) => Promise<any>
  send: Send
  setFocused: SetFocused
  setPlaceholder: SetPlaceholder
  setEnter: SetEnter
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
  showDeprecated: ShowDeprecated
  setTextareaValue: SetTextareaValue

  setIgnoreBlur: SetIgnoreBlur
  setResize: SetResize
  setLoading: SetLoading
  setProgress: SetProgress
  setStatus: SetStatus
  setTheme: SetTheme
  setScriptTheme: SetTheme

  showImage: ShowAppWindow

  currentOnTab: any
  addChoice: AddChoice
  setChoices: SetChoices
  clearTabs: () => void
  getDataFromApp: (channel: Channel) => Promise<any>
  sendWait: (channel: Channel, value: any) => Promise<any>
  sendWaitLong: (channel: Channel, value: any) => Promise<any>
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

  show: () => Promise<void>
  hide: (hideOptions?: HideOptions) => Promise<void>
  blur: () => Promise<void>

  dev: (object: any) => Promise<void>
  getClipboardHistory: () => Promise<ClipboardItem[]>
  getEditorHistory: GetEditorHistory
  removeClipboardItem: (id: string) => void
  setTab: (tabName: string) => void
  submit: Submit
  mainScript: (input?: string, tab?: string) => Promise<void>

  appKeystroke: SendKeystroke
  Key: Key

  log: typeof console.log
  warn: typeof console.warn

  keyboard: Keyboard
  clipboard: KitClipboard
  execLog: ExecLog

  focus: () => Promise<void>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>
  docs: Docs
  getAppState: any

  registerShortcut: RegisterShortcut
  unregisterShortcut: UnregisterShortcut
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

export interface HideOptions {
  preloadScript?: string
}
declare global {
  var textarea: TextArea
  /**
   * Use `await drop()` to prompt the user to drop a file or folder.
   * #### drop example
   * ```ts
   * // Dropping text or an image from the browser returns a string
   * let fileInfos = await drop()
   * let filePaths = fileInfos.map(f => f.path).join(",")
   * await div(md(filePaths))
   * ```
   * [Examples](https://scriptkit.com?query=drop) | [Docs](https://johnlindquist.github.io/kit-docs/#drop) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=drop)
   */
  var drop: Drop
  /**
   * `div` displays HTML. Pass a string of HTML to `div` to render it. `div` is commonly used in conjunction with `md` to render markdown.
   * 1. Just like arg, the first argument is a string or a prompt configuration object.
   * 2. Optional:The second argument is a string of tailwind class to apply to the container, e.g., `bg-white p-4`.
   * #### div example
   * ```ts
   * await div(`Hello world!`)
   * ```
   * #### div with markdown
   * ```ts
   * await div(md(`
   * # example!
   * 
   * [Examples](https://scriptkit.com?query=div) | [Docs](https://johnlindquist.github.io/kit-docs/#div) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=div)
   */
  var div: Div
  /**
   * Use an HTML form which returns an Object based on the names of the form fields.
   * #### form example
   * ```ts
   * let result = await form(`
   * <div class="p-4">
   *     <input type="text" name="textInput" placeholder="Text Input" />
   *     <input type="password" name="passwordInput" placeholder="Password" />
   *     <input type="email" name="emailInput" placeholder="Email" />
   *     <input type="number" name="numberInput" placeholder="Number" />
   *     <input type="date" name="dateInput" placeholder="Date" />
   *     <input type="time" name="timeInput" placeholder="Time" />
   *     <input type="datetime-local" name="dateTimeInput" placeholder="Date and Time" />
   *     <input type="month" name="monthInput" placeholder="Month" />
   *     <input type="week" name="weekInput" placeholder="Week" />
   *     <input type="url" name="urlInput" placeholder="URL" />
   *     <input type="search" name="searchInput" placeholder="Search" />
   *     <input type="tel" name="telInput" placeholder="Telephone" />
   *     <input type="color" name="colorInput" placeholder="Color" />
   *     <textarea name="textareaInput" placeholder="Textarea"></textarea>
   * </div>
   * `)
   * inspect(result)
   * ```
   * [Examples](https://scriptkit.com?query=form) | [Docs](https://johnlindquist.github.io/kit-docs/#form) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=form)
   */
  var form: Form
  /**
   * The `fields` prompt allows you to rapidly create a form with fields. 
   * 1. An array of labels or objects with label and field properties.
   * #### fields example
   * ```ts
   * let [first, last] = await fields(["First name", "Last name"])
   * ```
   * #### fields edit the keys and values of an object
   * ```ts
   * let data = {
   *   name: "John",
   *   age: 42,
   *   location: "USA",
   * };
   * let result = await fields(
   *   Object.entries(data).map(([key, value]) => ({
   *     name: key,
   *     label: key,
   *     value: String(value),
   *   }))
   * );
   * let newData = Object.entries(data).map(([key], i) => ({
   *   [key]: result[i],
   * }));
   * inspect(newData);
   * ```
   * #### fields with field properties
   * ```ts
   * let [name, age] = await fields([
   *     {
   *         name: "name",
   *         label: "Name",
   *         type: "text",
   *         placeholder: "John"
   *     },
   *     {
   *         name: "age",
   *         label: "Age",
   *         type: "number",
   *         placeholder: "40"
   *     }
   * ])
   * ```
   * [Examples](https://scriptkit.com?query=fields) | [Docs](https://johnlindquist.github.io/kit-docs/#fields) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=fields)
   */
  var fields: Fields
  var emoji: Emoji
  /**
   * The `editor` function opens a text editor with the given text. The editor is a full-featured "Monaco" editor with syntax highlighting, find/replace, and more. The editor is a great way to edit or update text to write a file. The default language is markdown.
   * #### editor example
   * ```ts
   * let content = await editor()
   * ```
   * #### editor load remote text content
   * ```ts
   * let response = await get(`https://raw.githubusercontent.com/johnlindquist/kit/main/API.md`)
   * let content = await editor(response.data)
   * ```
   * #### editor with initial content
   * ```ts
   * let content = await editor("Hello world!")
   * ```
   * [Examples](https://scriptkit.com?query=editor) | [Docs](https://johnlindquist.github.io/kit-docs/#editor) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=editor)
   */
  var editor: Editor
  /**
   * The `template` prompt will present the editor populated by your template. You can then tab through each variable in your template and edit it. 
   * 1. The first argument is a string template. Add variables using $1, $2, etc. You can also use 
   * [//]: # (\${1:default value} to set a default value.&#41;)
   * #### template example
   * ```ts
   * let text = await template(`Hello $1!`)
   * ```
   * #### template standard usage
   * ```ts
   * let text = await template(`
   * Dear \${1:name},
   * Please meet me at \${2:address}
   * Sincerely, John`)
   * ```
   * [Examples](https://scriptkit.com?query=template) | [Docs](https://johnlindquist.github.io/kit-docs/#template) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=template)
   */
  var template: Template

  /**
   * The `hotkey` prompt allows you to press modifier keys, then submits once you've pressed a non-monodifier key. For example, press `command` then `e` to submit key info about the `command` and `e` keys:
   * ```json
   * {
   *   "key": "e",
   *   "command": true,
   *   "shift": false,
   *   "option": false,
   *   "control": false,
   *   "fn": false,
   *   "hyper": false,
   *   "os": false,
   *   "super": false,
   *   "win": false,
   *   "shortcut": "command e",
   *   "keyCode": "KeyE"
   * }
   * ```
   * This can be useful when you want to use a palette of commands and trigger each of them by switching on a hotkey.
   * 1. Optional: The first argument is a string to display in the prompt.
   * #### hotkey example
   * ```ts
   * let keyInfo = await hotkey()
   * await editor(JSON.stringify(keyInfo, null, 2))
   * ```
   * [Examples](https://scriptkit.com?query=hotkey) | [Docs](https://johnlindquist.github.io/kit-docs/#hotkey) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=hotkey)
   */
  var hotkey: Hotkey
  var send: Send
  var sendWait: (channel: Channel, value?: any, timeout?: number) => Promise<any>
  var headers: Record<string, string>
  var sendResponse: (body: any, headers?: Record<string, string>) => Promise<any>
  var sendWaitLong: (channel: Channel, value?: any, timeout?: number) => Promise<any>

  var setFocused: SetFocused
  var setEnter: SetEnter
  var setPlaceholder: SetPlaceholder
  /**
   * Sets the panel content.
   * #### setPanel example
   * ```ts
   * await setPanel("<h1>Hello, world!</h1>")
   * ```
   * [Examples](https://scriptkit.com?query=setPanel) | [Docs](https://johnlindquist.github.io/kit-docs/#setPanel) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setPanel)
   */
  var setPanel: SetPanel
  var setFooter: SetFooter
  var addChoice: AddChoice
  var appendChoices: AppendChoices
  var setChoices: SetChoices
  var setFormData: SetFormData
  var clearTabs: () => void
  var setDiv: SetPanel
  /**
   * Sets the preview content.
   * #### setPreview example
   * ```ts
   * await setPreview("<h1>Preview</h1>")
   * ```
   * [Examples](https://scriptkit.com?query=setPreview) | [Docs](https://johnlindquist.github.io/kit-docs/#setPreview) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setPreview)
   */
  var setPreview: SetPreview
  /**
   * Sets the prompt content.
   * #### setPrompt example
   * ```ts
   * await setPrompt("<h1>Enter your name:</h1>")
   * ```
   * [Examples](https://scriptkit.com?query=setPrompt) | [Docs](https://johnlindquist.github.io/kit-docs/#setPrompt) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setPrompt)
   */
  var setPrompt: SetPrompt
  var setBounds: SetBounds
  var getBounds: GetBounds
  var getActiveScreen: GetActiveScreen
  var setHint: SetHint
  var setName: SetName
  var setDescription: SetDescription
  var setInput: SetInput
  var appendInput: SetInput
  var scrollTo: ScrollTo
  var setFilterInput: SetInput
  var setTextareaValue: SetTextareaValue
  /**
   * Sets whether to ignore blur events.
   * #### setIgnoreBlur example
   * ```ts
   * await setIgnoreBlur(true)
   * ```
   * [Examples](https://scriptkit.com?query=setIgnoreBlur) | [Docs](https://johnlindquist.github.io/kit-docs/#setIgnoreBlur) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setIgnoreBlur)
   */
  var setIgnoreBlur: SetIgnoreBlur
  var setResize: SetResize
  var setPauseResize: SetResize
  var setLoading: SetLoading
  var setProgress: SetProgress
  var setRunning: SetLoading
  /**
   * Set the system menu bar icon and message. 
   * Each status message will be appended to a list. 
   * Clicking on the menu will display the list of messages. 
   * The status and messages will be dismissed once the tray closes, so use `log` if you want to persist messages.
   * #### setStatus example
   * ```ts
   * await setStatus({
   *   message: "Working on it...",
   *   status: "busy",
   * })
   * ```
   * [Examples](https://scriptkit.com?query=setStatus) | [Docs](https://johnlindquist.github.io/kit-docs/#setStatus) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setStatus)
   */
  var setStatus: SetStatus
  var setTheme: SetTheme
  var setScriptTheme: SetTheme

  var showImage: ShowAppWindow

  /**
   * Shows the main prompt.
   * #### show example
   * ```ts
   * await show()
   * ```
   * [Examples](https://scriptkit.com?query=show) | [Docs](https://johnlindquist.github.io/kit-docs/#show) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=show)
   */
  var show: () => Promise<void>
  /**
   * Hides the main prompt.
   * #### hide example
   * ```ts
   * await hide()
   * ```
   * [Examples](https://scriptkit.com?query=hide) | [Docs](https://johnlindquist.github.io/kit-docs/#hide) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=hide)
   */
  var hide: (hideOptions?: HideOptions) => Promise<void>
  /**
   * Returns focus to the previous app.
   * #### blur example
   * ```ts
   * import { URL, fileURLToPath } from "node:url";
   * await editor({
   *   onInit: async () => {
   *     const { workArea } = await getActiveScreen();
   *     const topLeft = { x: workArea.x, y: workArea.y };
   *     const size = { height: 900, width: 200 };
   *     await setBounds({
   *       ...topLeft,
   *       ...size,
   *     });
   *     await blur();
   * // get path to current file
   *     const currentScript = fileURLToPath(new URL(import.meta.url));
   *     const content = await readFile(currentScript, "utf8");
   *     const lines = content.split("\n");
   *     for await (const line of lines) {
   *       editor.append(`${line}\n`);
   *       await wait(100);
   *     }
   *   },
   * });
   * ```
   * [Examples](https://scriptkit.com?query=blur) | [Docs](https://johnlindquist.github.io/kit-docs/#blur) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=blur)
   */
  var blur: () => Promise<void>

  /**
   * `dev` Opens a standalone instance of Chrome Dev Tools so you can play with JavaScript in the console. Passing in an object will set the variable `x` to your object in the console making it easy to inspect.
   * 1. Optional: the first argument is an object to set to the variable `x` to in the console.
   * #### dev example
   * ```ts
   * dev()
   * ```
   * #### dev with object
   * ```ts
   * dev({
   *     name: "John",
   *     age: 40
   * })
   * ```
   * [Examples](https://scriptkit.com?query=dev) | [Docs](https://johnlindquist.github.io/kit-docs/#dev) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=dev)
   */
  var dev: (object?: any) => Promise<void>
  /**
   * Gets the clipboard history from the in-memory clipboard
   * #### getClipboardHistory example
   * ```ts
   * const history = await getClipboardHistory();
   * const text = await arg("Select from clipboard history", history);
   * await editor(text);
   * ```
   * [Examples](https://scriptkit.com?query=getClipboardHistory) | [Docs](https://johnlindquist.github.io/kit-docs/#getClipboardHistory) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getClipboardHistory)
   */
  var getClipboardHistory: () => Promise<ClipboardItem[]>
  /**
   * Clears the clipboard history.
   * #### clearClipboardHistory example
   * ```ts
   * await clearClipboardHistory()
   * ```
   * [Examples](https://scriptkit.com?query=clearClipboardHistory) | [Docs](https://johnlindquist.github.io/kit-docs/#clearClipboardHistory) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=clearClipboardHistory)
   */
  var clearClipboardHistory: () => Promise<void>
  var getEditorHistory: GetEditorHistory
  /**
   * Removes an item from the clipboard.
   * #### removeClipboardItem example
   * ```ts
   * await removeClipboardItem(item)
   * ```
   * [Examples](https://scriptkit.com?query=removeClipboardItem) | [Docs](https://johnlindquist.github.io/kit-docs/#removeClipboardItem) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=removeClipboardItem)
   */
  var removeClipboardItem: (id: string) => Promise<void>
  var setTab: (tabName: string) => void
  /**
   * Forcefully submit a value from an open prompt
   * #### submit example
   * ```ts
   * const result = await arg(
   *   {
   *     placeholder: "Pick one in under 3 seconds or I'll pick one for you",
   *     onInit: async () => {
   *       await wait(3000);
   *       submit("broccoli"); //forces a submission
   *     },
   *   },
   *   ["cookie", "donut"]
   * );
   * // Wait for 1 second
   * await editor(result);
   * ```
   * [Examples](https://scriptkit.com?query=submit) | [Docs](https://johnlindquist.github.io/kit-docs/#submit) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=submit)
   */
  var submit: Submit
  var mainScript: (input?: string, tab?: string) => Promise<void>

  var appKeystroke: SendKeystroke
  var Key: typeof CoreKeyEnum

  var log: typeof console.log
  var warn: typeof console.warn

  /**
   * > Note: Please use with caution
   * Type and/or tap keys on your keyboard
   * #### keyboard example
   * ```ts
   * prompt: false, // 99% of the time you'll want to hide the prompt
   * };
   * await keyboard.type("Hello, world!");
   * ```
   * #### keyboard example keys
   * ```ts
   * prompt: false,
   * };
   * await keyboard.tap(Key.LeftSuper, Key.A);
   * await wait(100);
   * await keyboard.tap(Key.LeftSuper, Key.C);
   * await wait(100);
   * await keyboard.tap(Key.LeftSuper, Key.N);
   * await wait(100);
   * await keyboard.tap(Key.LeftSuper, Key.V);
   * ```
   * [Examples](https://scriptkit.com?query=keyboard) | [Docs](https://johnlindquist.github.io/kit-docs/#keyboard) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=keyboard)
   */
  var keyboard: Keyboard
  /**
   * > Note: Please use with caution
   * move and click the system mouse
   * #### mouse example
   * ```ts
   * await mouse.move([
   *   { x: 100, y: 100 },
   *   { x: 200, y: 200 },
   * ]);
   * await mouse.leftClick();
   * await wait(100);
   * await mouse.rightClick();
   * await wait(100);
   * await mouse.setPosition({ x: 1000, y: 1000 });
   * ```
   * [Examples](https://scriptkit.com?query=mouse) | [Docs](https://johnlindquist.github.io/kit-docs/#mouse) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=mouse)
   */
  var mouse: Mouse
  /**
   * Read and write to the system clipboard
   * #### clipboard example
   * ```ts
   * // Write and read text to the clipboard
   * await clipboard.writeText("Hello from Script Kit!");
   * const result = await clipboard.readText();
   * await editor(result);
   * ```
   * #### clipboard example image
   * ```ts
   * const iconPath = kitPath("images", "icon.png");
   * const imageBuffer = await readFile(iconPath);
   * // Write and read image buffers to the clipboard
   * await clipboard.writeImage(imageBuffer);
   * const resultBuffer = await clipboard.readImage();
   * const outputPath = home("Downloads", "icon-copy.png");
   * await writeFile(outputPath, resultBuffer);
   * await revealFile(outputPath);
   * ```
   * [Examples](https://scriptkit.com?query=clipboard) | [Docs](https://johnlindquist.github.io/kit-docs/#clipboard) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=clipboard)
   */
  var clipboard: KitClipboard

  var execLog: ExecLog

  var focus: () => Promise<void>
  var setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>

  var docs: Docs
  var getAppState: any

  var registerShortcut: RegisterShortcut
  var unregisterShortcut: UnregisterShortcut
  var startDrag: (filePath: string, iconPath?: string) => void
  /**
   * Grab a color from your desktop
   * > Note: Behaves best on Mac. Windows _might_ be locked to only the Script Kit app prompt.
   * ```
   * {
   *     "sRGBHex": "#e092d9",
   *     "rgb": "rgb(224, 146, 217)",
   *     "rgba": "rgba(224, 146, 217, 1)",
   *     "hsl": "hsl(305, 56%, 73%)",
   *     "hsla": "hsla(305, 56%, 73%, 1)",
   *     "cmyk": "cmyk(0%, 35%, 3%, 12%)"
   *   }
   * ```
   * #### eyeDropper example
   * ```ts
   * const result = await eyeDropper();
   * await editor(JSON.stringify(result, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=eyeDropper) | [Docs](https://johnlindquist.github.io/kit-docs/#eyeDropper) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=eyeDropper)
   */
  var eyeDropper: () => Promise<{
    sRGBHex: string
  }>
  /**
   * A chat prompt. Use `chat.addMessage()` to insert messages into the chat.
   * > Note: Manually invoke `submit` inside of a shortcut/action/etc to end the chat.
   * Also see the included "chatgpt" example for a much more advanced scenario.
   * #### chat example
   * ```ts
   * await chat({
   *   onInit: async () => {
   *     chat.addMessage({
   *       // Note: text and position are implemented, there are other properties that are a WIP
   *       text: "You like Script Kit",
   *       position: "left",
   *     })
   * await wait(1000)
   * chat.addMessage({
   *       text: "Yeah! It's awesome!",
   *       position: "right",
   *     })
   * await wait(1000)
   * chat.addMessage({
   *       text: "I know, right?!?",
   *       position: "left",
   *     })
   * await wait(1000)
   * chat.addMessage({
   *       text: `<img src="https://media0.giphy.com/media/yeE6B8nEKcTMWWvBzD/giphy.gif?cid=0b9ef2f49arnbs4aajuycirjsclpbtimvib6a76g7afizgr5&ep=v1_gifs_search&rid=giphy.gif" width="200px" />`,
   *       position: "right",
   *     })
   *   },
   * })
   * ```
   * [Examples](https://scriptkit.com?query=chat) | [Docs](https://johnlindquist.github.io/kit-docs/#chat) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=chat)
   */
  var chat: Chat
  /**
   * Displays a small pop-up notification inside the Script Kit window.
   * #### toast example
   * ```ts
   * await toast("Hello from Script Kit!", {
   *   autoClose: 3000, // close after 3 seconds
   *   pauseOnFocusLoss: false
   * })
   * ```
   * [Examples](https://scriptkit.com?query=toast) | [Docs](https://johnlindquist.github.io/kit-docs/#toast) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=toast)
   */
  var toast: Toast
  /**
   * A file search prompt
   * #### find example
   * ```ts
   * let filePath = await find("Search in the Downloads directory", {
   *   onlyin: home("Downloads"),
   * })
   * await revealFile(filePath)
   * ```
   * [Examples](https://scriptkit.com?query=find) | [Docs](https://johnlindquist.github.io/kit-docs/#find) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=find)
   */
  var find: Find
  /**
   * Record from the mic, get a buffer back
   * #### mic example
   * ```ts
   * const tmpMicPath = tmpPath("mic.webm");
   * const buffer = await mic();
   * await writeFile(tmpMicPath, buffer);
   * await playAudioFile(tmpMicPath);
   * ```
   * [Examples](https://scriptkit.com?query=mic) | [Docs](https://johnlindquist.github.io/kit-docs/#mic) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=mic)
   */
  var mic: Mic
  /**
   * Captures a screenshot. Defaults to the display where the current mouse cursor is located and captures the full screen if no bounds are specified.
   * @param displayId - The identifier for the display to capture. If not provided, captures the display with the current mouse cursor.
   * @param bounds - The specific area of the screen to capture. If not provided, captures the entire screen.
   * @returns A Promise that resolves to a Buffer containing the screenshot data.
   */
  var screenshot: Screenshot
  /**
   * Prompt for webcam access. Press enter to capture an image buffer:
   * #### webcam example
   * ```ts
   * let buffer = await webcam()
   * let imagePath = tmpPath("image.jpg")
   * await writeFile(imagePath, buffer)
   * await revealFile(imagePath)
   * ```
   * [Examples](https://scriptkit.com?query=webcam) | [Docs](https://johnlindquist.github.io/kit-docs/#webcam) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=webcam)
   */
  var webcam: WebCam
  var prompt: Prompt
  /**
   * Retrieves available media devices.
   * #### getMediaDevices example
   * ```ts
   * let devices = await getMediaDevices()
   * ```
   * [Examples](https://scriptkit.com?query=getMediaDevices) | [Docs](https://johnlindquist.github.io/kit-docs/#getMediaDevices) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getMediaDevices)
   */
  var getMediaDevices: GetMediaDevices
  /**
   * Retrieves typed text from the user.
   * #### getTypedText example
   * ```ts
   * let text = await getTypedText()
   * ```
   * [Examples](https://scriptkit.com?query=getTypedText) | [Docs](https://johnlindquist.github.io/kit-docs/#getTypedText) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getTypedText)
   */
  var getTypedText: GetTypedText
  var PROMPT: typeof PROMPT_OBJECT
  /**
   * A symbol used to block submitting a prompt
   * #### preventSubmit example
   * ```ts
   * await arg({
   *   placeholder: "Try to submit text less than 10 characters",
   *   onSubmit: async (input) => {
   *     if (input.length < 10) {
   *       setHint(
   *         "Text must be at least 10 characters. You entered " + input.length
   *       );
   *       setEnter("Try Again");
   *       return preventSubmit;
   *     }
   *   },
   * });
   * ```
   * [Examples](https://scriptkit.com?query=preventSubmit) | [Docs](https://johnlindquist.github.io/kit-docs/#preventSubmit) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=preventSubmit)
   */
  var preventSubmit: symbol

  type removeListener = () => void
  /**
   * Registers a global system onClick event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onClick: (callback: (event: UiohookMouseEvent) => void) => removeListener

  /**
   * Registers a global system onMousedown event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onMousedown: (callback: (event: UiohookMouseEvent) => void) => removeListener
  /**
   * Registers a global system onMouseup event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onMouseup: (callback: (event: UiohookMouseEvent) => void) => removeListener
  /**
   * Registers a global system onWheel event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onWheel: (callback: (event: UiohookWheelEvent) => void) => removeListener
  /**
   * Registers a global system onKeydown event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onKeydown: (callback: (event: UiohookKeyboardEvent) => void) => removeListener
  /**
   * Registers a global system onKeyup event listener.
   * @param callback - The callback to call when the event is fired.
   * @returns A function to disable the listener.
   */
  var onKeyup: (callback: (event: UiohookKeyboardEvent) => void) => removeListener

  var system: System
  var app: App

  var getTheme: () => Promise<KitTheme>

  /**
   * Send a system notification
   * > Note: osx notifications require permissions for "Terminal Notifier" in the system preferences. Due to the complicated nature of configuring notifications, please use a search engine to find the latest instructions for your osx version.
   * > In the Script Kit menu bar icon: "Permissions -> Request Notification Permissions" might help.
   * #### notify example
   * ```ts
   * await notify("Attention!")
   * ```
   * #### notify example body
   * ```ts
   * await notify({
   *   title: "Title text goes here",
   *   body: "Body text goes here",
   * });
   * ```
   * [Examples](https://scriptkit.com?query=notify) | [Docs](https://johnlindquist.github.io/kit-docs/#notify) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=notify)
   */
  var notify: Notify
}
