import type { ProcessInfo } from "./core"
import type { Display, Point } from "./electron"
import type {
	BrowserContextOptions,
	Page,
	PageScreenshotOptions
} from "playwright"

type PlayAudioFile = (path: string, options?: any) => Promise<string>

type StopAudioFile = () => Promise<void>

type CopyPathAsImage = (path: string) => Promise<string>

interface FileSearchOptions {
	onlyin?: string
	kind?: string
	kMDItemContentType?: string
}
type FileSearch = (
	name: string,
	fileSearchOptions?: FileSearchOptions
) => Promise<string[]>

type Browser = "Google Chrome" | "Brave" | "Firefox" | "Edge"

type GetActiveTab = (browser?: Browser) => Promise<string>
type GetTabs = (browser?: Browser) => Promise<{ url: string; title: string }[]>

type FocusTab = (url: string, browser?: Browser) => Promise<string>

interface ScrapeOptions {
	headless?: boolean
	timeout?: number
	/**
	 * Playwright browser context options.
	 *
	 * {@link https://playwright.dev/docs/api/class-browser#browser-new-context}
	 */
	browserOptions?: BrowserContextOptions
}

type ScrapeSelector<T = any> = (
	url: string,
	selector: string,
	/**
	 * Transformation to apply to each DOM node that was selected.
	 * By default, `element.innerText` is returned.
	 */
	transform?: (element: any) => T,
	options?: ScrapeOptions
) => Promise<T[]>

type ScrapeAttribute = (
	url: string,
	selector: string,
	attribute: string,
	options?: ScrapeOptions
) => Promise<string | null>
interface ScreenshotFromWebpageOptions {
	timeout?: number
	/**
	 * Playwright browser context options.
	 *
	 * {@link https://playwright.dev/docs/api/class-browser#browser-new-context}
	 */
	browserOptions?: BrowserContextOptions
	/**
	 * Playwright page screenshot options.
	 *
	 * {@link https://playwright.dev/docs/api/class-page#page-screenshot}
	 */
	screenshotOptions?: PageScreenshotOptions
}

type GetScreenshotFromWebpage = (
	url: string,
	options?: ScreenshotFromWebpageOptions
) => Promise<Buffer>

interface WebpageAsPdfOptions {
	timeout?: number
	/**
	 * Playwright browser context options.
	 *
	 * {@link https://playwright.dev/docs/api/class-browser#browser-new-context}
	 */
	browserOptions?: BrowserContextOptions
	/**
	 * Playwright page pdf options.
	 *
	 * {@link https://playwright.dev/docs/api/class-page#page-pdf}
	 */
	pdfOptions?: Parameters<Page["pdf"]>[0]
	/**
	 * Playwright page emulate media options.
	 *
	 * {@link https://playwright.dev/docs/api/class-page#page-emulate-media}
	 */
	mediaOptions?: Parameters<Page["emulateMedia"]>[0]
}

type GetWebpageAsPdf = (
	url: string,
	options?: WebpageAsPdfOptions
) => Promise<Buffer>

interface Window {
	process: string
	title: string
	index: number
}
type GetWindows = () => Promise<Window[]>

type FocusWindow = (process: string, title: string) => Promise<string>

interface WindowBounds {
	process: string
	name: string
	position: { x: number; y: number }
	size: { width: number; height: number }
	fullscreen: boolean
}
type GetWindowsBounds = () => Promise<WindowBounds[]>
type GetWindowPosition = (
	process: string,
	title: string,
	x: number,
	y: number
) => Promise<string>

type SetWindowPosition = (
	process: string,
	title: string,
	x: number,
	y: number
) => Promise<string>
type SetWindowSizeByIndex = (
	process: string,
	index: number,
	x: number,
	y: number
) => Promise<string>
type SetWindowBoundsByIndex = (
	process: string,
	index: number,
	x: number,
	y: number,
	width: number,
	height: number
) => Promise<string>

type ScatterWindows = () => Promise<string>

type OrganizeWindows = () => Promise<void>

type SetWindowPositionByIndex = (
	process: string,
	index: number,
	x: number,
	y: number
) => Promise<string>

type SetWindowSize = (
	process: string,
	title: string,
	x: number,
	y: number
) => Promise<string>

interface Screen {
	name: string
	x: number
	y: number
	width: number
	height: number
}
type GetScreens = () => Promise<Display[]>
type SelectDisplay = (includeThumbnails?: boolean) => Promise<Display>

type TileWindow = (
	app: string,
	leftOrRight: "left" | "right"
) => Promise<string>

type GetActiveScreen = () => Promise<Display>

type GetMousePosition = () => Promise<Point>

type GetProcesses = () => Promise<ProcessInfo[]>

interface Rectangle {
	x: number
	y: number
	width: number
	height: number
}

export interface Prompt {
	id: string
	pid: number
	birthTime: number
	isFocused: boolean
	isVisible: boolean
	isDestroyed: boolean
	bounds: Rectangle
	focus: () => Promise<void>
}

type GetPrompts = () => Promise<Prompt[]>
interface KitWindow {
	name: string
	id: string
	value: string
	bounds: Rectangle
	isFocused: boolean
	isVisible: boolean
	isDestroyed: boolean
}

type GetKitWindows = () => Promise<KitWindow[]>

type FocusAppWindow = (id: string) => Promise<void>

interface Bounds {
	left: number
	top: number
	right: number
	bottom: number
}
type SetActiveAppBounds = (bounds: Bounds) => Promise<void>
type SetActiveAppPosition = (position: {
	x: number
	y: number
}) => Promise<void>
type SetActiveAppSize = (size: {
	width: number
	height: number
}) => Promise<void>

