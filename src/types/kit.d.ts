import type { Low } from 'lowdb'
import type { format, formatDistanceToNow } from 'date-fns'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import type {
  Action,
  Choice,
  Choices,
  FlagsObject,
  ActionsConfig,
  Panel,
  Preview,
  PromptConfig,
  ScoredChoice,
  Script,
  Shortcut,
  Flags
} from './core.js'
import { ChannelHandler } from './core.js'
import type { ConfigOptions, Options } from 'quick-score'

export interface Arg {
  [key: string]: any
  <T = string>(
    placeholderOrConfig?: string | PromptConfig,
    choicesOrPanel?: Choices<T> | Panel,
    actionsOrPreview?: Action[] | Preview
  ): Promise<T>
}

export type Select = <T = any[]>(
  placeholderOrConfig: string | PromptConfig,
  choices: Choices<T>,
  actions?: Action[]
) => Promise<T>

export type Grid = <T = any[]>(
  placeholderOrConfig: string | PromptConfig,
  choices: Choices<T>,
  actions?: Action[]
) => Promise<T>

export interface EnvConfig extends PromptConfig {
  reset?: boolean
}
export interface Env {
  (envKey: string, promptConfig?: string | EnvConfig | (() => Promise<string>)): Promise<string>
  [key: string]: any
}

export interface Args extends Array<string> {}

export type UpdateArgs = (args: string[]) => void

export type PathFn = (...pathParts: string[]) => string

export type Inspect = (data: any, extension?: string) => Promise<void>

export type Store = (key: string, initialData?: any) => Promise<InstanceType<typeof import('keyv').default>>

type DBExtensions<T> = {
  data: T extends string[] ? { items: T } : T
  dbPath: string
  clear: () => Promise<void>
  reset: () => Promise<void>
}

type DBItems<T> = T extends string[] ? { items: T } : {}

export type DBKeyOrPath<T> = string | T | (() => Promise<T>)
export type DBData<T> = T | (() => Promise<T>)
export type DBReturnType<T> = Low<T> & DBItems<T> & DBExtensions<T> & T

export type DB = <
  T = {
    [key: string]: any
  }
>(
  dataOrKeyOrPath?: DBKeyOrPath<T>,
  data?: DBData<T>,
  fromCache?: boolean
) => Promise<DBReturnType<T>>

export type OnTab = (name: string, fn: (input?: string) => void | Promise<void>) => void

export interface Trace {
  enabled: boolean
  begin: (fields: Parameters<InstanceType<typeof import('chrome-trace-event').Tracer>['begin']>[0]) => void
  end: (fields: Parameters<InstanceType<typeof import('chrome-trace-event').Tracer>['end']>[0]) => void
  instant: (fields: Parameters<InstanceType<typeof import('chrome-trace-event').Tracer>['instantEvent']>[0]) => void
  flush: () => void
}

export type OnExit = (fn: () => void) => void

export type KitModuleLoader = (packageName: string, ...moduleArgs: string[]) => Promise<any>
export type Edit = (file: string, dir?: string, line?: string | number, col?: string | number) => Promise<void>

export type Browse = (url: string) => Promise<void>

export type Wait = (time: number, submitValue?: any) => Promise<void>

export type IsCheck = (file: string) => Promise<boolean>

export type PathResolver = (dir: string) => (...pathParts: string[]) => string

export type GetScripts = (fromCache?: boolean) => Promise<Script[]>

export type FlagFn = (flags: FlagsObject, options?: ActionsConfig) => Promise<void>
export type ActionsFn = (actions: Action[], options?: ActionsConfig) => Promise<void>
export type PrepFlags = (flags: FlagsObject) => FlagsObject

export type SelectKitEditor = (reset: boolean) => Promise<string>

export interface SelectScript {
  (message?: string, fromCache?: boolean, xf?: (x: Script[]) => Script[]): Promise<Script>
  (message: PromptConfig, fromCache?: boolean, xf?: (x: Script[]) => Script[]): Promise<Script | string>
}

export interface Kenv {
  name: string
  dirPath: string
}
export type SelectKenv = (config?: PromptConfig, ignorePattern?: RegExp) => Promise<Kenv>

export type Highlight = (markdown: string, containerClass?: string, injectStyles?: string) => Promise<string>

