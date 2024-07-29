import type { ForkOptions } from "node:child_process"
import type { Channel } from "../core/enum"
import type { PromptConfig } from "./core"
import type {
	BrowserWindowConstructorOptions,
	Display,
	Rectangle
} from "./electron"

export type BaseWidgetOptions = BrowserWindowConstructorOptions & {
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
}

export interface WidgetAPI extends BaseWidgetApi {
	setState: (state: any) => void
	fit: () => void
	onCustom: (handler: WidgetHandler) => void
	onClick: (handler: WidgetHandler) => void
	onDrop: (handler: WidgetHandler) => void
	onMouseDown: (handler: WidgetHandler) => void
	onInput: (handler: WidgetHandler) => void
	onClose: (handler: WidgetHandler) => void
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
	on: (event: string, handler: ViteHandler) => void
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

export type Menubar = (text: string, scripts?: string[]) => Promise<void>

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
	(options?: TerminalOptions, actions?: Action[]): Promise<string>
} & {
	write?: (text: string) => Promise<void>
}

export interface ProAPI {
	widget: Widget
	menubar: Menubar
	term: Terminal
}

export type ShowLogWindow = (scriptPath?: string) => Promise<void>

declare global {
	var widget: Widget
	var vite: ViteWidget
	var menu: Menubar
	var term: Terminal
	var showLogWindow: ShowLogWindow
}
