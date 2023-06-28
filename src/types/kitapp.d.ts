import { exec } from "@johnlindquist/globals"
import { editor } from "./editor.api"

import {
  Key as KeyboardEnum,
  Channel,
  Mode,
  statuses,
  PROMPT as PROMPT_OBJECT,
} from "../core/enum"
import { KeyEnum } from "../core/keyboard.js"
import { AppDb } from "../core/db.js"

import {
  AppState,
  ChannelHandler,
  Choice,
  Choices,
  FlagsOptions,
  PromptConfig,
  PromptData,
  ScoredChoice,
  Script,
  Shortcut,
} from "./core"
import {
  BrowserWindowConstructorOptions,
  Display,
  Rectangle,
} from "./electron"
import { Flags } from "./kit"
import { Trash } from "./packages"
import { marked } from "@johnlindquist/globals/types/marked"
import { ChildProcess } from "child_process"

export type Status = (typeof statuses)[number]

export interface AppMessage {
  channel: Channel
  pid: number
  newPid?: number
  state: AppState
  widgetId?: number
  promptId: string
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
  status: "waiting" | "sent" | "received" | "read"
  copiableDate?: boolean
  retracted: boolean
  className?: string
  renderHTML?: boolean
}

export type Message = string | Partial<IMessage>

export type Chat = {
  (config?: PromptConfig): Promise<Message[]>
} & {
  addMessage?: (message: Message) => void
  setMessage?: (index: number, message: Message) => void
  getMessages?: () => Promise<BaseMessage[]>
  setMessages?: (messages: Message[]) => Promise<void>
  pushToken?: (token: string) => Promise<void>
}

export type Toast = {
  (toast: string, options?: any): void
}

export type Mic = {
  (config?: MicConfig): Promise<Buffer>
} & {
  stop?: () => Promise<void>
}

export type WebCam = {
  (config?: PromptConfig): Promise<string>
}

export type Speech = {
  (config?: PromptConfig): Promise<string>
}

export type GetMediaDevices = {
  (): Promise<MediaDeviceInfo[]>
}

export type GetTypedText = {
  (): Promise<string>
}

export type Find = {
  (config?: PromptConfig): Promise<string>
}

export type Editor = {
  (
    config?: EditorConfig & { hint?: string }
  ): Promise<string>
} & {
  setSuggestions?: (suggestions: string[]) => Promise<void>
  setConfig?: (config: EditorConfig) => Promise<void>
  append?: (text: string) => Promise<void>
  getSelection?: () => Promise<{
    text: string
    start: number
    end: number
  }>
  getCursorOffset?: () => Promise<number>
  moveCursor?: (offset: number) => Promise<void>
  insertText?: (text: string) => Promise<void>
  // setCodeHint?: (hint: string) => Promise<void>
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
    template?: string
    suggestions?: string[]
  }

export type EditorConfig =
  | string
  | (PromptConfig & EditorOptions)

export type MicConfig = PromptConfig & {
  timeSlice?: number
  format?: string
  stream?: boolean
  dot?: boolean
}

export interface TextareaConfig extends PromptConfig {
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
  (placeholderOrOptions?: string | TextareaConfig): Promise<
    string | void
  >
}

export interface Drop {
  (placeholder?: string | PromptConfig): Promise<any>
}
export interface Template {
  (template: string, config?: EditorConfig): Promise<string>
}
export interface OldForm {
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

export interface Form {
  (
    html: string | PromptConfig,
    formData?: any
  ): Promise<any>
}

type Field =
  | {
      label?: string
      placeholder?: string
      value?: string
      type?: string
      required?: boolean
      [key: string]: string | boolean
    }
  | string

export interface Fields {
  (
    fields: Field[] | (PromptConfig & { fields: Field[] })
  ): Promise<string[]>
}

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

export interface Emoji {
  (config?: PromptConfig): Promise<EmojiObject>
}

export interface DivConfig extends PromptConfig {
  html: string
  placeholder?: string
  hint?: string
  ignoreBlur?: boolean
  footer?: string
}

export interface Div {
  (
    html?: string | DivConfig,
    containerClass?: string
  ): Promise<any>
}

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
export interface Hotkey {
  (placeholder?: string | PromptConfig): Promise<KeyData>
}

export interface AppleScript {
  (script: string, options?: any): Promise<string>
}

type SetImage = string | { src: string }

interface AddChoice {
  (choice: string | Choice): Promise<void>
}

interface SetChoices {
  (
    choices: (Choice | string)[],
    className?: string,
    scripts?: boolean
  ): Promise<void>
}

interface SetFormData {
  (formData: any): Promise<void>
}

interface AppendChoices {
  (choices: Choice[]): Promise<void>
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

export interface KitStatus {
  status: Status
  message: string
}

export type Appearance = "light" | "dark"

type DisabledThottlingConfig = Pick<
  PromptConfig,
  | "headerClassName"
  | "footerClassName"
  | "ui"
  | "inputHeight"
  | "itemHeight"
  | "placeholder"
  | "scriptPath"
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
  | Channel.CLEAR_CLIPBOARD_HISTORY
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
  [Channel.CLEAR_CLIPBOARD_HISTORY]: undefined
  [Channel.CLEAR_PROMPT_CACHE]: undefined
  [Channel.CLEAR_PREVIEW]: undefined
  [Channel.CONSOLE_CLEAR]: undefined
  [Channel.KIT_CLEAR]: undefined
  [Channel.KIT_PASTE]: undefined
  [Channel.HIDE_APP]: undefined
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
  [Channel.SHEBANG]: {
    shebang: string
    filePath: string
  }
  [Channel.SELECT_FILE]: string
  [Channel.SELECT_FOLDER]: string
  [Channel.REVEAL_FILE]: string
  [Channel.PLAY_AUDIO]: AudioOptions
  [Channel.STOP_AUDIO]: undefined
  [Channel.SPEAK_TEXT]: any

