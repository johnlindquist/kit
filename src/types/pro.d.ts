import { ForkOptions } from "child_process"
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
  onClick: (handler: WidgetHandler) => void
  onInput: (handler: WidgetHandler) => void
  onClose: (handler: WidgetHandler) => void
  onResized: (handler: WidgetHandler) => void
  onMoved: (handler: WidgetHandler) => void
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
}

export interface Terminal {
  (
    command?: string,
    forkOptions?: ForkOptions
  ): Promise<string>
  (
    options?: TerminalOptions,
    forkOptions?: ForkOptions
  ): Promise<string>
}

export interface ProAPI {
  widget: Widget
  menubar: Menubar
  term: Terminal
}

declare global {
  var widget: Widget
  var menu: Menubar
  var term: Terminal
}
