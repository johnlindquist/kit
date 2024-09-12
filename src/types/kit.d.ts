import { Low } from "@johnlindquist/kit-internal/lowdb"
import type {
	format,
	formatDistanceToNow
} from "@johnlindquist/kit-internal/date-fns"
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods"
import type {
	Action,
	Choice,
	Choices,
	FlagsObject,
	ActionsConfig,
	Panel,
	Preview,
	PromptConfig,
	ScoredChoice,
	Script,
	Shortcut,
	Flags
} from "./core"
import { ChannelHandler } from "./core"
import type { ConfigOptions, Options } from "quick-score"

export interface Arg {
	[key: string]: any
	<T = string>(
		placeholderOrConfig?: string | PromptConfig,
		choicesOrPanel?: Choices<T> | Panel,
		actionsOrPreview?: Action[] | Preview
	): Promise<T>
}

export type Select = <T = any[]>(
	placeholderOrConfig: string | PromptConfig,
	choices: Choices<T>,
	actions?: Action[]
) => Promise<T>

export type Grid = <T = any[]>(
	placeholderOrConfig: string | PromptConfig,
	choices: Choices<T>,
	actions?: Action[]
) => Promise<T>

export interface EnvConfig extends PromptConfig {
	reset?: boolean
}
export interface Env {
	(
		envKey: string,
		promptConfig?: string | EnvConfig | (() => Promise<string>)
	): Promise<string>
	[key: string]: any
}

export interface Args extends Array<string> {}

export type UpdateArgs = (args: string[]) => void

export type PathFn = (...pathParts: string[]) => string

export type Inspect = (data: any, extension?: string) => Promise<void>

export type Store = (
	key: string,
	initialData?: any
) => Promise<InstanceType<typeof import("keyv").default>>

type DBExtensions<T> = {
	data: T extends string[] ? { items: T } : T
	dbPath: string
	clear: () => Promise<void>
	reset: () => Promise<void>
}

type DBItems<T> = T extends string[] ? { items: T } : {}

export type DBKeyOrPath<T> = string | T | (() => Promise<T>)
export type DBData<T> = T | (() => Promise<T>)
export type DBReturnType<T> = Low<T> & DBItems<T> & DBExtensions<T> & T

export type DB = <
	T = {
		[key: string]: any
	}
>(
	dataOrKeyOrPath?: DBKeyOrPath<T>,
	data?: DBData<T>,
	fromCache?: boolean
) => Promise<DBReturnType<T>>

export type OnTab = (
	name: string,
	fn: (input?: string) => void | Promise<void>
) => void

export interface Trace {
	enabled: boolean
	begin: (
		fields: Parameters<
			InstanceType<typeof import("chrome-trace-event").Tracer>["begin"]
		>[0]
	) => void
	end: (
		fields: Parameters<
			InstanceType<typeof import("chrome-trace-event").Tracer>["end"]
		>[0]
	) => void
	instant: (
		fields: Parameters<
			InstanceType<typeof import("chrome-trace-event").Tracer>["instantEvent"]
		>[0]
	) => void
	flush: () => void
}

export type OnExit = (fn: () => void) => void

export type KitModuleLoader = (
	packageName: string,
	...moduleArgs: string[]
) => Promise<any>
export type Edit = (
	file: string,
	dir?: string,
	line?: string | number,
	col?: string | number
) => Promise<void>

export type Browse = (
	url: string
) => ReturnType<typeof import("@johnlindquist/open")>

export type Wait = (time: number, submitValue?: any) => Promise<void>

export type IsCheck = (file: string) => Promise<boolean>

export type PathResolver = (dir: string) => (...pathParts: string[]) => string

export type GetScripts = (fromCache?: boolean) => Promise<Script[]>

export type FlagFn = (flags: FlagsObject, options?: ActionsConfig) => void
export type ActionsFn = (actions: Action[], options?: ActionsConfig) => void
export type PrepFlags = (flags: FlagsObject) => FlagsObject

export type SelectKitEditor = (reset: boolean) => Promise<string>

export interface SelectScript {
	(
		message?: string,
		fromCache?: boolean,
		xf?: (x: Script[]) => Script[]
	): Promise<Script>
	(
		message: PromptConfig,
		fromCache?: boolean,
		xf?: (x: Script[]) => Script[]
	): Promise<Script | string>
}

export interface Kenv {
	name: string
	dirPath: string
}
export type SelectKenv = (
	config?: PromptConfig,
	ignorePattern?: RegExp
) => Promise<Kenv>

export type Highlight = (
	markdown: string,
	containerClass?: string,
	injectStyles?: string
) => Promise<string>

interface PathConfig extends PromptConfig {
	startPath?: string
	onlyDirs?: boolean
	showHidden?: boolean
}

type PathPicker = (
	config?: string | PathConfig,
	actions?: Action[]
) => Promise<string>
export type PathSelector = typeof import("path") & PathPicker

type GistOptions = {
	fileName?: string
	description?: string
	isPublic?: boolean
}
export type CreateGist = (
	content: string,
	options?: GistOptions
) => Promise<RestEndpointMethodTypes["gists"]["create"]["response"]["data"]>

export type SetShortcuts = (shortcuts: Shortcut[]) => Promise<void>
export interface KitApi {
	path: PathSelector
	db: DB

	wait: Wait

	checkProcess: (processId: number) => string

