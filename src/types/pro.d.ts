import { ForkOptions } from "child_process"
import { Channel } from "../core/enum"
import { PromptConfig } from "./core"
import {
  BrowserWindowConstructorOptions,
  Display,
  Rectangle,
} from "./electron"

export type WidgetOptions =
  BrowserWindowConstructorOptions & {
    state?: any
    draggable?: boolean
    unpkg?: string[]
    title?: string
    ignoreMouse?: boolean
    ttl?: number
    center?: boolean
    containerClass?: string
    preventEscape?: boolean
    experimental?: boolean
    css?: string
    body?: string
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

export interface WidgetHandler {
  (data: WidgetMessage): void
}

export interface WidgetAPI {
  setState: (state: any) => void
  capturePage: () => Promise<string>
  close: () => void
  fit: () => void
  setSize: (width: number, height: number) => void
  setPosition: (x: number, y: number) => void
  call: (name: string, ...args: any[]) => void
  onCustom: (handler: WidgetHandler) => void
  onClick: (handler: WidgetHandler) => void
  onDrop: (handler: WidgetHandler) => void
  onMouseDown: (handler: WidgetHandler) => void
  onInput: (handler: WidgetHandler) => void
  onClose: (handler: WidgetHandler) => void
  onResized: (handler: WidgetHandler) => void
  onMoved: (handler: WidgetHandler) => void
  onInit: (handler: WidgetHandler) => void
  executeJavaScript: (js: string) => Promise<any>
  show: () => void
  showInactive: () => void
  hide: () => void
  focus: () => void
  blur: () => void
  minimize: () => void
  maximize: () => void
  restore: () => void
  setAlwaysOnTop: (flag: boolean) => void
}

export interface Widget {
  (
    html: string,
    options?: WidgetOptions
  ): Promise<WidgetAPI>
}

export interface Menubar {
  (text: string, scripts?: string[]): Promise<void>
}

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
  (command?: string): Promise<string>
  (options?: TerminalOptions): Promise<string>
} & {
  write?: (text: string) => Promise<void>
}

export interface ProAPI {
  widget: Widget
  menubar: Menubar
  term: Terminal
}

export interface ShowLogWindow {
  (scriptPath?: string): Promise<void>
}

declare global {
  var widget: Widget
  var menu: Menubar
  var term: Terminal
  var showLogWindow: ShowLogWindow
}
