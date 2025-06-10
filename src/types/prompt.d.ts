// Base types for all prompt functions in Script Kit

export interface PromptConfig {
  placeholder?: string
  hint?: string
  shortcuts?: Shortcut[]
  [key: string]: any
}

// Base interface that all prompt functions should extend
export interface BasePrompt<TConfig extends PromptConfig = PromptConfig, TReturn = string> {
  (promptOrConfig: string | TConfig, ...args: any[]): Promise<TReturn>
}

// Standard prompt that takes string or config as first parameter
export interface StandardPrompt<TReturn = string> extends BasePrompt<PromptConfig, TReturn> {
  (promptOrConfig: string | PromptConfig, ...args: any[]): Promise<TReturn>
}

// Prompt with choices (select, grid)
export interface ChoicePrompt<T = any> extends BasePrompt<PromptConfig, T> {
  (promptOrConfig: string | PromptConfig, choices: Choices<T>, actions?: Action[]): Promise<T>
}

// Special case for env which takes envKey first
export interface EnvPrompt extends BasePrompt<EnvConfig, string> {
  (envKey: string, promptOrConfig?: string | EnvConfig | (() => Promise<string>)): Promise<string>
}

// Existing types from kit.d.ts that should be updated to extend these base interfaces
export interface EnvConfig extends PromptConfig {
  reset?: boolean
  cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
}

export interface PathConfig extends PromptConfig {
  type?: 'file' | 'folder'
  defaultMissing?: 'select-anyway' | 'create-file' | 'create-folder'
  startPath?: string
  [key: string]: any
}

// Type guards to check if a function is a prompt
export function isPromptFunction(fn: any): fn is BasePrompt {
  return typeof fn === 'function' && fn.length >= 1
}

// Helper type to extract prompt config type from a prompt function
export type PromptConfigType<T> = T extends BasePrompt<infer C, any> ? C : never

// Helper type to extract return type from a prompt function  
export type PromptReturnType<T> = T extends BasePrompt<any, infer R> ? R : never