  [Channel.REMOVE_CLIPBOARD_HISTORY_ITEM]: string
  [Channel.SEND_KEYSTROKE]: Partial<KeyData>
  [Channel.SET_CONFIG]: Partial<Config>
  [Channel.SET_DISABLE_SUBMIT]: boolean
  [Channel.SET_BOUNDS]: Partial<Rectangle>
  [Channel.SET_CHOICES]: Choice[]
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
  [Channel.SET_FLAGS]: FlagsOptions
  [Channel.SET_FLAG_VALUE]: any
  [Channel.SET_FORM_HTML]: { html: string; formData: any }
  [Channel.SET_FORM]: PromptConfig[]
  [Channel.SET_HINT]: string
  [Channel.SET_IGNORE_BLUR]: boolean
  [Channel.SET_KIT_STATE]: any
  [Channel.SET_INPUT]: string
  [Channel.APPEND_INPUT]: string
  [Channel.SCROLL_TO]: "top" | "bottom" | "center" | null
  [Channel.SET_FILTER_INPUT]: string
  [Channel.SET_FOCUSED]: string
  [Channel.SET_FOOTER]: string
  [Channel.SET_LOADING]: boolean
  [Channel.SET_RUNNING]: boolean
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
  [Channel.KEYBOARD_PRESS_KEY]: KeyboardEnum[]
  [Channel.KEYBOARD_RELEASE_KEY]: KeyboardEnum[]

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
  (input: string): Promise<void>
}

export interface ScrollTo {
  (location: "top" | "bottom" | "center"): Promise<void>
}

export interface SetTextareaValue {
  (value: string): void
}

export interface SetFocused {
  (id: string): void
}

export interface SetIgnoreBlur {
  (ignoreBlur: boolean): Promise<void>
}

export interface SetResize {
  (resize: boolean): void
}

export interface SetLoading {
  (loading: boolean): void
}

export interface SetStatus {
  (status: KitStatus): void
}

export interface KitTheme {
  "--color-primary-light": string
  "--color-secondary-light": string
  "--color-primary": string
  "--color-secondary-dark": string
  "--color-background-light": string
  "--color-background-dark": string
  "--opacity-themelight": string
  "--opacity-themedark": string
}
export interface SetTheme {
  (theme: Partial<KitTheme>): Promise<void>
}

export interface SetConfig {
  (config: Config): void
}

export interface SetPlaceholder {
  (placeholder: string): void
}

export interface SetEnter {
  (text: string): void
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
  (value: any): Promise<void>
}

export type ShowOptions =
  BrowserWindowConstructorOptions & {
    ttl?: number
    draggable?: boolean
    center?: boolean
  }

export interface ShowAppWindow {
  (content: string, options?: ShowOptions): Promise<void>
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
  type: (
    ...text: (string | KeyboardEnum)[]
  ) => Promise<void>
  pressKey: (...keys: KeyboardEnum[]) => Promise<void>
  releaseKey: (...keys: KeyboardEnum[]) => Promise<void>
  config: (config: { autoDelayMs: number }) => Promise<void>
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
export interface SetAppearance {
  (appearance: "light" | "dark" | "auto"): Promise<void>
}

export interface RegisterShortcut {
  (shortcut: string, callback: () => void): Promise<void>
}

export interface UnregisterShortcut {
  (shortcut: string): Promise<void>
}

export type GuideSection = {
  name: string
  raw: string
  comments: {
    [key: string]: string
  }
}
export interface Docs<T = any> {
  (
    markdownPath: string,
    options?:
      | Partial<PromptConfig>
      | ((
          sections?: GuideSection[],
          tokens?: marked.Token[]
        ) => Promise<Partial<PromptConfig>>)
  ): Promise<T>
}

export interface ExecLog {
  (
    command: string,
    logger?: typeof console.log
  ): ChildProcess
}

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
  setTextareaValue: SetTextareaValue

