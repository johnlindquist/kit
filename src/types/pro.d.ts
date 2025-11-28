import type { ForkOptions } from "node:child_process"
import type { Channel } from "../core/enum.js"
import type { Action, PromptConfig } from "./core.js"
import type {
  BrowserWindowConstructorOptions,
  Display,
  Rectangle,
} from "./electron.js"

/**
 * Layout preset types for widget positioning
 */
export type LayoutPreset =
  | 'center'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'sidebar-right'
  | 'sidebar-left'
  | 'top-bar'
  | 'bottom-bar'

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
    preventEscape?: boolean
    css?: string
    body?: string
    /**
     * Layout preset for automatic widget positioning.
     * Corners: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
     * Edges: 'sidebar-right', 'sidebar-left', 'top-bar', 'bottom-bar'
     * Center: 'center'
     * @example
     * await widget(html, { layout: 'bottom-right', margin: 20 })
     */
    layout?: LayoutPreset
    /**
     * Margin from screen edges when using layout presets (default: 20)
     */
    margin?: number
    /**
     * Which monitor to use for layout: 'current' (where cursor is) or 'primary'
     */
    monitor?: 'current' | 'primary'
  }

export type WidgetOptions = BaseWidgetOptions & {
  state?: any
  unpkg?: string[]
  containerClass?: string
  hidePrompt?: boolean
  /**
   * Enable debug overlay showing widget state, IPC events, and bounds.
   * Toggle visibility with Ctrl+Shift+D
   */
  debug?: boolean
  /**
   * Auto-open Chrome DevTools for this widget (detached mode)
   */
  devTools?: boolean
  /** Internal: widget ID assigned by main process */
  widgetId?: string
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

/**
 * Widget bounds returned by getBounds()
 */
export interface WidgetBounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Result of a widget snapshot operation
 */
export interface WidgetSnapshotResult {
  id: string
  savedAt: number
  bounds: WidgetBounds
}

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
  /**
   * Get the current bounds (position and size) of the widget window
   */
  getBounds: () => Promise<WidgetBounds>
  /**
   * Save the widget's current state and bounds to disk for later restoration.
   * @param snapshotId - Optional unique identifier for this snapshot. Defaults to widget-{widgetId}
   * @returns The snapshot result with id, savedAt timestamp, and bounds
   */
  snapshot: (snapshotId?: string) => Promise<WidgetSnapshotResult>
  /**
   * Broadcast a message to all other widgets on a specific topic.
   * Other widgets can listen using onMessage(topic, handler).
   * @param topic - The topic/channel name to broadcast on
   * @param data - The data to send
   */
  broadcast: (topic: string, data: any) => void
}

/**
 * Inter-widget message payload
 */
export interface WidgetMessagePayload {
  topic: string
  data: any
  fromWidgetId: string
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
  /**
   * Subscribe to messages from other widgets on a specific topic.
   * @param topic - The topic/channel name to listen on
   * @param handler - Callback function that receives the message payload
   * @returns A function to unsubscribe from the topic
   */
  onMessage: (topic: string, handler: (payload: WidgetMessagePayload) => void) => () => void
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

// ============================================================================
// Widget Template Types
// ============================================================================

export interface ClockOptions extends Partial<WidgetOptions> {
  /** Time format: '12h', '24h', or custom like 'HH:mm:ss' */
  format?: '12h' | '24h' | 'HH:mm' | 'HH:mm:ss'
  /** Show date below time */
  showDate?: boolean
  /** Visual theme */
  theme?: 'minimal' | 'digital' | 'bold'
}

export interface CounterOptions extends Partial<WidgetOptions> {
  /** Starting value */
  initial?: number
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Increment/decrement step */
  step?: number
  /** Label text above counter */
  label?: string
}

export interface CounterAPI extends WidgetAPI {
  /** Current counter value */
  value: number
  /** Increment by step */
  increment: () => void
  /** Decrement by step */
  decrement: () => void
  /** Set to specific value */
  setValue: (value: number) => void
}

export interface StatusBadgeOptions extends Partial<WidgetOptions> {
  /** Icon or emoji to display */
  icon?: string
  /** Badge color */
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'orange'
  /** Enable pulse animation */
  pulse?: boolean
  /** Optional tooltip text */
  tooltip?: string
}

export interface ProgressOptions extends Partial<WidgetOptions> {
  /** Current progress (0-100) */
  value?: number
  /** Optional label */
  label?: string
  /** Show percentage text */
  showPercent?: boolean
  /** Bar color */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export interface ProgressAPI extends WidgetAPI {
  /** Current progress value */
  value: number
  /** Set progress (0-100) */
  setProgress: (value: number) => void
  /** Set label text */
  setLabel: (label: string) => void
}

export interface TextOptions extends Partial<WidgetOptions> {
  /** Font size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Text color (Tailwind color) */
  color?: string
  /** Font weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

export interface TextAPI extends WidgetAPI {
  /** Update displayed text */
  setText: (text: string) => void
}

export interface TimerOptions extends Partial<WidgetOptions> {
  /** Start timer automatically */
  autoStart?: boolean
  /** Countdown from this many seconds (omit for stopwatch mode) */
  countdown?: number
}

export interface TimerAPI extends WidgetAPI {
  /** Start the timer */
  start: () => void
  /** Stop the timer */
  stop: () => void
  /** Reset the timer */
  reset: () => void
  /** Elapsed time in milliseconds */
  elapsed: number
}

export interface WidgetTemplates {
  /**
   * Creates a live clock widget
   * @example
   * const clock = await widget.clock({ format: '12h', showDate: true })
   */
  clock: (options?: ClockOptions) => Promise<WidgetAPI>