	/**
	 * @example
	 * ```
	 * let pathToProject =  await home("projects", "my-code-project")
	 * // /Users/johnlindquist/projects/my-code-project
	 * ```
	 */
	home: PathFn
	isFile: IsCheck
	isDir: IsCheck
	isBin: IsCheck
	createPathResolver: PathResolver
	/**
	 * @example
	 * ```
	 * let value =  await arg()
	 * ```
	 */
	arg: Arg
	select: Select
	mini: Arg
	micro: Arg
	/**
	 * @example
	 * ```
	 * // Reads from .env or prompts if not set
	 * let SOME_ENV_VAR = await env("SOME_ENV_VAR")
	 * ```
	 */
	env: Env
	argOpts: string[]

	kitPath: PathFn
	kenvPath: PathFn
	/**
	 * Generate a path `~/.kenv/tmp/{command}/...parts`
	 *
	 * @example
	 * ```
	 * tmpPath("taco.txt") // ~/.kenv/tmp/command/taco.txt
	 * ```
	 */
	tmpPath: PathFn
	kenvTmpPath: PathFn

	inspect: Inspect

	onTab: OnTab
	onExit: OnExit

	attemptImport: KitModuleLoader
	npm: KitModuleLoader
	setup: KitModuleLoader

	edit: Edit
	browse: Browse

	args: Args
	updateArgs: UpdateArgs

	kitScript: string

	terminal: (script: string) => Promise<string>
	iterm: (iterm: string) => Promise<string>
	hyper: (hyper: string) => Promise<string>

	onTabs: {
		name: string
		fn: (input?: string) => void | Promise<any>
	}[]
	onTabIndex: number

	kitPrevChoices: Choices<any>

	getScripts: GetScripts

	memoryMap: Map<string, any>

	selectKitEditor: SelectKitEditor

	run: Run

	flag: Flags
	setFlags: FlagFn
	prepFlags: PrepFlags
	selectScript: SelectScript
	selectKenv: SelectKenv
	highlight: Highlight
	projectPath: PathFn
	createGist: CreateGist
	setShortcuts: SetShortcuts
	isWin: boolean
	isMac: boolean
	isLinux: boolean
	cmd: "cmd" | "ctrl"
	formatDate: typeof format
	formatDateToNow: typeof formatDistanceToNow
}

interface KeyValue {
	[key: string]: any
}

export type Run = (command?: string, ...args: string[]) => Promise<any>

type Utils = typeof import("../core/utils")

declare global {
	var path: PathSelector
	var edit: Edit
	var browse: Browse

	var kitPath: PathFn
	var kenvPath: PathFn
	var tmpPath: PathFn
	var kenvTmpPath: PathFn

	var attemptImport: KitModuleLoader
	/** @deprecated Use standard or dynamic imports instead. */
	var npm: KitModuleLoader
	var npmInstall: (packageName: string) => Promise<void>
	var installMissingPackage: (packageName: string) => Promise<void>
	var run: Run
	var setup: KitModuleLoader

	var env: Env
	var arg: Arg
	var select: Select
	var grid: Grid
	var basePrompt: Arg
	var mini: Arg
	var micro: Arg
	var onTab: OnTab
	var onExit: OnExit
	var args: Args

	var updateArgs: UpdateArgs
	var argOpts: string[]

	var wait: Wait

	var home: PathFn
	var isFile: IsCheck
	var isDir: IsCheck
	var isBin: IsCheck
	var createPathResolver: PathResolver

	var inspect: Inspect

	var db: DB
	var store: Store

	var memoryMap: Map<string, any>

	var onTabIndex: number

	var selectKitEditor: SelectKitEditor

	var getScripts: GetScripts
	var blur: () => Promise<void>
	var flag: Flags
	var actionFlag: string
	var setFlags: FlagFn
	var setActions: ActionsFn
	var openActions: () => Promise<void>
	var closeActions: () => Promise<void>
	var setFlagValue: (value: any) => Promise<void>
	var prepFlags: PrepFlags

	var selectScript: SelectScript
	var selectKenv: SelectKenv
	var highlight: Highlight

	var terminal: (script: string) => Promise<string>
	var iterm: (iterm: string) => Promise<string>
	var hyper: (hyper: string) => Promise<string>
	var projectPath: PathFn
	var clearAllTimeouts: () => void
	var clearAllIntervals: () => void
	var createGist: CreateGist
	var setShortcuts: SetShortcuts
	var isWin: boolean
	var isMac: boolean
	var isLinux: boolean
	var cmd: "cmd" | "ctrl"
	var formatDate: typeof format
	var formatDateToNow: typeof formatDistanceToNow

	var debounce: Utils["debounce"]
	var sortBy: Utils["sortBy"]
	var isUndefined: Utils["isUndefined"]
	var isString: Utils["isString"]

	var createChoiceSearch: (
		choices: Choice[],
		config: Partial<Options & ConfigOptions>
	) => Promise<(query: string) => ScoredChoice[]>

	var setScoredChoices: (scoredChoices: ScoredChoice[]) => Promise<void>

	var groupChoices: (
		choices: Choice[],
		options?: {
			groupKey?: string
			missingGroupName?: string
			order?: string[]
			sortChoicesKey?: (string | boolean)[]
			recentKey?: string
			recentLimit?: number
			excludeGroups?: string[]
		}
	) => Choice[]

	var formatChoices: (choices: Choice[], className?: string) => Choice[]

	var preload: (scriptPath?: string) => void

	var setSelectedChoices: (choices: Choice[]) => Promise<void>
	var toggleAllSelectedChoices: () => Promise<void>
	var trace: Trace

	type Metadata = import("./core").Metadata
	var metadata: Metadata
}
