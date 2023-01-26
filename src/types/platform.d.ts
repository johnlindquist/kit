import { ProcessInfo } from "./core"
import { Display, Point } from "./electron"
import type {
  BrowserContextOptions,
  Page,
  PageScreenshotOptions,
} from "playwright"

interface PlayAudioFile {
  (path: string, options?: any): Promise<string>
}

interface StopAudioFile {
  (): Promise<void>
}

interface CopyPathAsImage {
  (path: string): Promise<string>
}

interface FileSearchOptions {
  onlyin?: string
  kind?: string
}
interface FileSearch {
  (
    name: string,
    fileSearchOptions?: FileSearchOptions
  ): Promise<string[]>
}

type Browser =
  | "Google Chrome"
  | "Brave"
  | "Firefox"
  | "Edge"

interface GetActiveTab {
  (browser?: Browser): Promise<string>
}
interface GetTabs {
  (browser?: Browser): Promise<
    { url: string; title: string }[]
  >
}

interface FocusTab {
  (url: string, browser?: Browser): Promise<string>
}

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

interface ScrapeSelector<T = any> {
  (
    url: string,
    selector: string,
    /**
     * Transformation to apply to each DOM node that was selected.
     * By default, `element.innerText` is returned.
     */
    transform?: (element: any) => T,
    options?: ScrapeOptions
  ): Promise<T[]>
}

interface ScrapeAttribute {
  (
    url: string,
    selector: string,
    attribute: string,
    options?: ScrapeOptions
  ): Promise<string | null>
}
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

interface GetScreenshotFromWebpage {
  (
    url: string,
    options?: ScreenshotFromWebpageOptions
  ): Promise<Buffer>
}

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

interface GetWebpageAsPdf {
  (
    url: string,
    options?: WebpageAsPdfOptions
  ): Promise<Buffer>
}

interface Window {
  process: string
  title: string
  index: number
}
interface GetWindows {
  (): Promise<Window[]>
}

interface FocusWindow {
  (process: string, title: string): Promise<string>
}

interface WindowBounds {
  process: string
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  fullscreen: boolean
}
interface GetWindowsBounds {
  (): Promise<WindowBounds[]>
}
interface GetWindowPosition {
  (
    process: string,
    title: string,
    x: number,
    y: number
  ): Promise<string>
}

interface SetWindowPosition {
  (
    process: string,
    title: string,
    x: number,
    y: number
  ): Promise<string>
}
interface SetWindowSizeByIndex {
  (
    process: string,
    index: number,
    x: number,
    y: number
  ): Promise<string>
}
interface SetWindowBoundsByIndex {
  (
    process: string,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<string>
}

interface ScatterWindows {
  (): Promise<string>
}

interface OrganizeWindows {
  (): Promise<void>
}

interface SetWindowPositionByIndex {
  (
    process: string,
    index: number,
    x: number,
    y: number
  ): Promise<string>
}

interface SetWindowSize {
  (
    process: string,
    title: string,
    x: number,
    y: number
  ): Promise<string>
}

interface Screen {
  name: string
  x: number
  y: number
  width: number
  height: number
}
interface GetScreens {
  (): Promise<Display[]>
}

interface TileWindow {
  (
    app: string,
    leftOrRight: "left" | "right"
  ): Promise<string>
}

interface GetActiveScreen {
  (): Promise<Display>
}

interface GetMousePosition {
  (): Promise<Point>
}

interface GetProcesses {
  (): Promise<ProcessInfo[]>
}

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}
interface SetActiveAppBounds {
  (bounds: Bounds): Promise<void>
}
interface SetActiveAppPosition {
  (position: { x: number; y: number }): Promise<void>
}
interface SetActiveAppSize {
  (size: { width: number; height: number }): Promise<void>
}

interface GetActiveAppInfo {
  (): Promise<{
    localizedName: string
    bundleId: string
    bundlePath: string
    executablePath: string
    isLaunched: boolean
    pid: number
  }>
}
interface GetActiveAppBounds {
  (): Promise<Bounds>
}

interface GetSelectedFile {
  (): Promise<string>
}

interface SetSelectedFile {
  (filePath: string): Promise<void>
}

interface GetSelectedDir {
  (): Promise<string>
}
interface SelectFile {
  (message?: string): Promise<string>
}

interface RevealFile {
  (filePath: string): Promise<string>
}
interface RevealInFinder {
  (filePath?: string): Promise<void>
}
interface SelectFolder {
  (message?: string): Promise<string>
}

interface GetSelectedText {
  (): Promise<string>
}

interface CutText {
  (): Promise<string>
}

interface Lock {
  (): Promise<string>
}
interface Sleep {
  (): Promise<string>
}
interface Shutdown {
  (): Promise<string>
}

interface QuitAllApps {
  (appsToExclude?: string): Promise<string>
}

interface Say {
  (text: string, options?: any): Promise<string>
}

interface Beep {
  (): Promise<void>
}

interface SetSelectedText {
  (text: string, hide?: boolean): Promise<void>
}

interface KeyStroke {
  (keyString: string): Promise<string>
}

interface AppleScript {
  (script: string, options?: any): Promise<string>
}

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
  var getScreens: GetScreens
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