  /**
   * Creates an interactive counter widget with +/- buttons
   * @example
   * const counter = await widget.counter({ initial: 0, min: 0, max: 100 })
   * counter.increment()
   */
  counter: (options?: CounterOptions) => Promise<CounterAPI>

  /**
   * Creates a status badge/indicator widget
   * @example
   * const status = await widget.statusBadge({ icon: '✓', color: 'green', pulse: true })
   */
  statusBadge: (options?: StatusBadgeOptions) => Promise<WidgetAPI>

  /**
   * Creates a progress bar widget
   * @example
   * const progress = await widget.progress({ value: 50, label: 'Loading...' })
   * progress.setProgress(75)
   */
  progress: (options?: ProgressOptions) => Promise<ProgressAPI>

  /**
   * Creates a simple text display widget
   * @example
   * const text = await widget.text('Hello World', { size: '2xl' })
   * text.setText('Updated!')
   */
  text: (content: string, options?: TextOptions) => Promise<TextAPI>

  /**
   * Creates a timer/stopwatch widget
   * @example
   * const timer = await widget.timer({ autoStart: true })
   * // Or countdown: await widget.timer({ countdown: 60 })
   */
  timer: (options?: TimerOptions) => Promise<TimerAPI>
}

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
   * [Examples](https://scriptkit.com?query=widget) | [Docs](https://johnlindquist.github.io/kit-docs/#widget) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=widget)
   *
   * #### Widget Templates
   * Pre-built widget templates for common patterns:
   * ```ts
   * // Live clock
   * const clock = await widget.clock({ format: '12h', showDate: true })
   *
   * // Interactive counter
   * const counter = await widget.counter({ min: 0, max: 100 })
   * counter.increment()
   *
   * // Status badge
   * const status = await widget.statusBadge({ color: 'green', pulse: true })
   *
   * // Progress bar
   * const progress = await widget.progress({ label: 'Loading...' })
   * progress.setProgress(50)
   *
   * // Text display
   * const text = await widget.text('Hello', { size: '2xl' })
   *
   * // Timer/Stopwatch
   * const timer = await widget.timer({ autoStart: true })
   * ```
   */
  var widget: Widget & WidgetTemplates
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
   * [Examples](https://scriptkit.com?query=vite) | [Docs](https://johnlindquist.github.io/kit-docs/#vite) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=vite)
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
   * [Examples](https://scriptkit.com?query=menu) | [Docs](https://johnlindquist.github.io/kit-docs/#menu) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=menu)
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
   * [Examples](https://scriptkit.com?query=term) | [Docs](https://johnlindquist.github.io/kit-docs/#term) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=term)
   */
  var term: Terminal
  /**
   * Opens a logs window to display script output.
   * - Displays output from all scripts run in the current session
   * #### showLogWindow example
   * ```ts
   * await showLogWindow()
   * ```
   * [Examples](https://scriptkit.com?query=showLogWindow) | [Docs](https://johnlindquist.github.io/kit-docs/#showLogWindow) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=showLogWindow)
   */
  var showLogWindow: ShowLogWindow
}
