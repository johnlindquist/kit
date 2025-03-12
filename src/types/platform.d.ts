import type { ProcessInfo } from './core.js'
import type { Display, Point } from './electron.js'
import type { BrowserContextOptions, Page, PageScreenshotOptions } from 'playwright'

type PlayAudioFile = (path: string, options?: any) => Promise<string>

type StopAudioFile = () => Promise<void>

type CopyPathAsImage = (path: string) => Promise<string>

interface FileSearchOptions {
  onlyin?: string
  kind?: string
  kMDItemContentType?: string
}
type FileSearch = (name: string, fileSearchOptions?: FileSearchOptions) => Promise<string[]>

type Browser = 'Google Chrome' | 'Brave' | 'Firefox' | 'Edge'

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

type GetScreenshotFromWebpage = (url: string, options?: ScreenshotFromWebpageOptions) => Promise<Buffer>

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
  pdfOptions?: Parameters<Page['pdf']>[0]
  /**
   * Playwright page emulate media options.
   *
   * {@link https://playwright.dev/docs/api/class-page#page-emulate-media}
   */
  mediaOptions?: Parameters<Page['emulateMedia']>[0]
}

type GetWebpageAsPdf = (url: string, options?: WebpageAsPdfOptions) => Promise<Buffer>

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
type GetWindowPosition = (process: string, title: string, x: number, y: number) => Promise<string>

type SetWindowPosition = (process: string, title: string, x: number, y: number) => Promise<string>
type SetWindowSizeByIndex = (process: string, index: number, x: number, y: number) => Promise<string>
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

type SetWindowPositionByIndex = (process: string, index: number, x: number, y: number) => Promise<string>

type SetWindowSize = (process: string, title: string, x: number, y: number) => Promise<string>

interface Screen {
  name: string
  x: number
  y: number
  width: number
  height: number
}
type GetScreens = () => Promise<Display[]>
type SelectDisplay = (includeThumbnails?: boolean) => Promise<Display>

type TileWindow = (app: string, leftOrRight: 'left' | 'right') => Promise<string>

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
  exit: () => Promise<void>
  hide: () => Promise<void>
  scriptPath: string
  name: string
}