  setIgnoreBlur: SetIgnoreBlur
  setResize: SetResize
  setLoading: SetLoading
  setStatus: SetStatus
  setTheme: SetTheme
  setScriptTheme: SetTheme

  setConfig: SetConfig

  show: ShowAppWindow
  showImage: ShowAppWindow

  currentOnTab: any
  addChoice: AddChoice
  setChoices: SetChoices
  clearTabs: () => void
  getDataFromApp: (channel: Channel) => Promise<any>
  sendWait: (channel: Channel, value: any) => Promise<any>
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
  blur: () => Promise<void>

  dev: (object: any) => Promise<void>
  getClipboardHistory: () => Promise<ClipboardItem[]>
  getEditorHistory: GetEditorHistory
  removeClipboardItem: (id: string) => void
  setTab: (tabName: string) => void
  submit: Submit
  mainScript: (
    input?: string,
    tab?: string
  ) => Promise<void>

  appKeystroke: SendKeystroke
  Key: typeof KeyboardEnum

  log: typeof console.log
  warn: typeof console.warn

  keyboard: Keyboard
  clipboard: KitClipboard
  execLog: ExecLog

  focus: () => Promise<void>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>
  setAppearance: SetAppearance
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

declare global {
  var textarea: TextArea
  var drop: Drop
  var div: Div
  var form: Form
  var fields: Fields
  var emoji: Emoji
  var editor: Editor
  var template: Template

  var hotkey: Hotkey
  var send: Send
  var sendWait: (
    channel: Channel,
    value?: any
  ) => Promise<any>

  var setFocused: SetFocused
  var setEnter: SetEnter
  var setPlaceholder: SetPlaceholder
  var setPanel: SetPanel
  var setFooter: SetFooter
  var addChoice: AddChoice
  var appendChoices: AppendChoices
  var setChoices: SetChoices
  var setFormData: SetFormData
  var clearTabs: () => void
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
  var appendInput: SetInput
  var scrollTo: ScrollTo
  var setFilterInput: SetInput
  var setTextareaValue: SetTextareaValue
  var setIgnoreBlur: SetIgnoreBlur
  var setResize: SetResize
  var setPauseResize: SetResize
  var setLoading: SetLoading
  var setRunning: SetLoading
  var setStatus: SetStatus
  var setTheme: SetTheme
  var setScriptTheme: SetTheme

  var setConfig: SetConfig

  var show: ShowAppWindow
  var showImage: ShowAppWindow

  var hide: () => Promise<void>
  var blur: () => Promise<void>

  var dev: (object?: any) => Promise<void>
  var getClipboardHistory: () => Promise<ClipboardItem[]>
  var clearClipboardHistory: () => Promise<void>
  var getEditorHistory: GetEditorHistory
  var removeClipboardItem: (id: string) => Promise<void>
  var setTab: (tabName: string) => void
  var submit: Submit
  var mainScript: (
    input?: string,
    tab?: string
  ) => Promise<void>

  var appKeystroke: SendKeystroke
  var Key: typeof KeyboardEnum

  var log: typeof console.log
  var warn: typeof console.warn

  var keyboard: Keyboard
  var clipboard: KitClipboard

  var execLog: ExecLog

  var focus: () => Promise<void>
  var setAlwaysOnTop: (
    alwaysOnTop: boolean
  ) => Promise<void>

  var setAppearance: SetAppearance
  var docs: Docs
  var getAppState: any

  var registerShortcut: RegisterShortcut
  var unregisterShortcut: UnregisterShortcut
  var startDrag: (
    filePath: string,
    iconPath?: string
  ) => void
  var eyeDropper: () => Promise<{
    sRGBHex: string
  }>
  var chat: Chat
  var toast: Toast
  var find: Find
  var mic: Mic
  var micdot: Mic
  var webcam: WebCam
  var speech: Speech
  var getMediaDevices: GetMediaDevices
  var getTypedText: GetTypedText
  var PROMPT: typeof PROMPT_OBJECT
}
