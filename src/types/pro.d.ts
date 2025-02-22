import type { ForkOptions } from "node:child_process"
import type { Channel } from "../core/enum.js"
import type { PromptConfig } from "./core.js"
import type {
  BrowserWindowConstructorOptions,
  Display,
  Rectangle,
} from "./electron.js"

export type BaseWidgetOptions =
  BrowserWindowConstructorOptions & {
    /**
     * Important: This property determines whether the widget can be dragged.
     * To enable dragging, ensure that the "draggable" class is added to any element
     * intended for dragging the widget. This is essential for user interaction.
     */
    draggable?: boolean
    title?: string
    ignoreMouse?: boolean
    ttl?: number
    center?: boolean
    preventEscape?: boolea
    css?: string
    body?: string
  }

export type WidgetOptions = BaseWidgetOptions & {
  state?: any
  unpkg?: string[]
  containerClass?: string
  hidePrompt?: boolean
}

export type ViteOptions = BaseWidgetOptions & {
  mode?: "development" | "production" | string
  port?: number
}

export interface WidgetMessage {
  channel: Channel
  pid: number
  targetId: string
  widgetId: number
  value?: any
  x: number
  y: number
  width?: number
  height?: number
  dataset?: {
    [key: string]: any
  }
}

export interface ViteMessage extends WidgetMessage {
  widgetChannel: string
  widgetData?: any
}

export type WidgetHandler = (data: WidgetMessage) => void
export type ViteHandler = (data: ViteMessage) => void

export interface BaseWidgetApi {
  show: () => void
  showInactive: () => void
  hide: () => void
  focus: () => void
  blur: () => void
  minimize: () => void
  maximize: () => void
  restore: () => void
  setAlwaysOnTop: (flag: boolean) => void
  close: () => void
  setSize: (width: number, height: number) => void
  setPosition: (x: number, y: number) => void
  call: (name: string, ...args: any[]) => void
  executeJavaScript: (js: string) => Promise<any>
  capturePage: () => Promise<string>
  onClose: (handler: WidgetHandler) => void
}

export interface WidgetAPI extends BaseWidgetApi {
  setState: (state: any) => void
  fit: () => void
  onCustom: (handler: WidgetHandler) => void
  onClick: (handler: WidgetHandler) => void
  onDrop: (handler: WidgetHandler) => void
  onMouseDown: (handler: WidgetHandler) => void
  onInput: (handler: WidgetHandler) => void
  onResized: (handler: WidgetHandler) => void
  onMoved: (handler: WidgetHandler) => void
  onInit: (handler: WidgetHandler) => void
}

type ViteWidgetSendMessage = {
  channel: string
  pid: number
  targetId: string
  widgetId: number
  [key: string]: any
}
export interface ViteAPI extends BaseWidgetApi {
  /**
   * Registers an event handler for a specific channel.
   * @param event The channel name to listen for.
   * @param handler The function to be called when an event on this channel is received.
   * @returns A function that, when called, will remove the event handler.
   *
   * Example usage:
   * ```typescript
   * const removeHandler = v.on('myChannel', (data) => {
   *   console.log('Received data:', data);
   * });
   *
   * // Later, when you want to stop listening:
   * removeHandler();
   * ```
   */
  on: (event: string, handler: ViteHandler) => () => void
  send: (channel: string, data: any) => void
}

export type Widget = (
  html: string,
  options?: WidgetOptions
) => Promise<WidgetAPI>

export type ViteWidget = (
  dir: string,
  options?: ViteOptions
) => Promise<ViteAPI>

export type Menubar = (
  text: string,
  scripts?: string[]
) => Promise<void>

export interface TerminalOptions extends PromptConfig {
  command?: string
  cwd?: string
  shell?: string | boolean
  args?: string[]
  env?: {
    [key: string]: string
  }
  closeOnExit?: boolean
  cleanPath?: boolean
}

export type Terminal = {
  (command?: string, actions?: Action[]): Promise<string>
  (
    options?: TerminalOptions,
    actions?: Action[]
  ): Promise<string>
} & {
  write?: (text: string) => Promise<void>
}

export interface ProAPI {
  widget: Widget
  menubar: Menubar
  term: Terminal
}

export type ShowLogWindow = (
  scriptPath?: string
) => Promise<void>