export type PathDefaultMissingValues = 'select-anyway' | 'create-file' | 'create-folder'
export interface PathConfig extends PromptConfig {
  startPath?: string
  onlyDirs?: boolean
  showHidden?: boolean
  missingChoices?: Choice[]
}

type PathPicker = (config?: string | PathConfig, actions?: Action[]) => Promise<string>
export type PathSelector = typeof import('path') & PathPicker

type GistOptions = {
  fileName?: string
  description?: string
  isPublic?: boolean
}
export type CreateGist = (
  content: string,
  options?: GistOptions
) => Promise<RestEndpointMethodTypes['gists']['create']['response']['data']>

export type SetShortcuts = (shortcuts: Shortcut[]) => Promise<void>
export interface KitApi {
/**
 * The `path` prompt allows you to select a file or folder from the file system. You navigate with tab/shift+tab (or right/left arrows) and enter to select.
 * 1. Optional: The first argument is the initial directory to open with. Defaults to the home directory.
 * #### path example
 * ```ts
 * let selectedFile = await path()
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#path
 */
path: PathSelector
/**
 * An extremely simple database that persists to a file.
 * #### db hello world
 * ```ts
 * // Name: db-hello-world
 * import "@johnlindquist/kit";
 * // Pre-populate the database with some items
 * const peopleDb = await db({
 *   people: [
 *     {
 *       name: "John",
 *       age: 30,
 *       city: "San Francisco",
 *     },
 *     {
 *       name: "Jane",
 *       age: 25,
 *       city: "New York",
 *     },
 *   ] as Person[],
 * });
 * const person = await arg<Person>("Select a person", peopleDb.people);
 * // Do something with the person...
 * const [name, age, city] = await fields({
 *   fields: ["name", "age", "city"],
 *   enter: "Add",
 *   description: "Add a new person to the database",
 * });
 * peopleDb.people.push({ name, age: parseInt(age), city });
 * await peopleDb.write();
 * await editor(JSON.stringify(peopleDb.people, null, 2));
 * type Person = {
 *   name: string;
 *   age: number;
 *   city: string;
 * };
 * ```
 * #### db populate
 * ```ts
 * // Name: Populate db example
 * // Description: Shows how to pre-populate database
 * // Group: Data
 * // Pass in a function to generate data for the db
 * // Because this script is named "db-basic.js"
 * // The database is found at "~/.kenv/db/_db-basic.json"
 * import "@johnlindquist/kit";
 * let reposDb = await db(async () => {
 *   let response = await get("https://api.github.com/users/johnlindquist/repos");
 * return response.data.map(({ name, description, html_url }) => {
 *     return {
 *       name,
 *       description,
 *       value: html_url,
 *     };
 *   });
 * });
 * let repoUrl = await arg("Select repo to open:", reposDb.items);
 * exec(`open "${repoUrl}"`);
 * ```
 * #### db store
 * ```ts
 * // Name: Database Read/Write Example
 * // Description: Add/remove items from a list of fruit
 * // Group: Data
 * import "@johnlindquist/kit"
 * let fruitDb = await db(["apple", "banana", "orange"])
 * while (true) {
 *   let fruitToAdd = await arg("Add a fruit", md(fruitDb.items.map(fruit => `* ${fruit}`).join("\n")))
 * fruitDb.items.push(fruitToAdd)
 *   await fruitDb.write()
 * let fruitToDelete = await arg("Delete a fruit", fruitDb.items)
 * fruitDb.items = fruitDb.items.filter(fruit => fruit !== fruitToDelete)
 * await fruitDb.write()
 * }
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#db
 */
db: DB

  wait: Wait

  checkProcess: (processId: number) => string

