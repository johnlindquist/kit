interface PlayAudioFile {
  (path: string, playInBackground?: boolean): void
}

import { Display, Point, Size, Rectangle } from "../declarations/electron"

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
    fileSearchOptions: FileSearchOptions
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
  (browser?: Browser): Promise<string[]>
}

interface FocusTab {
  (url: string, browser?: Browser): Promise<string>
}

interface ScrapeOptions {
  headless?: true
  timeout?: number
}
interface ScrapeSelector {
  (
    url: string,
    selector: string,
    transform: (element: any) => any,
    options: ScrapeOptions
  )
}
interface ScrapeAttribute {
  (
    url: string,
    selector: string,
    attribute: string,
    options: ScrapeOptions
  )
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
  (): Promise<Screen[]>
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

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}
interface SetActiveAppBounds {
  (bounds: Bounds): Promise<void>
}
interface GetActiveAppBounds {
  (): Promise<Bounds>
}

interface GetSelectedFile {
  (): Promise<string>
}

interface GetSelectedText {
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

interface SayOptions {
  rate?: number
  voice?: string
}
interface Say {
  (text: string, options?: SayOptions): Promise<string>
}

interface SetSelectedText {
  (text: string): Promise<void>
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
  getActiveAppBounds: GetActiveAppBounds
  getActiveScreen: GetActiveScreen
  getActiveTab: GetActiveTab
  getMousePosition: GetMousePosition
  getScreens: GetScreens
  getSelectedFile: GetSelectedFile
  getSelectedText: GetSelectedText
  getTabs: GetTabs
  getWindows: GetWindows
  getWindowsBounds: GetWindowsBounds
  keystroke: KeyStroke
  lock: Lock
  openLog: () => void
  organizeWindows: OrganizeWindows
  playAudioFile: PlayAudioFile
  quitAllApps: QuitAllApps
  say: Say
  scatterWindows: ScatterWindows
  scrapeAttribute: ScrapeAttribute
  scrapeSelector: ScrapeSelector
  setActiveAppBounds: SetActiveAppBounds
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
  var copyPathAsImage: CopyPathAsImage
  var fileSearch: FileSearch
  var focusTab: FocusTab
  var focusWindow: FocusWindow
  var getActiveAppBounds: GetActiveAppBounds
  var getActiveScreen: GetActiveScreen
  var getActiveTab: GetActiveTab
  var getMousePosition: GetMousePosition
  var getScreens: GetScreens
  var getSelectedFile: GetSelectedFile
  var getSelectedText: GetSelectedText
  var getTabs: GetTabs
  var getWindows: GetWindows
  var getWindowsBounds: GetWindowsBounds
  var keystroke: KeyStroke
  var lock: Lock
  var openLog: () => void
  var organizeWindows: OrganizeWindows
  var playAudioFile: PlayAudioFile
  var quitAllApps: QuitAllApps
  var say: Say
  var scatterWindows: ScatterWindows
  var scrapeAttribute: ScrapeAttribute
  var scrapeSelector: ScrapeSelector
  var setActiveAppBounds: SetActiveAppBounds
  var setSelectedText: SetSelectedText
  var setWindowBoundsByIndex: SetWindowBoundsByIndex
  var setWindowPosition: SetWindowPosition
  var setWindowPositionByIndex: SetWindowPositionByIndex
  var setWindowSize: SetWindowSize
  var setWindowSizeByIndex: SetWindowSizeByIndex
  var shutdown: Shutdown
  var sleep: Sleep
  var tileWindow: TileWindow
}
