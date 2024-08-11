import { exec } from "@johnlindquist/globals"
import type { editor } from "./editor.api"

import type core from "./core/enum"
import {
	type Key,
	Channel,
	Mode,
	type statuses,
	type PROMPT as PROMPT_OBJECT
} from "../core/enum"
import type { KeyEnum } from "../core/keyboard.js"
import type { AppDb } from "../core/db.js"

import {
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
} from "./core"
import type {
	BrowserWindowConstructorOptions,
	Display,
	Rectangle
} from "./electron"
import { Flags } from "./kit"
import type { Trash } from "./packages"
import type { marked } from "@johnlindquist/globals/types/marked"
import type { ChildProcess } from "node:child_process"
import type {
	UiohookKeyboardEvent,
	UiohookMouseEvent,
	UiohookWheelEvent
} from "./io"
import type { FileSearchOptions } from "./platform"
import { ReadStream, WriteStream } from "node:fs"
import type { NotificationConstructorOptions } from "./notify/notify"

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
	status: "waiting" | "sent" | "received" | "read"
	copiableDate?: boolean
	retracted: boolean
	className?: string
	renderHTML?: boolean
}

export type Message = string | Partial<IMessage>

export type Notify = (options: NotificationConstructorOptions) => Promise<void>

export type Chat = ((
	config?: PromptConfig,
	actions?: Action[]
) => Promise<Message[]>) & {
	addMessage?: (message: Message) => void
	setMessage?: (index: number, message: Message) => void
	getMessages?: () => Promise<BaseMessage[]>
	setMessages?: (messages: Message[]) => Promise<void>
	pushToken?: (token: string) => Promise<void>
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
	draggable?: boolean | "mouse" | "touch"
	/**
	 * The percentage of the toast's width it takes for a drag to dismiss a toast
	 * `Default: 80`
	 */
	draggablePercent?: number
}
export type Toast = (toast: string, options?: ToastOptions) => void

export type Prompt = {
	closeActions(): Promise<void>
	close(): Promise<void>
	openActions(): Promise<void>
	setInput(input: string): Promise<void>
	focus(): Promise<void>
	blur(): Promise<void>
	hide(): Promise<void>
}

export type Mic = ((config?: MicConfig) => Promise<Buffer>) & {
	stop?: () => Promise<Buffer>
	start?: (config?: MicConfig) => Promise<string>
	stream?: Readable
}

export type WebCam = (config?: PromptConfig) => Promise<string>

export type Speech = (config?: PromptConfig) => Promise<string>

export type Screenshot = (
	displayId?: number,
	bounds?: ScreenShotBounds
) => Promise<Buffer>

export type GetMediaDevices = () => Promise<MediaDeviceInfo[]>

export type GetTypedText = () => Promise<string>

export type Find = (
	placeholderOrConfig?: string | PromptConfig,
	options?: FileSearchOptions
) => Promise<string>