  /**
   * @example
   * ```
   * let pathToProject =  await home("projects", "my-code-project")
   * // /Users/johnlindquist/projects/my-code-project
   * ```
   */
  home: PathFn
  isFile: IsCheck
  isDir: IsCheck
  isBin: IsCheck
  createPathResolver: PathResolver
  /**
   * - Accept text input from the user.
   * - Optionally provide a list of choices filtered by the text input.
   * - Optionally provide a list of actions to trigger when the user presses a shortcut.
   * 1. The first argument is a string or a prompt configuration object.
   * 2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.
   * #### arg example
   * ```ts
   * let value = await arg()
   * ```
   * #### arg basic string input
   * ```ts
   * let name = await arg("Enter your name")
   * ```
   * #### arg with async choices object
   * ```ts
   * let person = await arg("Select a person", async () => {
   *     let response = await get("https://swapi.dev/api/people/");
   *     // return an array of objects with "name", "value", and "description" properties
   *     return response?.data?.results.map((person) => { 
   *         return {
   *             name: person.name,
   *             description: person.url,
   *             value: person
   *         }
   *     });
   * })
   * ```
   * #### arg with async choices
   * ```ts
   * let name = await arg("Select a name", async () => {
   *     let response = await get("https://swapi.dev/api/people/");
   *     return response?.data?.results.map((p) => p.name);
   * })
   * ```
   * #### arg with choices array
   * ```ts
   * let name = await arg("Select a name", [
   *   "John",
   *   "Mindy",
   *   "Joy",
   * ])
   * ```
   * #### arg with generated choices
   * ```ts
   * let char = await arg("Type then pick a char", (input) => { 
   *     // return an array of strings
   *     return input.split("")
   * })
   * ```
   * #### arg with shortcuts
   * ```ts
   * let url = "https://swapi.dev/api/people"
   * let name = await arg({
   *     placeholder: "Select a name",
   *     shortcuts: [
   *         {
   *             name: "Explore API",
   *             key: "cmd+e",
   *             onPress: async () => { 
   *                 open(url)
   *             },
   *             bar: "right"
   *         }
   *     ]
   * }, async () => { 
   *     let response = await get(url);
   *     return response?.data?.results.map((p) => p.name);
   * })
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#arg
   */
  arg: Arg
/**
 * Prompts the user to select one or more options.
 * #### select example
 * ```ts
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   ["John", "Nghia", "Mindy", "Joy"]
 * )
 * ```
 * #### select a choice with a single keystroke
 * ```ts
 * // Name: Single Keystroke Demo
 * // Group: Prompt
 * import "@johnlindquist/kit"
 * let choice = await arg({
 *   placeholder: "Choose a color",
 *   choices: [
 *     { name: "[R]ed", value: "red" },
 *     { name: "[G]reen", value: "green" },
 *     { name: "[B]lue", value: "blue" },
 *   ],
 * })
 * await div(md(`You chose ${choice}`))
 * ```
 * #### select array object
 * ```ts
 * const people = [
 *   {
 *     name: "John",
 *     description: "Full-stack Dev",
 *     value: "John",
 *   },
 *   {
 *     name: "Nghia",
 *     description: "Full-stackoverflow dev",
 *     value: "Nghia",
 *   },
 *   {
 *     name: "Mindy",
 *     description: "Business Analyst",
 *     value: "Mindy",
 *   },
 *   {
 *     name: "Joy",
 *     description: "Leader",
 *     value: "Joy",
 *   },
 * ]
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   people
 * )
 * ```
 * #### select async choices array object
 * ```ts
 * let name = await select(
 *   "GET: NAME (please wait)",
 *   async () => {
 *     let response = await get(
 *       "https://swapi.dev/api/people/"
 *     )
 *     return response?.data?.results.map(person => {
 *       return {
 *         name: person.name,
 *         description: `height: ${person.height}, mass: ${person.mass}`,
 *         value: person,
 *         preview: () => JSON.stringify(person),
 *       }
 *     })
 *   }
 * )
 * ```
 * #### select basic array input
 * ```ts
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   ["John", "Nghia", "Mindy", "Joy"]
 * )
 * ```
 * #### select generated input choices
 * ```ts
 * let word = await select("Type then pick a words", input => {
 *   return input.trim().split(new RegExp("[.,;/-_\n]", "g"))
 * })
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#select
 */
select: Select
/**
 * Prompts the user for input in a compact format.
 * #### mini example
 * ```ts
 * let name = await mini("Enter your name")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#mini
 */
mini: Arg
/**
 * Prompts the user for input in a tiny, adorable format.
 * #### micro example
 * ```ts
 * let name = await micro("Enter your name")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#micro
 */
micro: Arg
  /**
   * Load an env var if it exists, prompt to set the env var if not:
   * You can also prompt the user to set the env var using a prompt by nesting it in an async function:
   * #### env example
   * ```ts
   * // Write write "MY_ENV_VAR" to ~/.kenv/.env
   * let MY_ENV_VAR = await env("MY_ENV_VAR")
   * ```
   * #### env example with prompt
   * ```ts
   * // Prompt the user to select from a path
   * let OUTPUT_DIR = await env("OUTPUT_DIR", async () => {
   *   return await path({
   *     hint: `Select the output directory`,
   *   })
   * })
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#env
   */
  env: Env
  argOpts: string[]

