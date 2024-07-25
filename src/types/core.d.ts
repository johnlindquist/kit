import { ChildProcess } from "child_process"
import { ProcessType, UI, Mode } from "../core/enum.js"
import { AppMessage, Field } from "./kitapp.js"

export interface Choice<Value = any> {
	name: string
	value?: Value
	description?: string
	focused?: string
	img?: string
	icon?: string
	html?: string
	hasPreview?: boolean
	preview?:
		| string
		| ((input: string, state: AppState) => string | Promise<string>)
	previewPath?: string
	previewLang?: string
	id?: string
	shortcode?: string
	trigger?: string
	keyword?: string
	className?: string
	nameClassName?: string
	tagClassName?: string
	focusedClassName?: string
	descriptionClassName?: string
	nameHTML?: string
	tag?: string
	shortcut?: string
	drag?:
		| {
				format?: string
				data?: string
		  }
		| string
	onFocus?: (input: string, state: AppState) => string | Promise<string>
	onSubmit?: (
		input: string,
		state: AppState
	) => void | Symbol | Promise<void | Symbol>
	enter?: string
	disableSubmit?: boolean
	info?: boolean
	exclude?: boolean
	height?: number
	skip?: boolean
	miss?: boolean
	pass?: boolean | string
	group?: string
	userGrouped?: boolean
	choices?: (Omit<Choice<any>, "choices"> | string)[]
	hideWithoutInput?: boolean
	ignoreFlags?: boolean
	selected?: boolean
	actions?: Action[]
	exact?: boolean
	recent?: boolean
}

export interface ScoredChoice {
	item: Choice<{ id: string; name: string; value: any }>
	score: number
	matches: {
		[key: string]: [number, number][]
	}
	_: string
}

export interface ScriptPathInfo {
	command: string
	filePath: string
	kenv: string
	id: string
	icon?: string
	timestamp?: number
	needsDebugger?: boolean
	compileStamp?: number
	compileMessage?: string
}

export interface ScriptMetadata {
	shebang?: string
	name?: string
	menu?: string
	description?: string
	shortcut?: string
	shortcode?: string
	trigger?: string
	friendlyShortcut?: string
	alias?: string
	author?: string
	twitter?: string
	github?: string
	social?: string
	social_url?: string
	exclude?: boolean
	schedule?: string
	system?: string
	watch?: string
	background?: boolean | "auto"
	type: ProcessType
	timeout?: number
	tabs?: string[]
	tag?: string
	log?: boolean
	hasFlags?: boolean
	cmd?: string
	option?: string
	ctrl?: string
	shift?: string
	hasPreview?: boolean
	logo?: string
	snippet?: string
	snippetdelay?: number
	index?: string
	template?: boolean
	["color-text"]?: string
	["color-primary"]?: string
	["color-secondary"]?: string
	["color-background"]?: string
	["opacity"]?: string
	preview?: Choice["preview"]
	previewPath?: string
	debug?: boolean
	cache?: boolean
	note?: string
	group?: string
	keyword?: string
	enter?: string
	recent?: boolean
	img?: string
	postfix?: string
}

export type Script = ScriptMetadata & ScriptPathInfo & Choice

export type Scriptlet = Script & {
	group: "Scriptlets"
	inputs: string[]
	tool: "kit" | "open" | "paste" | string
	scriptlet: string
	value: Script
}

export type Snippet = Script & {
	group: "Snippets"
	text: string
}

export type PromptBounds = {
	x?: number
	y?: number
	width?: number
	height?: number
}

// export type PromptState = "collapsed" | "expanded"

export type PromptDb = {
	screens: {
		[screenId: string]: {
			[script: string]: PromptBounds
		}
	}
}

export type InputType =
	| "button"
	| "checkbox"
	| "color"
	| "date"
	| "datetime-local"
	| "email"
	| "file"
	| "hidden"
	| "image"
	| "month"
	| "number"
	| "password"
	| "radio"
	| "range"
	| "reset"
	| "search"
	| "submit"
	| "tel"
	| "text"
	| "time"
	| "url"
	| "week"

export type Shortcut = {
	id?: string
	key: string
	name?: string
	value?: any
	onPress?: (input: string, state: AppState) => unknown | Promise<unknown>
	bar?: "right" | "left" | ""
	flag?: string
	visible?: boolean
	condition?: (choice: any) => boolean
}