declare global {
  /**
   * A `widget` creates a new window using HTML. The HTML can be styled via [Tailwind CSS](https://tailwindcss.com/docs/utility-first) class names.
   * Templating and interactivity can be added via [petite-vue](https://github.com/vuejs/petite-vue).
   * 1. The first argument is a string of HTML to render in the window.
   * 2. Optional: the second argument is ["Browser Window Options"](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)
   * #### widget example
   * ```ts
   * await widget(`<h1 class="p-4 text-4xl">Hello World!</h1>`)
   * ```
   * #### widget clock
   * ```ts
   * let clock = await widget(`<h1 class="text-7xl p-5 whitespace-nowrap">{{date}}</h1>`, {
   *     transparent: true,
   *     draggable: true,
   *     hasShadow: false,
   *     alwaysOnTop: true,
   * })
   * setInterval(()=> {
   *     clock.setState({
   *         date: new Date().toLocaleTimeString()
   *     })
   * }, 1000)
   * ```
   * #### widget events
   * ```ts
   * let text = ""
   * let count = 0
   * let w = await widget(`
   * <div class="p-5">
   *     <h1>Widget Events</h1>
   *     <input autofocus type="text" class="border dark:bg-black"/>
   *     <button id="myButton" class="border px-2 py-1">+</button>
   *     <span>{{count}}</span>    
   * </div>
   * `)
   * w.onClick((event) => {
   *     if (event.targetId === "myButton") {
   *         w.setState({count: count++})
   *     }
   * })
   * w.onClose(async () => {
   *     await widget(`
   * <div class="p-5">
   *     <h1>You closed the other widget</h1>
   *     <p>${text}</p>
   * </div>
   * `)
   * })
   * w.onInput((event) => {
   *     text = event.value
   * })
   * w.onMoved(({ x, y}) => {
   *     // e.g., save position
   * })
   * w.onResized(({ width, height }) => {
   *     // e.g., save size
   * })
   * ```
   [Examples](https://scriptkit.com?query=widget) | [Docs](https://johnlindquist.github.io/kit-docs/#widget) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=widget)
   */
  var widget: Widget
  /**
   * A `vite` generates a vite project and opens it in its own window.
   * 1. The first argument is the name of the folder you want generated in ~/.kenv/vite/your-folder
   * 2. Optional: the second argument is ["Browser Window Options"](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)
   * #### vite example
   * ```ts
   * const { workArea } = await getActiveScreen();
   * // Generates/opens a vite project in ~/.kenv/vite/project-path
   * const viteWidget = await vite("project-path", {
   *   x: workArea.x + 100,
   *   y: workArea.y + 100,
   *   width: 640,
   *   height: 480,
   * });
   * // In your ~/.kenv/vite/project-path/src/App.tsx (if you picked React)
   * // use the "send" api to send messages. "send" is injected on the window object
   * // <input type="text" onInput={(e) => send("input", e.target.value)} />
   * const filePath = home("vite-example.txt");
   * viteWidget.on(
   *   "input",
   *   debounce(async (input) => {
   *     await writeFile(filePath, input);
   *   }, 1000)
   * );
   * ```
   [Examples](https://scriptkit.com?query=vite) | [Docs](https://johnlindquist.github.io/kit-docs/#vite) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=vite)
   */
  var vite: ViteWidget
  /**
   * Set the system menu to a custom message/emoji with a list of scripts to run.
   * #### menu example
   * ```ts
   * // Set the menu to a custom message/emoji with a list of scripts to run
   * await menu(`👍`, ["my-script", "another-script"])
   * ```
   * #### menu reset example
   * ```ts
   * // Reset the menu to the default icon and scripts by passing an empty string
   * await menu(``)
   * ```
   [Examples](https://scriptkit.com?query=menu) | [Docs](https://johnlindquist.github.io/kit-docs/#menu) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=menu)
   */
  var menu: Menubar
  /**
   * Opens a built-in Terminal window.
   * - Can run interactive commands
   * - Supports custom working directory and shell
   * #### term example
   * ```ts
   * await term(`cd ~/.kenv/scripts && ls`)
   * ```
   * #### term with command
   * ```ts
   * await term(`cd ~/.kenv/scripts && ls`)
   * ```
   [Examples](https://scriptkit.com?query=term) | [Docs](https://johnlindquist.github.io/kit-docs/#term) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=term)
   */
  var term: Terminal
  /**
   * Opens a logs window to display script output.
   * - Displays output from all scripts run in the current session
   * #### showLogWindow example
   * ```ts
   * await showLogWindow()
   * ```
   [Examples](https://scriptkit.com?query=showLogWindow) | [Docs](https://johnlindquist.github.io/kit-docs/#showLogWindow) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=showLogWindow)
   */
  var showLogWindow: ShowLogWindow
}