  kitPath: PathFn
  kenvPath: PathFn
  /**
   * Generate a path `~/.kenv/tmp/{command}/...parts`
   *
   * @example
   * ```
   * tmpPath("taco.txt") // ~/.kenv/tmp/command/taco.txt
   * ```
   */
  tmpPath: PathFn
  kenvTmpPath: PathFn

  /**
   * `inspect` takes an object and writes out a text file you can use to read/copy/paste the values from:
   * > Note: It will automatically convert objects to JSON to display them in the file
   * #### inspect example
   * ```ts
   * let response = await get("https://swapi.dev/api/people/1/")
   * await inspect(response.data)
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#inspect
   */
  inspect: Inspect

  onTab: OnTab
  onExit: OnExit

  /**
   * Attempts to import a module.
   * #### attemptImport example
   * ```ts
   * let module = await attemptImport("lodash")
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#attemptimport
   */
  attemptImport: KitModuleLoader
/**
 * Attempts to import a module silently.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### silentAttemptImport example
 * ```ts
 * let module = await silentAttemptImport("lodash")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#silentattemptimport
 */
silentAttemptImport: KitModuleLoader
/**
 * > Deprecated: Use standard `import` instead.
 * Installs an npm package.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### npm example
 * ```ts
 * await npm("lodash")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#npm
 */
npm: KitModuleLoader
  setup: KitModuleLoader

  edit: Edit
  browse: Browse

  args: Args
  updateArgs: UpdateArgs

  kitScript: string

  terminal: (script: string) => Promise<string>
  iterm: (iterm: string) => Promise<string>
  hyper: (hyper: string) => Promise<string>

  onTabs: {
    name: string
    fn: (input?: string) => void | Promise<any>
  }[]
  onTabIndex: number

  kitPrevChoices: Choices<any>

  getScripts: GetScripts

  /**
   * Manages a memory map of objects.
   * #### memoryMap example
   * ```ts
   * memoryMap.set("myKey", { myObject: true })
   * let value = memoryMap.get("myKey")
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#memorymap
   */
  memoryMap: Map<string, any>

  selectKitEditor: SelectKitEditor

  run: Run

  flag: Flags
  setFlags: FlagFn
  prepFlags: PrepFlags
  selectScript: SelectScript
  selectKenv: SelectKenv
  highlight: Highlight
  projectPath: PathFn
/**
 * Creates a GitHub gist.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### createGist example
 * ```ts
 * let gistUrl = await createGist({
 *   description: "My awesome gist",
 *   public: true,
 *   files: {
 *     "hello.txt": {
 *       content: "Hello, world!"
 *     }
 *   }
 * })
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#creategist
 */
createGist: CreateGist
  setShortcuts: SetShortcuts
  isWin: boolean
  isMac: boolean
  isLinux: boolean
  cmd: 'cmd' | 'ctrl'
  formatDate: typeof format
  formatDateToNow: typeof formatDistanceToNow
}

interface KeyValue {
  [key: string]: any
}

export type Run = (command?: string, ...args: string[]) => Promise<any>

type Utils = typeof import('../core/utils')