export interface PromptData {
	id: string
	key: string
	scriptPath: string
	description: string
	flags: FlagsObject
	hasPreview: boolean
	keepPreview?: boolean
	hint: string
	input: string
	inputRegex: string
	kitArgs: string[]
	kitScript: string
	mode: Mode
	name: string
	placeholder: string
	preview: string
	previewWidthPercent: number
	panel: string
	secret: boolean
	selected: string
	strict: boolean
	tabs: string[]
	tabIndex: number
	type: InputType
	ui: UI
	resize: boolean
	placeholderOnly: boolean
	scripts: boolean
	shortcodes: { [key: string]: any }
	defaultChoiceId: string
	focusedId: string
	footer: string
	env: any
	shortcuts: Shortcut[]
	enter: string
	choicesType: "string" | "array" | "function" | "async" | "null"
	x: number
	y: number
	width: number
	height: number
	itemHeight: number
	inputHeight: number
	defaultValue: string
	focused: string
	formData?: any
	html?: string
	theme?: any
	alwaysOnTop?: boolean
	cwd?: string
	hasOnNoChoices?: boolean
	inputCommandChars?: string[]
	inputClassName?: string
	headerClassName?: string
	footerClassName?: string
	preload?: boolean
	css?: string
	preventCollapse?: boolean
	hideOnEscape?: boolean
	keyword?: string
	multiple?: boolean
	searchKeys?: string[]
	show?: boolean
	scriptlet?: boolean
	actionsConfig?: ActionsConfig
}

export type GenerateChoices = (
	input: string
) => Choice<any>[] | Promise<Choice<any>[]>

export type GenerateActions = (input: string) => Action[] | Promise<Action[]>

export type Choices<Value> = (
	| (string | Choice)[]
	| Choice<Value>[]
	| (() => Choice<Value>[])
	| (() => Promise<Choice<Value>[]>)
	| Promise<Choice<any>[]>
	| GenerateChoices
) & {
	preload?: boolean
}

export type Preview =
	| string
	| void
	| (() => string)
	| (() => void)
	| (() => Promise<string>)
	| (() => Promise<void>)
	| ((input: string) => string)
	| ((input: string) => void)
	| ((input: string) => Promise<any>)
	| ((input: string) => Promise<void>)

export type Actions =
	| Action[]
	| (() => Action[])
	| (() => Promise<Action[]>)
	| Promise<Action[]>
	| GenerateActions

export type Panel =
	| string
	| void
	| (() => string)
	| (() => void)
	| (() => Promise<string>)
	| (() => Promise<void>)
	| ((input: string) => string)
	| ((input: string) => void)
	| ((input: string) => Promise<any>)
	| ((input: string) => Promise<void>)

export type FlagsWithKeys = {
	[key: string]: {
		shortcut?: string
		name?: string
		group?: string
		description?: string
		bar?: "left" | "right" | ""
		flag?: string
		preview?: Choice["preview"]
		hasAction?: boolean
	}
} & {
	sortChoicesKey?: string[]
	order?: string[]
}
export type FlagsObject = FlagsWithKeys | boolean
export type ActionsConfig = {
	name?: string
	placeholder?: string
	active?: string
}

export type Action = {
	name: string
	description?: string
	value?: any
	shortcut?: string
	group?: string
	flag?: string
	visible?: boolean
	enter?: string
	onAction?: ChannelHandler
	condition?: Shortcut["condition"]
	close?: boolean
	index?: number
}

export interface AppState {
	input?: string
	actionsInput?: string
	inputChanged?: boolean
	flaggedValue?: any
	flag?: string
	tab?: string
	tabIndex?: number
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
	cursor?: number
	preview?: string
	keyword?: string
	mode?: Mode
	ui?: UI
	multiple?: boolean
	selected?: any[]
	action?: Action
}

export interface ChannelHandler {
	(input?: string, state?: AppState): void | Promise<void>
}

export interface SubmitHandler {
	(input?: string, state?: AppState): void | Symbol | Promise<void | Symbol>
}

