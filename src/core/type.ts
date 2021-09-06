import { editor } from "@declarations/editor.api"
import { ProcessType, UI, Channel, Mode } from "./enum.js"

export interface Choice<Value = any> {
  name: string
  value?: Value
  description?: string
  focused?: string
  img?: string
  icon?: string
  html?: string
  preview?: string
  id?: string
  shortcode?: string[]
  className?: string
  tag?: string
  shortcut?: string
  drag?:
    | {
        format?: string
        data?: string
      }
    | string
}

export interface Script extends Choice {
  filePath: string
  command: string
  menu?: string
  shortcut?: string
  friendlyShortcut?: string
  alias?: string
  author?: string
  twitter?: string
  exclude?: boolean
  schedule?: string
  system?: string
  watch?: string
  background?: string
  isRunning?: boolean
  type: ProcessType
  requiresPrompt: boolean
  timeout?: number
  tabs?: string[]
  kenv: string
  tag?: string
  log?: boolean
  hasFlags?: boolean
}

type InputType =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"

export interface PromptData {
  id: number
  script: Script
  ui: UI
  placeholder: string
  kitScript: string
  choices: Choice[]
  tabs: string[]
  ignoreBlur: boolean
  textarea?: boolean
  secret?: boolean
  strict?: boolean
  mode?: Mode
  className?: string
  hint?: string
  input?: string
  selected?: string
  type?: InputType
}

export interface MessageData extends PromptData {
  channel: Channel
  pid: number
  log?: string
  warn?: string
  path?: string
  filePath?: string
  name?: string
  args?: string[]
  ignore?: boolean
  text?: string
  options?: any
  image?: any
  html?: string
  info?: string
  input?: string
  scripts?: boolean
  kenvPath?: string
  hint?: string
  tabIndex?: number
}

export enum Secret {
  password = "password",
  text = "text",
}

export interface EditorProps {
  options: EditorConfig
  height: number
  width: number
}

export type EditorOptions =
  editor.IStandaloneEditorConstructionOptions & {
    scrollTo: "top" | "center" | "bottom"
  }

export type EditorConfig = string | EditorOptions

export type TextareaConfig = {
  placeholder?: string
  value?: string
}

export type EditorRef = editor.IStandaloneCodeEditor

export type PromptBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type PromptDb = {
  screens: {
    [screenId: string]: {
      [scriptId: string]: PromptBounds
    }
  }
}