export type Editor = ((
	config?: EditorConfig & { hint?: string },
	actions?: Action[]
) => Promise<string>) & {
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

export type EditorOptions = editor.IStandaloneEditorConstructionOptions & {
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
	extraLibs?: { content: string; filePath: string }[]
	template?: string
	suggestions?: string[]
}

export type EditorConfig = string | (PromptConfig & EditorOptions)

export type MicConfig = PromptConfig & {
	filePath?: string
	timeSlice?: number
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

export type TextArea = (
	placeholderOrOptions?: string | TextareaConfig
) => Promise<string | void>

export type Drop = (
	placeholder?: string | PromptConfig,
	actions?: Action[]
) => Promise<any>
export type Template = (
	template: string,
	config?: EditorConfig,
	actions?: Action[]
) => Promise<string>
export type OldForm = (
	html?:
		| string
		| {
				html?: string
				hint?: string
		  },
	formData?: any
) => Promise<any>

export type Form = (
	html: string | PromptConfig,
	formData?: any,
	actions?: Action[]
) => Promise<any>

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

export type Fields = (
	fields: Field[] | (PromptConfig & { fields: Field[] }),
	actions?: Action[]
) => Promise<string[]>

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
}

export type Div = (
	html?: string | DivConfig,
	containerClass?: string
) => Promise<any>

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
	[Channel.SHEBANG]: {
		shebang: string
		filePath: string
	}
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
	[Channel.SCROLL_TO]: "top" | "bottom" | "center" | null
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
	[Channel.KEYBOARD_PRESS_KEY]: Key[]
	[Channel.KEYBOARD_RELEASE_KEY]: Key[]

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
	[Channel.SCREENSHOT]: {
		displayId?: Screenshot["displayId"]
		bounds?: Screenshot["bounds"]
	}
	[Channel.SYSTEM_CLICK]: boolean
	[Channel.SYSTEM_MOVE]: boolean
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

export type SetHint = (hint: string) => void

export type SetName = (name: string) => void

export type SetDescription = (description: string) => void

export type SetInput = (input: string) => Promise<void>

export type ScrollTo = (location: "top" | "bottom" | "center") => Promise<void>

export type SetTextareaValue = (value: string) => void

export type SetFocused = (id: string) => void

export type SetResize = (resize: boolean) => void

export type SetLoading = (loading: boolean) => void

export type SetProgress = (progress: number) => void
export type ShowDeprecated = (message: string) => Promise<void>

export type SetStatus = (status: KitStatus) => void

export interface KitTheme {
	"--color-primary-light": string
	"--color-secondary-light": string
	"--color-primary": string
	"--color-secondary-dark": string
	"--color-background-light": string
	"--color-background-dark": string
	"--opacity-themelight": string
	"--opacity-themedark": string
	name: string
	foreground: string
	background: string
	accent: string
	ui: string
	opacity: string
}

export type SetTheme = (theme: string) => Promise<void>

export type SetPlaceholder = (placeholder: string) => void

export type SetEnter = (text: string) => void

export type SetPanel = (html: string, containerClasses?: string) => void

export type SetFooter = (footer: string) => void

export type SetPrompt = (config: Partial<PromptData>) => void
export type SetPreview = (html: string, containerClasses?: string) => void
export type SetBounds = (bounds: Partial<Rectangle>) => void

export type SendKeystroke = (keyData: Partial<KeyData>) => void

export type GetBounds = () => Promise<Rectangle>

export type GetActiveScreen = () => Promise<Display>

export type GetEditorHistory = () => Promise<
	{
		content: string
		timestamp: string
	}[]
>

export interface Submit {
	(value: any): Promise<void>
}

export type ShowOptions = BrowserWindowConstructorOptions & {
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
	pressKey: (...keys: Key[]) => Promise<void>
	/**
	 * Releases a key.
	 * @param keys The keys to release.
	 */
	releaseKey: (...keys: Key[]) => Promise<void>
	/**
	 * Taps a key.
	 * @param keys The keys to tap.
	 */
	tap: (...keys: Key[]) => Promise<void>
	/**
	 * @deprecated Use `keyboard.typeDelayed` or set `KIT_TYPING_RATE` and use `keyboard.type` instead.
	 */
	config: (config: { autoDelayMs: number }) => Promise<void>
}

export interface Mouse {
	leftClick: () => Promise<void>
	rightClick: () => Promise<void>
	move: (points: [{ x: number; y: number }]) => Promise<void>
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

export type RegisterShortcut = (
	shortcut: string,
	callback: () => void
) => Promise<void>

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
		| ((
				sections?: GuideSection[],
				tokens?: marked.Token[]
		  ) => Promise<Partial<PromptConfig>>)
) => Promise<T>

export type ExecLog = (
	command: string,
	logger?: typeof console.log
) => ChildProcess

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
	Key: typeof core.Key

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
		value?: any,
		timeout?: number
	) => Promise<any>
	var sendWaitLong: (
		channel: Channel,
		value?: any,
		timeout?: number
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
	var setProgress: SetProgress
	var setRunning: SetLoading
	var setStatus: SetStatus
	var setTheme: SetTheme
	var setScriptTheme: SetTheme

	var showImage: ShowAppWindow

	var show: () => Promise<void>
	var hide: (hideOptions?: HideOptions) => Promise<void>
	var blur: () => Promise<void>

	var dev: (object?: any) => Promise<void>
	var getClipboardHistory: () => Promise<ClipboardItem[]>
	var clearClipboardHistory: () => Promise<void>
	var getEditorHistory: GetEditorHistory
	var removeClipboardItem: (id: string) => Promise<void>
	var setTab: (tabName: string) => void
	var submit: Submit
	var mainScript: (input?: string, tab?: string) => Promise<void>

	var appKeystroke: SendKeystroke
	var Key: typeof core.Key

	var log: typeof console.log
	var warn: typeof console.warn

	var keyboard: Keyboard
	var mouse: Mouse
	var clipboard: KitClipboard

	var execLog: ExecLog

	var focus: () => Promise<void>
	var setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>

	var docs: Docs
	var getAppState: any

	var registerShortcut: RegisterShortcut
	var unregisterShortcut: UnregisterShortcut
	var startDrag: (filePath: string, iconPath?: string) => void
	var eyeDropper: () => Promise<{
		sRGBHex: string
	}>
	var chat: Chat
	var toast: Toast
	var find: Find
	var mic: Mic
	/**
	 * Captures a screenshot. Defaults to the display where the current mouse cursor is located and captures the full screen if no bounds are specified.
	 * @param displayId - The identifier for the display to capture. If not provided, captures the display with the current mouse cursor.
	 * @param bounds - The specific area of the screen to capture. If not provided, captures the entire screen.
	 * @returns A Promise that resolves to a Buffer containing the screenshot data.
	 */
	var screenshot: Screenshot
	var webcam: WebCam
	var prompt: Prompt
	var getMediaDevices: GetMediaDevices
	var getTypedText: GetTypedText
	var PROMPT: typeof PROMPT_OBJECT
	var preventSubmit: Symbol

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
	var onMousedown: (
		callback: (event: UiohookMouseEvent) => void
	) => removeListener
	/**
	 * Registers a global system onMouseup event listener.
	 * @param callback - The callback to call when the event is fired.
	 * @returns A function to disable the listener.
	 */
	var onMouseup: (
		callback: (event: UiohookMouseEvent) => void
	) => removeListener
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
	var onKeydown: (
		callback: (event: UiohookKeyboardEvent) => void
	) => removeListener
	/**
	 * Registers a global system onKeyup event listener.
	 * @param callback - The callback to call when the event is fired.
	 * @returns A function to disable the listener.
	 */
	var onKeyup: (
		callback: (event: UiohookKeyboardEvent) => void
	) => removeListener

	var system: System
	var app: App

	var getTheme: () => Promise<KitTheme>

	var notify: Notify
}