type GetActiveAppInfo = () => Promise<{
	localizedName: string
	bundleIdentifier: string
	bundleURLPath: string
	executableURLPath: string
	isFinishedLaunching: boolean
	processIdentifier: number
	windowTitle: string
	windowIndex: number
	windowID: number
	x: number
	y: number
	width: number
	height: number
}>
type GetActiveAppBounds = () => Promise<Bounds>

type GetSelectedFile = () => Promise<string>

type SetSelectedFile = (filePath: string) => Promise<void>

type GetSelectedDir = () => Promise<string>
type SelectFile = (message?: string) => Promise<string>

type RevealFile = (filePath: string) => Promise<string>
type RevealInFinder = (filePath?: string) => Promise<void>
type SelectFolder = (message?: string) => Promise<string>

type GetSelectedText = () => Promise<string>

type CutText = () => Promise<string>

type Lock = () => Promise<unknown>

type Logout = () => Promise<unknown>
type Sleep = () => Promise<unknown>
type Shutdown = () => Promise<unknown>

type QuitAllApps = (appsToExclude?: string) => Promise<unknown>

type Say = (text: string, options?: any) => Promise<string>

type Beep = () => Promise<void>

type SetSelectedText = (text: string, hide?: boolean) => Promise<void>

type KeyStroke = (keyString: string) => Promise<string>

type AppleScript = (script: string, options?: any) => Promise<string>

export interface PlatformApi {
	applescript: AppleScript
	copyPathAsImage: CopyPathAsImage
	fileSearch: FileSearch
	focusTab: FocusTab
	focusWindow: FocusWindow
	getActiveTab: GetActiveTab
	getActiveScreen: GetActiveScreen
	getActiveAppInfo: GetActiveAppInfo
	getActiveAppBounds: GetActiveAppBounds
	getMousePosition: GetMousePosition
	getScreens: GetScreens
	selectDisplay: SelectDisplay
	getSelectedFile: GetSelectedFile
	setSelectedFile: SetSelectedFile
	getSelectedDir: GetSelectedDir
	revealInFinder: RevealInFinder
	selectFile: SelectFile
	selectFolder: SelectFolder
	revealFile: RevealFile
	getSelectedText: GetSelectedText
	cutText: CutText
	getTabs: GetTabs
	getWindows: GetWindows
	getWindowsBounds: GetWindowsBounds
	keystroke: KeyStroke
	lock: Lock
	openLog: () => void
	organizeWindows: OrganizeWindows
	playAudioFile: PlayAudioFile
	stopAudioFile: StopAudioFile
	quitAllApps: QuitAllApps
	say: Say
	beep: Beep
	scatterWindows: ScatterWindows
	scrapeAttribute: ScrapeAttribute
	scrapeSelector: ScrapeSelector
	getScreenshotFromWebpage: GetScreenshotFromWebpage
	getWebpageAsPdf: GetWebpageAsPdf
	setActiveAppBounds: SetActiveAppBounds
	setActiveAppPosition: SetActiveAppPosition
	setActiveAppSize: SetActiveAppSize
	setSelectedText: SetSelectedText
	setWindowBoundsByIndex: SetWindowBoundsByIndex
	setWindowPosition: SetWindowPosition
	setWindowPositionByIndex: SetWindowPositionByIndex
	setWindowSize: SetWindowSize
	setWindowSizeByIndex: SetWindowSizeByIndex
	shutdown: Shutdown
	sleep: Sleep
	tileWindow: TileWindow
}

declare global {
	var applescript: AppleScript
	var beep: Beep
	var copyPathAsImage: CopyPathAsImage
	var fileSearch: FileSearch
	var focusTab: FocusTab
	var focusWindow: FocusWindow
	var getActiveAppInfo: GetActiveAppInfo
	var getActiveAppBounds: GetActiveAppBounds
	var getActiveScreen: GetActiveScreen
	var getActiveTab: GetActiveTab
	var getMousePosition: GetMousePosition
	var getProcesses: GetProcesses
	var getPrompts: GetPrompts
	var getKitWindows: GetKitWindows
	var focusKitWindow: FocusAppWindow
	var getScreens: GetScreens
	var selectDisplay: SelectDisplay
	var getSelectedFile: GetSelectedFile
	var revealInFinder: RevealInFinder
	var selectFile: SelectFile
	var selectFolder: SelectFolder
	var revealFile: RevealFile
	var getSelectedText: GetSelectedText
	var cutText: CutText
	var getTabs: GetTabs
	var getWindows: GetWindows
	var getWindowsBounds: GetWindowsBounds
	var getSelectedDir: GetSelectedDir
	var keystroke: KeyStroke
	var logout: Logout
	var lock: Lock
	var openLog: () => void
	var organizeWindows: OrganizeWindows
	var playAudioFile: PlayAudioFile
	var stopAudioFile: StopAudioFile
	var quitAllApps: QuitAllApps
	var say: Say
	var scatterWindows: ScatterWindows
	var scrapeAttribute: ScrapeAttribute
	var scrapeSelector: ScrapeSelector
	var getScreenshotFromWebpage: GetScreenshotFromWebpage
	var getWebpageAsPdf: GetWebpageAsPdf
	var setActiveAppBounds: SetActiveAppBounds
	var setActiveAppPosition: SetActiveAppPosition
	var setActiveAppSize: SetActiveAppSize
	var setSelectedText: SetSelectedText
	var setSelectedFile: SetSelectedFile
	var setWindowBoundsByIndex: SetWindowBoundsByIndex
	var setWindowPosition: SetWindowPosition
	var setWindowPositionByIndex: SetWindowPositionByIndex
	var setWindowSize: SetWindowSize
	var setWindowSizeByIndex: SetWindowSizeByIndex
	var shutdown: Shutdown
	var sleep: Sleep
	var tileWindow: TileWindow
}