type GetPrompts = () => Promise<Prompt[]>
type AttemptScriptFocus = () => Promise<boolean>
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
  /**
   * Executes an applescript string
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### applescript example
   * ```ts
   * let result = await applescript(`
   * tell application "Finder"
   *   return name of every disk
   * end tell
   * `)
   * ```
   * [Examples](https://scriptkit.com?query=applescript) | [Docs](https://johnlindquist.github.io/kit-docs/#applescript) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=applescript)
   */
  var applescript: AppleScript
  /**
   * Beep the system speaker:
   * #### beep example
   * ```ts
   * await beep()
   * ```
   * [Examples](https://scriptkit.com?query=beep) | [Docs](https://johnlindquist.github.io/kit-docs/#beep) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=beep)
   */
  var beep: Beep
  /**
   * Copies a file path as an image to the clipboard.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### copyPathAsImage example
   * ```ts
   * await copyPathAsImage("/path/to/file.txt")
   * ```
   * [Examples](https://scriptkit.com?query=copyPathAsImage) | [Docs](https://johnlindquist.github.io/kit-docs/#copyPathAsImage) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=copyPathAsImage)
   */
  var copyPathAsImage: CopyPathAsImage
  /**
   * Searches for files on the filesystem.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### fileSearch example
   * ```ts
   * async function fileSearch(query: string, options?: {
   *   onlyin?: string,
   *   ...
   * }): Promise<string[]>
   * ```
   * [Examples](https://scriptkit.com?query=fileSearch) | [Docs](https://johnlindquist.github.io/kit-docs/#fileSearch) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=fileSearch)
   */
  var fileSearch: FileSearch
  var focusTab: FocusTab
  /**
   * Brings a specific window into focus.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### focusWindow example
   * ```ts
   * await focusWindow(12345)
   * ```
   * [Examples](https://scriptkit.com?query=focusWindow) | [Docs](https://johnlindquist.github.io/kit-docs/#focusWindow) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=focusWindow)
   */
  var focusWindow: FocusWindow
  var getActiveAppInfo: GetActiveAppInfo
  var getActiveAppBounds: GetActiveAppBounds
  var getActiveScreen: GetActiveScreen
  var getActiveTab: GetActiveTab
  var getMousePosition: GetMousePosition
  var getProcesses: GetProcesses
  var getPrompts: GetPrompts
  /**
   * Attempts to bring the Script Kit window into focus.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### attemptScriptFocus example
   * ```ts
   * await attemptScriptFocus()
   * ```
   * [Examples](https://scriptkit.com?query=attemptScriptFocus) | [Docs](https://johnlindquist.github.io/kit-docs/#attemptScriptFocus) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=attemptScriptFocus)
   */
  var attemptScriptFocus: AttemptScriptFocus
  /**
   * Retrieves the Script Kit window objects.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### getKitWindows example
   * ```ts
   * let windows = await getKitWindows()
   * ```
   * [Examples](https://scriptkit.com?query=getKitWindows) | [Docs](https://johnlindquist.github.io/kit-docs/#getKitWindows) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getKitWindows)
   */
  var getKitWindows: GetKitWindows
  /**
   * Brings the Script Kit window into focus.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### focusKitWindow example
   * ```ts
   * await focusKitWindow()
   * ```
   * [Examples](https://scriptkit.com?query=focusKitWindow) | [Docs](https://johnlindquist.github.io/kit-docs/#focusKitWindow) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=focusKitWindow)
   */
  var focusKitWindow: FocusAppWindow
  var getScreens: GetScreens
  var selectDisplay: SelectDisplay
  var getSelectedFile: GetSelectedFile
  var revealInFinder: RevealInFinder
  /**
   * Prompt the user to select a file using the Finder dialog. You can pass a string as a customized message:
   * #### selectFile example
   * ```ts
   * let filePromptMessage = "Select a file to upload"
   * let filePath = await selectFile(filePromptMessage)
   * let text = await readFile(filePath, "utf8")
   * let gist = await createGist(text)
   * ```
   * [Examples](https://scriptkit.com?query=selectFile) | [Docs](https://johnlindquist.github.io/kit-docs/#selectFile) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=selectFile)
   */
  var selectFile: SelectFile
  /**
   * Prompt the user to select a folder using the Finder dialog. You can pass a string as a customized message:
   * #### selectFolder example
   * ```ts
   * let promptMessage = "Select a folder for your project"
   * let folderPath = await selectFolder(promptMessage)
   * let files = await readdir(folderPath)
   * await editor(files.join("\n"))
   * ```
   * [Examples](https://scriptkit.com?query=selectFolder) | [Docs](https://johnlindquist.github.io/kit-docs/#selectFolder) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=selectFolder)
   */
  var selectFolder: SelectFolder
  var revealFile: RevealFile
  var getSelectedText: GetSelectedText
  var cutText: CutText
  var getTabs: GetTabs
  /**
   * Retrieves information about open windows.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### getWindows example
   * ```ts
   * let windows = await getWindows()
   * ```
   * [Examples](https://scriptkit.com?query=getWindows) | [Docs](https://johnlindquist.github.io/kit-docs/#getWindows) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getWindows)
   */
  var getWindows: GetWindows
  /**
   * Retrieves the bounds of open windows.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### getWindowsBounds example
   * ```ts
   * let bounds = await getWindowsBounds()
   * ```
   * [Examples](https://scriptkit.com?query=getWindowsBounds) | [Docs](https://johnlindquist.github.io/kit-docs/#getWindowsBounds) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getWindowsBounds)
   */
  var getWindowsBounds: GetWindowsBounds
  var getSelectedDir: GetSelectedDir
  var keystroke: KeyStroke
  /**
   * Logs out the current user.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### logout example
   * ```ts
   * await logout()
   * ```
   * [Examples](https://scriptkit.com?query=logout) | [Docs](https://johnlindquist.github.io/kit-docs/#logout) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=logout)
   */
  var logout: Logout
  /**
   * Locks the screen.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### lock example
   * ```ts
   * await lock()
   * ```
   * [Examples](https://scriptkit.com?query=lock) | [Docs](https://johnlindquist.github.io/kit-docs/#lock) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=lock)
   */
  var lock: Lock
  var openLog: () => void
  /**
   * Organizes windows in a specific way.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### organizeWindows example
   * ```ts
   * await organizeWindows({
   *   direction?: "horizontal" | "vertical",
   *   padding?: number,
   *   ...
   * }): Promise<string>
   * ```
   * [Examples](https://scriptkit.com?query=organizeWindows) | [Docs](https://johnlindquist.github.io/kit-docs/#organizeWindows) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=organizeWindows)
   */
  var organizeWindows: OrganizeWindows
  var playAudioFile: PlayAudioFile
  var stopAudioFile: StopAudioFile
  var quitAllApps: QuitAllApps
  /**
   * Say something using the built-in text-to-speech:
   * #### say example
   * ```ts
   * await say("Done!")
   * ```
   * [Examples](https://scriptkit.com?query=say) | [Docs](https://johnlindquist.github.io/kit-docs/#say) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=say)
   */
  var say: Say
  /**
   * Evenly spaces out all open windows across the screen in a neat grid.
   * - Only tested on macOS.  
   * - May require accessibility permissions if it's moving windows across multiple monitors.
   * #### scatterWindows example
   * ```ts
   * await scatterWindows()
   * ```
   * [Examples](https://scriptkit.com?query=scatterWindows) | [Docs](https://johnlindquist.github.io/kit-docs/#scatterWindows) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=scatterWindows)
   */
  var scatterWindows: ScatterWindows
  /**
   * Scrapes a webpage and extracts an attribute value.
   * #### scrapeAttribute example
   * ```ts
   * let src = await scrapeAttribute("https://example.com", "img", "src")
   * ```
   * [Examples](https://scriptkit.com?query=scrapeAttribute) | [Docs](https://johnlindquist.github.io/kit-docs/#scrapeAttribute) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=scrapeAttribute)
   */
  var scrapeAttribute: ScrapeAttribute
  /**
   * Scrapes a webpage using a CSS selector.
   * #### scrapeSelector example
   * ```ts
   * let text = await scrapeSelector("https://example.com", "#main-content")
   * ```
   * [Examples](https://scriptkit.com?query=scrapeSelector) | [Docs](https://johnlindquist.github.io/kit-docs/#scrapeSelector) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=scrapeSelector)
   */
  var scrapeSelector: ScrapeSelector
  /**
   * Captures a screenshot of a webpage.
   * #### getScreenshotFromWebpage example
   * ```ts
   * let buffer = await getScreenshotFromWebpage("https://example.com", {
   *   width?: number,
   *   height?: number,
   *   ...
   * }): Promise<Buffer>
   * ```
   * [Examples](https://scriptkit.com?query=getScreenshotFromWebpage) | [Docs](https://johnlindquist.github.io/kit-docs/#getScreenshotFromWebpage) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getScreenshotFromWebpage)
   */
  var getScreenshotFromWebpage: GetScreenshotFromWebpage
  /**
   * Converts a webpage to a PDF.
   * #### getWebpageAsPdf example
   * ```ts
   * let buffer = await getWebpageAsPdf("https://example.com", {
   *   width: 800,
   *   height: 600
   * })
   * ```
   * [Examples](https://scriptkit.com?query=getWebpageAsPdf) | [Docs](https://johnlindquist.github.io/kit-docs/#getWebpageAsPdf) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getWebpageAsPdf)
   */
  var getWebpageAsPdf: GetWebpageAsPdf
  var setActiveAppBounds: SetActiveAppBounds
  var setActiveAppPosition: SetActiveAppPosition
  var setActiveAppSize: SetActiveAppSize
  /**
   * Paste text into the focused app. Literally triggers a "cmd/ctrl+v", so expect a similar behavior.
   * #### setSelectedText example
   * ```ts
   * await setSelectedText("Hello from Script Kit!");
   * ```
   * Grab text from the focused app. Literally triggers a "cmd?ctrl+c", so expect a similar behavior.
   * [Examples](https://scriptkit.com?query=setSelectedText) | [Docs](https://johnlindquist.github.io/kit-docs/#setSelectedText) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setSelectedText)
   */
  var setSelectedText: SetSelectedText
  var setSelectedFile: SetSelectedFile
  var setWindowBoundsByIndex: SetWindowBoundsByIndex
  /**
   * Sets the position of a specific window.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### setWindowPosition example
   * ```ts
   * await setWindowPosition(12345, 100, 200)
   * ```
   * [Examples](https://scriptkit.com?query=setWindowPosition) | [Docs](https://johnlindquist.github.io/kit-docs/#setWindowPosition) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setWindowPosition)
   */
  var setWindowPosition: SetWindowPosition
  /**
   * Sets the position of a window based on its index.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### setWindowPositionByIndex example
   * ```ts
   * await setWindowPositionByIndex(0, 100, 200)
   * ```
   * [Examples](https://scriptkit.com?query=setWindowPositionByIndex) | [Docs](https://johnlindquist.github.io/kit-docs/#setWindowPositionByIndex) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setWindowPositionByIndex)
   */
  var setWindowPositionByIndex: SetWindowPositionByIndex
  var setWindowSize: SetWindowSize
  var setWindowSizeByIndex: SetWindowSizeByIndex
  /**
   * Shuts down the computer.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### shutdown example
   * ```ts
   * await shutdown()
   * ```
   * [Examples](https://scriptkit.com?query=shutdown) | [Docs](https://johnlindquist.github.io/kit-docs/#shutdown) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=shutdown)
   */
  var shutdown: Shutdown
  /**
   * Puts the computer to sleep.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### sleep example
   * ```ts
   * await sleep()
   * ```
   * [Examples](https://scriptkit.com?query=sleep) | [Docs](https://johnlindquist.github.io/kit-docs/#sleep) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=sleep)
   */
  var sleep: Sleep
  /**
   * Tiles a specific window.
   * - Only tested on macOS.  
   * - May require accessibility permissions.
   * #### tileWindow example
   * ```ts
   * await tileWindow(12345, {
   *   direction: "horizontal",
   *   padding: 10
   * })
   * ```
   * [Examples](https://scriptkit.com?query=tileWindow) | [Docs](https://johnlindquist.github.io/kit-docs/#tileWindow) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=tileWindow)
   */
  var tileWindow: TileWindow
}
