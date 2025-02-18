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
  path: PathSelector
  db: DB

  wait: Wait

  checkProcess: (processId: number) => string

  home: PathFn
  isFile: IsCheck
  isDir: IsCheck
  isBin: IsCheck
  createPathResolver: PathResolver
  arg: Arg
  select: Select
  mini: Arg
  micro: Arg
  env: Env
  argOpts: string[]

  kitPath: PathFn
  kenvPath: PathFn
  tmpPath: PathFn
  kenvTmpPath: PathFn

  inspect: Inspect

  onTab: OnTab
  onExit: OnExit

  attemptImport: KitModuleLoader
  silentAttemptImport: KitModuleLoader
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
   * #### path example startpath
   * ```ts
   * const projectPath = await path({
   *   startPath: home("dev"),
   *   hint: "Select a project from your dev folder",
   * });
   * await editor(projectPath);
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#path) | [Examples](https://scriptkit.com?query=path)
   */
  var path: PathSelector
  /**
   * Open a file using the KIT_EDITOR env variable
   * (For example, set KIT_EDITOR=/usr/local/bin/cursor)
   * #### edit example
   * ```ts
   * const zshrcPath = home(".zshrc");
   * await edit(zshrcPath);
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#edit) | [Examples](https://scriptkit.com?query=edit)
   */
  var edit: Edit
  /**
   * Open a URL in the default browser.
   * #### browse example
   * ```ts
   * // When executing a command without UI, "hide" allows you to instantly hide the UI rather than waiting for the command to finish
   * await hide();
   * await browse("https://scriptkit.com");
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#browse) | [Examples](https://scriptkit.com?query=browse)
   */
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
    [Docs](https://johnlindquist.github.io/kit-docs/#attemptImport) | [Examples](https://scriptkit.com?query=attemptImport)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#silentAttemptImport) | [Examples](https://scriptkit.com?query=silentAttemptImport)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#npm) | [Examples](https://scriptkit.com?query=npm)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#env) | [Examples](https://scriptkit.com?query=env)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#arg) | [Examples](https://scriptkit.com?query=arg)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#select) | [Examples](https://scriptkit.com?query=select)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#grid) | [Examples](https://scriptkit.com?query=grid)
   */
  var grid: Grid
  var basePrompt: Arg
  /**
   * Prompts the user for input in a compact format.
   * #### mini example
   * ```ts
   * let name = await mini("Enter your name")
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#mini) | [Examples](https://scriptkit.com?query=mini)
   */
  var mini: Arg
  /**
   * Prompts the user for input in a tiny, adorable format.
   * #### micro example
   * ```ts
   * let name = await micro("Enter your name")
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#micro) | [Examples](https://scriptkit.com?query=micro)
   */
  var micro: Arg
  /**
   * onTab allows you to build a menu where prompts are organized under a tab. Press Tab/Shift+Tab to navigate between prompts.
   * #### onTab example
   * ```ts
   * onTab("People", async (event) => {
   *   await arg("Select a person", ["John", "Mindy", "Ben"]);
   * });
   * onTab("Animals", async (event) => {
   *   await arg("Select an animal", ["Dog", "Cat", "Bird"]);
   * });
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#onTab) | [Examples](https://scriptkit.com?query=onTab)
   */
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
    [Docs](https://johnlindquist.github.io/kit-docs/#inspect) | [Examples](https://scriptkit.com?query=inspect)
   */
  var inspect: Inspect

  /**
   * An extremely simple database that persists to a file.
   * #### db hello world
   * ```ts
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
   * // Pass in a function to generate data for the db
   * // Because this script is named "db-basic.js"
   * // The database is found at "~/.kenv/db/_db-basic.json"
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
    [Docs](https://johnlindquist.github.io/kit-docs/#db) | [Examples](https://scriptkit.com?query=db)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#store) | [Examples](https://scriptkit.com?query=store)
   */
  var store: Store

  /**
   * Manages a memory map of objects.
   * #### memoryMap example
   * ```ts
   * memoryMap.set("myKey", { myObject: true })
   * let value = memoryMap.get("myKey")
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#memoryMap) | [Examples](https://scriptkit.com?query=memoryMap)
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
  /**
   * Manually open the actions menu
   * #### openactions example
   * ```ts
   * await arg(
   *   {
   *     onInit: async () => {
   *       // Automatically open the actions menu
   *       openActions();
   *     },
   *   },
   *   ["John", "Mindy"],
   *   [
   *     {
   *       name: "Submit Ben Instead",
   *       onAction: async (name) => {
   *         submit("Ben");
   *       },
   *     },
   *   ]
   * );
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#openActions) | [Examples](https://scriptkit.com?query=openActions)
   */
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
    [Docs](https://johnlindquist.github.io/kit-docs/#createGist) | [Examples](https://scriptkit.com?query=createGist)
   */
  var createGist: CreateGist
  var setShortcuts: SetShortcuts
  var isWin: boolean
  var isMac: boolean
  var isLinux: boolean
  var cmd: 'cmd' | 'ctrl'
  /**
   * Formats a date
    [Docs](https://johnlindquist.github.io/kit-docs/#formatDate) | [Examples](https://scriptkit.com?query=formatDate)
   */
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
    [Docs](https://johnlindquist.github.io/kit-docs/#setScoredChoices) | [Examples](https://scriptkit.com?query=setScoredChoices)
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
    [Docs](https://johnlindquist.github.io/kit-docs/#groupChoices) | [Examples](https://scriptkit.com?query=groupChoices)
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

  /**
   * Formats an array of choices.
   * - If a choice is not an object, it is converted to a basic choice object.
   * - If a choice has a nested `choices` array (i.e. represents a group), then:
   *    1. The group header is formatted (its `group` property is preserved if already set, or defaulted to its name).
   *    2. Its sub-choices are formatted in their original order.
   *    3. After processing the sub‑choices, any items with an `index` property are re‑inserted at the appropriate positions.
   * - For top‑level non-group items, if every item is non‑group, then we re‑insert the indexed items in the final array.
   * Parameters:
   * - `choices`: An array of choices or simple values
   * - `className`: An optional default className
   * Returns the formatted array of choices.
   * #### formatchoices example
   * ```ts
   * const people = [
   *   {
   *     name: "Utah",
   *     choices: ["John", "Mindy"],
   *   },
   *   {
   *     name: "Alaska",
   *     choices: ["Beth"],
   *   },
   * ];
   * const choices = formatChoices(people);
   * await arg("Select a person from their group", choices);
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#formatChoices) | [Examples](https://scriptkit.com?query=formatChoices)
   */
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
    [Docs](https://johnlindquist.github.io/kit-docs/#preload) | [Examples](https://scriptkit.com?query=preload)
   */
  var preload: (scriptPath?: string) => void

  /**
   * Sets selected choices for a prompt.
   * #### setSelectedChoices example
   * ```ts
   * await setSelectedChoices(["John", "Mindy"])
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#setSelectedChoices) | [Examples](https://scriptkit.com?query=setSelectedChoices)
   */
  var setSelectedChoices: (choices: Choice[]) => Promise<void>
  var toggleAllSelectedChoices: () => Promise<void>
  var trace: Trace

  type Metadata = import('./core.js').Metadata
  /**
   * Define additional information and capabilities for your script:
   * The `metadata` object can include:
   * - `author`: Creator's name
   * - `name`: Display name in Script Kit UI (defaults to filename)
   * - `description`: Brief script summary
   * - `enter`: Text shown on Enter button
   * - `alias`: Alternative search term
   * - `image`: Path to script icon
   * - `shortcut`: Global keyboard shortcut
   * - `shortcode`: Execute when typed + space in menu
   * - `trigger`: Execute when typed in menu
   * - `expand`: Text expansion trigger (replaces deprecated `snippet`)
   * - `keyword`: Search keyword for menu
   * - `pass`: Pass menu input as arg (true/string/RegExp)
   * - `group`: Menu organization category
   * - `exclude`: Hide from menu
   * - `watch`: File/dir to watch for changes
   * - `log`: Disable logging if false
   * - `background`: Run as background process
   * - `timeout`: Auto-terminate after seconds
   * - `system`: Trigger on system events (sleep/wake/etc)
   * - `schedule`: Cron expression for timing
   * - `access`: REST API access level (public/key/private)
   * - `response`: Allow REST API response
   * - `index`: Order within group
   * #### metadata example
   * ```ts
   * metadata = {
   *   name: "Metadata Example",
   *   description: "This is an example of how to use metadata in a script",
   *   author: "John Lindquist",
   * };
   * ```
    [Docs](https://johnlindquist.github.io/kit-docs/#metadata) | [Examples](https://scriptkit.com?query=metadata)
   */
  var metadata: Metadata
}