export type PromptConfig = {
	validate?: (input: string) => boolean | string | Promise<boolean | string>
	choices?: Choices<any> | Panel
	actions?: Action[] | Panel
	initialChoices?: Choices<any> | Panel
	html?: string
	formData?: any
	className?: string
	flags?: FlagsObject
	actions?: Action[]
	preview?:
		| string
		| ((
				input: string,
				state: AppState
		  ) => string | Promise<string> | void | Promise<void>)
	panel?: string | (() => string | Promise<string>)
	onNoChoices?: ChannelHandler
	onEscape?: ChannelHandler
	onAbandon?: ChannelHandler
	onBack?: ChannelHandler
	onForward?: ChannelHandler
	onUp?: ChannelHandler
	onDown?: ChannelHandler
	onLeft?: ChannelHandler
	onRight?: ChannelHandler
	onTab?: ChannelHandler
	onKeyword?: ChannelHandler
	onInput?: ChannelHandler
	onActionsInput?: ChannelHandler
	onChange?: ChannelHandler
	onBlur?: ChannelHandler
	onSelected?: ChannelHandler
	onChoiceFocus?: ChannelHandler
	onMessageFocus?: ChannelHandler
	onPaste?: ChannelHandler
	onDrop?: ChannelHandler
	onDragEnter?: ChannelHandler
	onDragLeave?: ChannelHandler
	onDragOver?: ChannelHandler
	onMenuToggle?: ChannelHandler
	onInit?: ChannelHandler
	onSubmit?: SubmitHandler
	onValidationFailed?: ChannelHandler
	onAudioData?: ChannelHandler
	debounceInput?: number
	debounceChoiceFocus?: number
	keyword?: string
	shortcodes?: {
		[key: string]: any
	}
	env?: any
	shortcuts?: Shortcut[]
	show?: boolean
} & Partial<Omit<PromptData, "choices" | "id" | "script" | "preview">>

export type CronExpression =
	| `${string} ${string} ${string} ${string} ${string}`
	| `${string} ${string} ${string} ${string} ${string} ${string}`

export interface Metadata {
	/**
	 * Specifies the name of the script as it appears in the Script Kit interface.
	 * If not provided, the file name will be used.
	 */
	name?: string
	/** Provides a brief description of the script's functionality. */
	description?: string
	/** The string displayed in the Enter button */
	enter?: string
	/** Defines an alternative search term to find this script */
	alias?: string
	/** Defines the path to an image to be used for the script */
	image?: string
	/** Defines a global keyboard shortcut to trigger the script. */
	shortcut?: string
	/**
	 * Similar to {@link trigger}, defines a string that, when typed in the main menu
	 * followed by a space, immediately executes the script.
	 */
	shortcode?: string
	/**
	 * Similar to {@link shortcode}, defines a string that, when typed in the main menu,
	 * immediately executes the script.
	 */
	trigger?: string
	/** @deprecated Use `expand` instead. Designates the script as a text expansion snippet and specifies the trigger text. */
	snippet?: string
	/** Designates the script as a text expansion snippet and specifies the trigger text. */
	expand?: string
	/** Associates a keyword with the script for easier discovery in the main menu. */
	keyword?: string
	/** Indicates that user input in the main menu should be passed as an argument to the script. */
	pass?: boolean
	/** Assigns the script to a specific group for organization in the main menu. */
	group?: string
	/** Excludes the script from appearing in the main menu. */
	exclude?: boolean
	/** Specifies a file or directory to watch for changes, triggering the script upon modifications. */
	watch?: string
	/** Indicates whether to disable logs */
	log?: boolean
	/** Designates the script as a background process, running continuously in the background. */
	background?: boolean | "auto"
	/** Defines the number of seconds after which the script will be terminated */
	timeout?: number
	/** Associates the script with system events such as sleep, wake, or shutdown. */
	system?:
		| "suspend"
		| "resume"
		| "on-ac"
		| "on-battery"
		| "shutdown"
		| "lock-screen"
		| "unlock-screen"
		| "user-did-become-active"
		| "user-did-resign-active"

	/** Specifies a cron expression for scheduling the script to run at specific times or intervals. */
	schedule?: CronExpression
}

export interface ProcessInfo {
	pid: number
	scriptPath: string
	child: ChildProcess
	type: ProcessType
	values: any[]
	date: number
}