declare global {
/**
 * The `path` prompt allows you to select a file or folder from the file system. You navigate with tab/shift+tab (or right/left arrows) and enter to select.
 * 1. Optional: The first argument is the initial directory to open with. Defaults to the home directory.
 * #### path example
 * ```ts
 * let selectedFile = await path()
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#path
 */
var path: PathSelector
  var edit: Edit
  var browse: Browse

  var kitPath: PathFn
  var kenvPath: PathFn
  var tmpPath: PathFn
  var kenvTmpPath: PathFn

  /**
   * Attempts to import a module.
   * #### attemptImport example
   * ```ts
   * let module = await attemptImport("lodash")
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#attemptimport
   */
  var attemptImport: KitModuleLoader
/**
 * Attempts to import a module silently.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### silentAttemptImport example
 * ```ts
 * let module = await silentAttemptImport("lodash")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#silentattemptimport
 */
var silentAttemptImport: KitModuleLoader
  /**
   * > Deprecated: Use standard `import` instead.
   * Installs an npm package.
   * - Only tested on macOS
   * - May require additional permissions or configurations
   * #### npm example
   * ```ts
   * await npm("lodash")
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#npm
   */
  var npm: KitModuleLoader
  var npmInstall: (packageName: string) => Promise<void>
  var installMissingPackage: (packageName: string) => Promise<void>
  var run: Run
  var setup: KitModuleLoader

  /**
   * Load an env var if it exists, prompt to set the env var if not:
   * You can also prompt the user to set the env var using a prompt by nesting it in an async function:
   * #### env example
   * ```ts
   * // Write write "MY_ENV_VAR" to ~/.kenv/.env
   * let MY_ENV_VAR = await env("MY_ENV_VAR")
   * ```
   * #### env example with prompt
   * ```ts
   * // Prompt the user to select from a path
   * let OUTPUT_DIR = await env("OUTPUT_DIR", async () => {
   *   return await path({
   *     hint: `Select the output directory`,
   *   })
   * })
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#env
   */
  var env: Env
/**
 * - Accept text input from the user.
 * - Optionally provide a list of choices filtered by the text input.
 * - Optionally provide a list of actions to trigger when the user presses a shortcut.
 * 1. The first argument is a string or a prompt configuration object.
 * 2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.
 * #### arg example
 * ```ts
 * let value = await arg()
 * ```
 * #### arg basic string input
 * ```ts
 * let name = await arg("Enter your name")
 * ```
 * #### arg with async choices object
 * ```ts
 * let person = await arg("Select a person", async () => {
 *     let response = await get("https://swapi.dev/api/people/");
 *     // return an array of objects with "name", "value", and "description" properties
 *     return response?.data?.results.map((person) => { 
 *         return {
 *             name: person.name,
 *             description: person.url,
 *             value: person
 *         }
 *     });
 * })
 * ```
 * #### arg with async choices
 * ```ts
 * let name = await arg("Select a name", async () => {
 *     let response = await get("https://swapi.dev/api/people/");
 *     return response?.data?.results.map((p) => p.name);
 * })
 * ```
 * #### arg with choices array
 * ```ts
 * let name = await arg("Select a name", [
 *   "John",
 *   "Mindy",
 *   "Joy",
 * ])
 * ```
 * #### arg with generated choices
 * ```ts
 * let char = await arg("Type then pick a char", (input) => { 
 *     // return an array of strings
 *     return input.split("")
 * })
 * ```
 * #### arg with shortcuts
 * ```ts
 * let url = "https://swapi.dev/api/people"
 * let name = await arg({
 *     placeholder: "Select a name",
 *     shortcuts: [
 *         {
 *             name: "Explore API",
 *             key: "cmd+e",
 *             onPress: async () => { 
 *                 open(url)
 *             },
 *             bar: "right"
 *         }
 *     ]
 * }, async () => { 
 *     let response = await get(url);
 *     return response?.data?.results.map((p) => p.name);
 * })
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#arg
 */
var arg: Arg
/**
 * Prompts the user to select one or more options.
 * #### select example
 * ```ts
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   ["John", "Nghia", "Mindy", "Joy"]
 * )
 * ```
 * #### select a choice with a single keystroke
 * ```ts
 * // Name: Single Keystroke Demo
 * // Group: Prompt
 * import "@johnlindquist/kit"
 * let choice = await arg({
 *   placeholder: "Choose a color",
 *   choices: [
 *     { name: "[R]ed", value: "red" },
 *     { name: "[G]reen", value: "green" },
 *     { name: "[B]lue", value: "blue" },
 *   ],
 * })
 * await div(md(`You chose ${choice}`))
 * ```
 * #### select array object
 * ```ts
 * const people = [
 *   {
 *     name: "John",
 *     description: "Full-stack Dev",
 *     value: "John",
 *   },
 *   {
 *     name: "Nghia",
 *     description: "Full-stackoverflow dev",
 *     value: "Nghia",
 *   },
 *   {
 *     name: "Mindy",
 *     description: "Business Analyst",
 *     value: "Mindy",
 *   },
 *   {
 *     name: "Joy",
 *     description: "Leader",
 *     value: "Joy",
 *   },
 * ]
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   people
 * )
 * ```
 * #### select async choices array object
 * ```ts
 * let name = await select(
 *   "GET: NAME (please wait)",
 *   async () => {
 *     let response = await get(
 *       "https://swapi.dev/api/people/"
 *     )
 *     return response?.data?.results.map(person => {
 *       return {
 *         name: person.name,
 *         description: `height: ${person.height}, mass: ${person.mass}`,
 *         value: person,
 *         preview: () => JSON.stringify(person),
 *       }
 *     })
 *   }
 * )
 * ```
 * #### select basic array input
 * ```ts
 * let multipleChoice = await select(
 *   "Select one or more developer",
 *   ["John", "Nghia", "Mindy", "Joy"]
 * )
 * ```
 * #### select generated input choices
 * ```ts
 * let word = await select("Type then pick a words", input => {
 *   return input.trim().split(new RegExp("[.,;/-_\n]", "g"))
 * })
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#select
 */
var select: Select
/**
 * Prompts the user to select one or more options in a grid layout.
 * #### grid example
 * ```ts
 * let multipleChoice = await grid(
 *   "Select one or more developer",
 *   ["John", "Nghia", "Mindy", "Joy"]
 * )
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#grid
 */
var grid: Grid
  var basePrompt: Arg
/**
 * Prompts the user for input in a compact format.
 * #### mini example
 * ```ts
 * let name = await mini("Enter your name")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#mini
 */
var mini: Arg
/**
 * Prompts the user for input in a tiny, adorable format.
 * #### micro example
 * ```ts
 * let name = await micro("Enter your name")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#micro
 */
var micro: Arg
  var onTab: OnTab
  var onExit: OnExit
  var args: Args

  var updateArgs: UpdateArgs
  var argOpts: string[]

  var wait: Wait

  var home: PathFn
  var isFile: IsCheck
  var isDir: IsCheck
  var isBin: IsCheck
  var createPathResolver: PathResolver

  /**
   * `inspect` takes an object and writes out a text file you can use to read/copy/paste the values from:
   * > Note: It will automatically convert objects to JSON to display them in the file
   * #### inspect example
   * ```ts
   * let response = await get("https://swapi.dev/api/people/1/")
   * await inspect(response.data)
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#inspect
   */
  var inspect: Inspect

  /**
   * An extremely simple database that persists to a file.
   * #### db hello world
   * ```ts
   * // Name: db-hello-world
   * import "@johnlindquist/kit";
   * // Pre-populate the database with some items
   * const peopleDb = await db({
   *   people: [
   *     {
   *       name: "John",
   *       age: 30,
   *       city: "San Francisco",
   *     },
   *     {
   *       name: "Jane",
   *       age: 25,
   *       city: "New York",
   *     },
   *   ] as Person[],
   * });
   * const person = await arg<Person>("Select a person", peopleDb.people);
   * // Do something with the person...
   * const [name, age, city] = await fields({
   *   fields: ["name", "age", "city"],
   *   enter: "Add",
   *   description: "Add a new person to the database",
   * });
   * peopleDb.people.push({ name, age: parseInt(age), city });
   * await peopleDb.write();
   * await editor(JSON.stringify(peopleDb.people, null, 2));
   * type Person = {
   *   name: string;
   *   age: number;
   *   city: string;
   * };
   * ```
   * #### db populate
   * ```ts
   * // Name: Populate db example
   * // Description: Shows how to pre-populate database
   * // Group: Data
   * // Pass in a function to generate data for the db
   * // Because this script is named "db-basic.js"
   * // The database is found at "~/.kenv/db/_db-basic.json"
   * import "@johnlindquist/kit";
   * let reposDb = await db(async () => {
   *   let response = await get("https://api.github.com/users/johnlindquist/repos");
   * return response.data.map(({ name, description, html_url }) => {
   *     return {
   *       name,
   *       description,
   *       value: html_url,
   *     };
   *   });
   * });
   * let repoUrl = await arg("Select repo to open:", reposDb.items);
   * exec(`open "${repoUrl}"`);
   * ```
   * #### db store
   * ```ts
   * // Name: Database Read/Write Example
   * // Description: Add/remove items from a list of fruit
   * // Group: Data
   * import "@johnlindquist/kit"
   * let fruitDb = await db(["apple", "banana", "orange"])
   * while (true) {
   *   let fruitToAdd = await arg("Add a fruit", md(fruitDb.items.map(fruit => `* ${fruit}`).join("\n")))
   * fruitDb.items.push(fruitToAdd)
   *   await fruitDb.write()
   * let fruitToDelete = await arg("Delete a fruit", fruitDb.items)
   * fruitDb.items = fruitDb.items.filter(fruit => fruit !== fruitToDelete)
   * await fruitDb.write()
   * }
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#db
   */
  var db: DB
/**
 * Stores data in a persistent key-value store.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### store example
 * ```ts
 * await store.set("myKey", "myValue")
 * let value = await store.get("myKey")
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#store
 */
var store: Store

  /**
   * Manages a memory map of objects.
   * #### memoryMap example
   * ```ts
   * memoryMap.set("myKey", { myObject: true })
   * let value = memoryMap.get("myKey")
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#memorymap
   */
  var memoryMap: Map<string, any>

  var onTabIndex: number

  var selectKitEditor: SelectKitEditor

  var getScripts: GetScripts
  var blur: () => Promise<void>
  var flag: Flags
  var actionFlag: string
  var setFlags: FlagFn
  var setActions: ActionsFn
  var openActions: () => Promise<void>
  var closeActions: () => Promise<void>
  var setFlagValue: (value: any) => Promise<void>
  var prepFlags: PrepFlags

  var selectScript: SelectScript
  var selectKenv: SelectKenv
  var highlight: Highlight

  var terminal: (script: string) => Promise<string>
  var iterm: (iterm: string) => Promise<string>
  var hyper: (hyper: string) => Promise<string>
  var projectPath: PathFn
  var clearAllTimeouts: () => void
  var clearAllIntervals: () => void
/**
 * Creates a GitHub gist.
 * - Only tested on macOS
 * - May require additional permissions or configurations
 * #### createGist example
 * ```ts
 * let gistUrl = await createGist({
 *   description: "My awesome gist",
 *   public: true,
 *   files: {
 *     "hello.txt": {
 *       content: "Hello, world!"
 *     }
 *   }
 * })
 * ```
 * @see https://johnlindquist.github.io/kit-docs/#creategist
 */
var createGist: CreateGist
  var setShortcuts: SetShortcuts
  var isWin: boolean
  var isMac: boolean
  var isLinux: boolean
  var cmd: 'cmd' | 'ctrl'
  var formatDate: typeof format
  var formatDateToNow: typeof formatDistanceToNow

  var debounce: Utils['debounce']
  var sortBy: Utils['sortBy']
  var isUndefined: Utils['isUndefined']
  var isString: Utils['isString']

  var createChoiceSearch: (
    choices: Choice[],
    config: Partial<Options & ConfigOptions>
  ) => Promise<(query: string) => ScoredChoice[]>

  /**
   * Sets scored choices for a prompt.
   * #### setScoredChoices example
   * ```ts
   * await setScoredChoices([
   *   { name: "John", score: 0.9 },
   *   { name: "Mindy", score: 0.8 },
   *   { name: "Joy", score: 0.7 }
   * ])
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#setscoredchoices
   */
  var setScoredChoices: (scoredChoices: ScoredChoice[]) => Promise<void>

  /**
   * Groups choices for a prompt.
   * #### groupChoices example
   * ```ts
   * await groupChoices([
   *   { name: "Group 1", choices: ["John", "Mindy"] },
   *   { name: "Group 2", choices: ["Joy"] }
   * ])
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#groupchoices
   */
  var groupChoices: (
    choices: Choice[],
    options?: {
      groupKey?: string
      missingGroupName?: string
      order?: string[]
      sortChoicesKey?: (string | boolean)[]
      recentKey?: string
      recentLimit?: number
      excludeGroups?: string[]
    }
  ) => Choice[]

  var formatChoices: (choices: Choice[], className?: string) => Choice[]

  /**
   * Preloads data for a prompt.
   * #### preload example
   * ```ts
   * await preload({
   *   name: "John",
   *   age: 40
   * })
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#preload
   */
  var preload: (scriptPath?: string) => void

  /**
   * Sets selected choices for a prompt.
   * #### setSelectedChoices example
   * ```ts
   * await setSelectedChoices(["John", "Mindy"])
   * ```
   * @see https://johnlindquist.github.io/kit-docs/#setselectedchoices
   */
  var setSelectedChoices: (choices: Choice[]) => Promise<void>
  var toggleAllSelectedChoices: () => Promise<void>
  var trace: Trace

  type Metadata = import('./core.js').Metadata
  var metadata: Metadata
}
