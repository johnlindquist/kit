export interface WidgetAPI {
  update: (html: string, options?: ShowOptions) => void
  capturePage: () => Promise<string>
  close: () => void
  fit: () => void
  setSize: (width: number, height: number) => void
  setPosition: (x: number, y: number) => void
}

export interface WidgetMessage {
  channel: Channel
  pid: number
  targetId: string
  widgetId: number
  value?: any
}

export type WidgetOptions = ShowOptions & {
  onClose?: () => void
  onInput?: (message: WidgetMessage) => void
  onClick?: (message: WidgetMessage) => void
}

export interface Widget {
  (
    html: string,
    options?: WidgetOptions
  ): Promise<WidgetAPI>
}

export interface Menubar {
  (text: string): Promise<void>
}

export interface Beta {
  widget: Widget
  menubar: Menubar
}

export interface Pro {
  beta: Beta
}

export interface ProAPI {
  beta: Beta
}
declare global {
  var pro: Pro
}
