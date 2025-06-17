import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types"
export type { CallToolResult }
import type { Low } from 'lowdb'
import type { format, formatDistanceToNow } from '../utils/date.js'
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
// Import AI SDK specific types for global declaration
import type { CoreMessage, FinishReason, LanguageModel, LanguageModelV1 } from 'ai'
import type { AssistantOutcome, AssistantLastInteraction, ToolCallPart } from '../lib/ai.js' // Import our custom result types
import type { ZodTypeAny } from 'zod'; // Import Zod types for global declaration

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
  cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
}
export interface Env {
  (envKey: string, promptConfig?: string | EnvConfig | (() => Promise<string>)): Promise<string>
  [key: string]: any
}

export interface Args extends Array<string> { }

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

type Utils = typeof import('../core/utils.js')

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
   * [Examples](https://scriptkit.com?query=path) | [Docs](https://johnlindquist.github.io/kit-docs/#path) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=path)
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
   * [Examples](https://scriptkit.com?query=edit) | [Docs](https://johnlindquist.github.io/kit-docs/#edit) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=edit)
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
   * [Examples](https://scriptkit.com?query=browse) | [Docs](https://johnlindquist.github.io/kit-docs/#browse) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=browse)
   */
  var browse: Browse

  /**
   * Create a path relative to the kit directory.
   * #### kitpath example
   * ```ts
   * const kitLogs = kitPath("logs"); //~/.kit/logs
   * ```
   * [Examples](https://scriptkit.com?query=kitPath) | [Docs](https://johnlindquist.github.io/kit-docs/#kitPath) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=kitPath)
   */
  var kitPath: PathFn
  /**
   * Create a path relative to the "kenv" (kit environment) directory
   * #### kenvPath example
   * ```ts
   * const scriptsPath = kenvPath("scripts");
   * const scripts = await readdir(scriptsPath);
   * await editor(JSON.stringify(scripts, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=kenvPath) | [Docs](https://johnlindquist.github.io/kit-docs/#kenvPath) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=kenvPath)
   */
  var kenvPath: PathFn
  /**
   * Create a path relative to a "kit" directory in the system temp directory
   * > Note: The tmp directory is symlinked to the ~/.kenv/tmp directory for easy access
   * #### tmpPath example
   * ```ts
   * const tmpTestTxtPath = tmpPath("test.txt");
   * const content = await ensureReadFile(tmpTestTxtPath, "Hello World");
   * await editor(
   *   JSON.stringify(
   *     {
   *       tmpTestTxtPath,
   *       content,
   *     },
   *     null,
   *     2
   *   )
   * );
   * ```
   * [Examples](https://scriptkit.com?query=tmpPath) | [Docs](https://johnlindquist.github.io/kit-docs/#tmpPath) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=tmpPath)
   */
  var tmpPath: PathFn
  var kenvTmpPath: PathFn

  /**
   * Attempts to import a module.
   * #### attemptImport example
   * ```ts
   * let module = await attemptImport("lodash")
   * ```
   * [Examples](https://scriptkit.com?query=attemptImport) | [Docs](https://johnlindquist.github.io/kit-docs/#attemptImport) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=attemptImport)
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
   * [Examples](https://scriptkit.com?query=silentAttemptImport) | [Docs](https://johnlindquist.github.io/kit-docs/#silentAttemptImport) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=silentAttemptImport)
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
   * [Examples](https://scriptkit.com?query=npm) | [Docs](https://johnlindquist.github.io/kit-docs/#npm) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=npm)
   */
  var npm: KitModuleLoader
  var npmInstall: (packageName: string) => Promise<void>
  var installMissingPackage: (packageName: string) => Promise<void>
  /**
   * Run another script from the same kenv
   * #### run example
   * ```ts
   * // Assuming you have a "hello-world.ts" script next to this file
   * await run("hello-world");
   * ```
   * #### run example arg
   * ```ts
   * // Assuming the hello-world script has an: await arg("Enter your name")
   * await run("hello-world", "John");
   * ```
   * [Examples](https://scriptkit.com?query=run) | [Docs](https://johnlindquist.github.io/kit-docs/#run) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=run)
   */
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
   * [Examples](https://scriptkit.com?query=env) | [Docs](https://johnlindquist.github.io/kit-docs/#env) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=env)
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
   * #### arg actions example
   * ```ts
   * const result = await arg(
   *   "What is your name?",
   *   ["John", "Mindy", "Ben"],
   *   //   Define an Array of Actions
   *   [
   *     {
   *       name: "Submit Joy",
   *       shortcut: `${cmd}+j`,
   *       onAction: () => {
   *         submit("Joy");
   *       },
   *     },
   *   ]
   * );
   * await editor(JSON.stringify(result, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=arg) | [Docs](https://johnlindquist.github.io/kit-docs/#arg) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=arg)
   */
  var arg: Arg
  /**
   * Prompts the user to select one or more options.
   * #### select example
   * ```ts
   * // Return an array of selected items
   * const multipleChoice = await select("Select one or more developer", [
   *   "John",
   *   "Nghia",
   *   "Mindy",
   *   "Joy",
   * ]);
   * await editor(JSON.stringify(multipleChoice, null, 2));
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
   * [Examples](https://scriptkit.com?query=select) | [Docs](https://johnlindquist.github.io/kit-docs/#select) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=select)
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
   * [Examples](https://scriptkit.com?query=grid) | [Docs](https://johnlindquist.github.io/kit-docs/#grid) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=grid)
   */
  var grid: Grid
  var basePrompt: Arg
  /**
   * Same API as `arg`, but with a compact format.
   * #### mini example
   * ```ts
   * let name = await mini("Enter your name")
   * ```
   * [Examples](https://scriptkit.com?query=mini) | [Docs](https://johnlindquist.github.io/kit-docs/#mini) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=mini)
   */
  var mini: Arg
  /**
   * Same API as `arg`, but with a tiny, adorable UI.
   * #### micro example
   * ```ts
   * let name = await micro("Enter your name")
   * ```
   * [Examples](https://scriptkit.com?query=micro) | [Docs](https://johnlindquist.github.io/kit-docs/#micro) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=micro)
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
   * [Examples](https://scriptkit.com?query=onTab) | [Docs](https://johnlindquist.github.io/kit-docs/#onTab) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=onTab)
   */
  var onTab: OnTab
  var args: Args

  var updateArgs: UpdateArgs
  var argOpts: string[]

  /**
   * Wait for a number of milliseconds
   * #### wait example
   * ```ts
   * div(md(`Enjoying your wait?`));
   * await wait(1000);
   * div(md(`I waited 1 second. Let's wait some more!`));
   * await wait(1000);
   * await div(md(`All done!`));
   * ```
   * [Examples](https://scriptkit.com?query=wait) | [Docs](https://johnlindquist.github.io/kit-docs/#wait) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=wait)
   */
  var wait: Wait

  /**
   * Create a path relative to the user's home directory
   * #### home example
   * ```ts
   * const downloadsPath = home("Downloads");
   * const downloadedFileNames = await readdir(downloadsPath);
   * await editor(JSON.stringify(downloadedFileNames, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=home) | [Docs](https://johnlindquist.github.io/kit-docs/#home) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=home)
   */
  var home: PathFn
  /**
   * Check if a path is a file
   * #### isFile example
   * ```ts
   * const testingIsFileTxtPath = home("testing-isFile.txt");
   * const isTestingFile = await isFile(testingIsFileTxtPath);
   * if (!isTestingFile) {
   *   await writeFile(testingIsFileTxtPath, "Hello World");
   * }
   * const content = await readFile(testingIsFileTxtPath, "utf8");
   * await editor(content);
   * ```
   * [Examples](https://scriptkit.com?query=isFile) | [Docs](https://johnlindquist.github.io/kit-docs/#isFile) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=isFile)
   */
  var isFile: IsCheck
  /**
   * Check if a path is a directory
   * [Examples](https://scriptkit.com?query=isDir) | [Docs](https://johnlindquist.github.io/kit-docs/#isDir) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=isDir)
   */
  var isDir: IsCheck
  /**
   * Check if a path can be executed
   * [Examples](https://scriptkit.com?query=isBin) | [Docs](https://johnlindquist.github.io/kit-docs/#isBin) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=isBin)
   */
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
   * [Examples](https://scriptkit.com?query=inspect) | [Docs](https://johnlindquist.github.io/kit-docs/#inspect) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=inspect)
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
   * [Examples](https://scriptkit.com?query=db) | [Docs](https://johnlindquist.github.io/kit-docs/#db) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=db)
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
   * [Examples](https://scriptkit.com?query=store) | [Docs](https://johnlindquist.github.io/kit-docs/#store) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=store)
   */
  var store: Store

  /**
   * Manages a memory map of objects.
   * #### memoryMap example
   * ```ts
   * memoryMap.set("myKey", { myObject: true })
   * let value = memoryMap.get("myKey")
   * ```
   * [Examples](https://scriptkit.com?query=memoryMap) | [Docs](https://johnlindquist.github.io/kit-docs/#memoryMap) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=memoryMap)
   */
  var memoryMap: Map<string, any>

  var onTabIndex: number

  var selectKitEditor: SelectKitEditor

  /**
   * Get all scripts
   * #### getScripts example
   * ```ts
   * // Get all scripts from ~/.kit/db/scripts.json
   * const scripts = await getScripts();
   * const script = await arg("Select a script", scripts);
   * await editor(JSON.stringify(script, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=getScripts) | [Docs](https://johnlindquist.github.io/kit-docs/#getScripts) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=getScripts)
   */
  var getScripts: GetScripts
  /**
   * Returns focus to the previous app.
   * #### blur example
   * ```ts
   * import { URL, fileURLToPath } from "node:url";
   * await editor({
   *   onInit: async () => {
   *     const { workArea } = await getActiveScreen();
   *     const topLeft = { x: workArea.x, y: workArea.y };
   *     const size = { height: 900, width: 200 };
   *     await setBounds({
   *       ...topLeft,
   *       ...size,
   *     });
   *     await blur();
   * // get path to current file
   *     const currentScript = fileURLToPath(new URL(import.meta.url));
   *     const content = await readFile(currentScript, "utf8");
   *     const lines = content.split("\n");
   *     for await (const line of lines) {
   *       editor.append(`${line}\n`);
   *       await wait(100);
   *     }
   *   },
   * });
   * ```
   * [Examples](https://scriptkit.com?query=blur) | [Docs](https://johnlindquist.github.io/kit-docs/#blur) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=blur)
   */
  var blur: () => Promise<void>
  /**
   * A flag is almost exclusively used for the CLI, rarely with a prompt. When using a CLI script:
   * ```bash
   * my-script --debug --exclude "*.md"
   * ```
   * The flags in your script will be set as:
   * ```ts
   * flag.debug = true
   * flag.exclude = "*.md"
   * ```
   * #### flag example
   * ```ts
   * // This concept is replaced by "Actions", but you will see it in older/legacy scripts
   * const result = await arg({
   *   placeholder: "What is your name?",
   *   flags: {
   *     post: {
   *       // This will submit the prompt with the "post" flag
   *       shortcut: `${cmd}+p`,
   *     },
   *     put: {
   *       // This will submit the prompt with the "put" flag
   *       shortcut: `${cmd}+u`,
   *     },
   *     delete: {
   *       // This will submit the prompt with the "delete" flag
   *       shortcut: `${cmd}+d`,
   *     },
   *   },
   * });
   * await editor(
   *   JSON.stringify(
   *     {
   *       result,
   *       flag: global.flag, // Inspect which flag was used when submitting
   *     },
   *     null,
   *     2
   *   )
   * );
   * ```
   * [Examples](https://scriptkit.com?query=flag) | [Docs](https://johnlindquist.github.io/kit-docs/#flag) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=flag)
   */
  var flag: Flags
  var actionFlag: string
  var setFlags: FlagFn
  /**
   * Create contextual action menus for your scripts
   * 
   * `setActions` transforms an array of Action objects into an interactive menu that appears
   * in the Script Kit prompt. Actions can have keyboard shortcuts, groups, and custom callbacks.
   * 
   * @param actions - Array of Action objects to display
   * @param options - Configuration for the actions menu (name, placeholder, active state)
   * 
   * #### Basic Example
   * ```ts
   * await setActions([
   *   {
   *     name: "Copy",
   *     description: "Copy to clipboard",
   *     shortcut: "cmd+c",
   *     onAction: async () => {
   *       await clipboard.writeText(selectedText)
   *     }
   *   },
   *   {
   *     name: "Edit", 
   *     description: "Open in editor",
   *     shortcut: "cmd+e",
   *     onAction: async () => {
   *       await edit(filePath)
   *     }
   *   }
   * ])
   * ```
   * 
   * #### Grouped Actions Example
   * ```ts
   * await setActions([
   *   // File operations group
   *   { name: "New File", group: "File", shortcut: "cmd+n", onAction: createFile },
   *   { name: "Open File", group: "File", shortcut: "cmd+o", onAction: openFile },
   *   { name: "Save File", group: "File", shortcut: "cmd+s", onAction: saveFile },
   *   
   *   // Edit operations group
   *   { name: "Cut", group: "Edit", shortcut: "cmd+x", onAction: cutText },
   *   { name: "Copy", group: "Edit", shortcut: "cmd+c", onAction: copyText },
   *   { name: "Paste", group: "Edit", shortcut: "cmd+v", onAction: pasteText }
   * ], {
   *   name: "File Operations",
   *   placeholder: "Choose an action..."
   * })
   * ```
   * 
   * #### Action Properties
   * - `name` (required): Display name of the action
   * - `description`: Additional description text
   * - `shortcut`: Keyboard shortcut (e.g., "cmd+c", "alt+enter")
   * - `group`: Group name for organizing related actions
   * - `onAction`: Async function called when action is selected
   * - `visible`: Control action visibility (default: true)
   * - `flag`: Custom flag identifier
   * - `value`: Custom value passed to onAction
   * - `condition`: Function to conditionally show/hide action
   * - `close`: Whether to close the prompt after action (default: true)
   * 
   * #### How It Works
   * 1. Actions are transformed into Script Kit's flag system internally
   * 2. Each action becomes a selectable item with optional keyboard shortcut
   * 3. Actions can be filtered by typing in the actions input
   * 4. Selected action's `onAction` callback is executed
   * 5. Actions persist until explicitly changed or prompt is closed
   * 
   * #### Related Functions
   * - `openActions()`: Programmatically open the actions menu
   * - `closeActions()`: Programmatically close the actions menu
   * - `setFlags()`: Lower-level API that setActions uses internally
   * 
   * [Examples](https://scriptkit.com?query=setActions) | [Docs](https://johnlindquist.github.io/kit-docs/#setActions)
   */
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
   * [Examples](https://scriptkit.com?query=openActions) | [Docs](https://johnlindquist.github.io/kit-docs/#openActions) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=openActions)
   */
  var openActions: () => Promise<void>
  var closeActions: () => Promise<void>
  var setFlagValue: (value: any) => Promise<void>
  var prepFlags: PrepFlags

  /**
   * Allows you to build a custom script selection menu
   * #### selectScript example
   * ```ts
   * import type { Script } from "@johnlindquist/kit";
   * const script = await selectScript(
   *   "Select a Shortcut Script to Edit",
   *   true, // "true" will load from ~/.kit/db/scripts.json cache
   *   (scripts: Script[]) => scripts.filter((script) => script.shortcut)
   * );
   * await edit(script.filePath);
   * ```
   * [Examples](https://scriptkit.com?query=selectScript) | [Docs](https://johnlindquist.github.io/kit-docs/#selectScript) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=selectScript)
   */
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
   * [Examples](https://scriptkit.com?query=createGist) | [Docs](https://johnlindquist.github.io/kit-docs/#createGist) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=createGist)
   */
  var createGist: CreateGist
  var setShortcuts: SetShortcuts
  var isWin: boolean
  var isMac: boolean
  var isLinux: boolean
  var cmd: 'cmd' | 'ctrl'
  /**
   * Formats a date
   * [Examples](https://scriptkit.com?query=formatDate) | [Docs](https://johnlindquist.github.io/kit-docs/#formatDate) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=formatDate)
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
   * [Examples](https://scriptkit.com?query=setScoredChoices) | [Docs](https://johnlindquist.github.io/kit-docs/#setScoredChoices) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setScoredChoices)
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
   * [Examples](https://scriptkit.com?query=groupChoices) | [Docs](https://johnlindquist.github.io/kit-docs/#groupChoices) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=groupChoices)
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
   * [Examples](https://scriptkit.com?query=formatChoices) | [Docs](https://johnlindquist.github.io/kit-docs/#formatChoices) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=formatChoices)
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
   * [Examples](https://scriptkit.com?query=preload) | [Docs](https://johnlindquist.github.io/kit-docs/#preload) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=preload)
   */
  var preload: (scriptPath?: string) => void

  /**
   * Sets selected choices for a prompt.
   * #### setSelectedChoices example
   * ```ts
   * await setSelectedChoices(["John", "Mindy"])
   * ```
   * [Examples](https://scriptkit.com?query=setSelectedChoices) | [Docs](https://johnlindquist.github.io/kit-docs/#setSelectedChoices) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=setSelectedChoices)
   */
  var setSelectedChoices: (choices: Choice[]) => Promise<void>
  var toggleAllSelectedChoices: () => Promise<void>
  var trace: Trace

  type Metadata = import('./core.js').Metadata

  /**
   * Simple wrapper around AI SDK for text generation with system prompts.
   * Returns a function that takes user input and resolves to the AI's text response.
   * #### ai example
   * ```ts
   * const translate = ai("Translate to French")
   * const result = await translate("Hello world!")
   * // Returns: "Bonjour le monde!"
   * ```
   * To generate structured objects, use `ai.object()`.
   * [Examples](https://scriptkit.com?query=ai) | [Docs](https://johnlindquist.github.io/kit-docs/#ai) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=ai)
   */
  var ai: {
    (systemPrompt: string, options?: {
      model?: string | LanguageModelV1
      temperature?: number
      maxTokens?: number
    }): (input: string) => Promise<string>;

    /**
     * Generates a structured JavaScript object based on a Zod schema and a prompt.
     * #### ai.object example
     * ```ts
     * import { z } from 'zod';
     * const sentimentSchema = z.object({
     *   sentiment: z.enum(['positive', 'neutral', 'negative']),
     *   confidence: z.number().min(0).max(1)
     * });
     * 
     * const result = await ai.object(
     *   "Analyze the sentiment of this text: 'I love programming!'", 
     *   sentimentSchema
     * );
     * // result will be { sentiment: 'positive', confidence: ... }
     * ```
     * [Examples](https://scriptkit.com?query=ai.object) | [Docs](https://johnlindquist.github.io/kit-docs/#ai.object) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=ai.object)
     */
    object: <Schema extends ZodTypeAny>(
      promptOrMessages: string | CoreMessage[],
      schema: Schema,
      options?: {
        model?: string | LanguageModelV1
        temperature?: number
        maxTokens?: number
        // Other generateObject-specific options could be added here
      }
    ) => Promise<z.infer<Schema>>;
  }

  /**
   * Create an AI assistant that maintains conversation context and history,
   * supports tool calling, and provides detailed interaction results.
   * #### assistant example
   * ```ts
   * const chatbot = assistant("You are a helpful assistant", {
   *   tools: {
   *     getCurrentWeather: {
   *       description: "Get the current weather for a location",
   *       parameters: z.object({ location: z.string() }),
   *       execute: async ({ location }) => ({ temperature: "..." })
   *     }
   *   }
   * })
   * 
   * chatbot.addUserMessage("What's the weather in London?")
   * 
   * // Using generate for full response including tool calls
   * const result = await chatbot.generate()
   * if (result.toolCalls && result.toolCalls.length > 0) {
   *   // ... handle tool calls ...
   *   for (const toolCall of result.toolCalls) {
   *      // ... execute tool ...
   *      chatbot.addMessage({ 
   *          role: 'tool', 
   *          toolCallId: toolCall.toolCallId, 
   *          toolName: toolCall.toolName, 
   *          content: JSON.stringify({temperature: "15C"})
   *      });
   *   }
   *   const finalResult = await chatbot.generate(); // Get response after tool execution
   *   console.log(finalResult.text);
   * }
   * 
   * // Or stream text and check lastInteraction for tool calls
   * for await (const chunk of chatbot.textStream) {
   *   process.stdout.write(chunk)
   * }
   * if (chatbot.lastInteraction?.toolCalls) {
   *   // ... handle tool calls as above ...
   *   chatbot.addMessage(...); // add tool results
   *   for await (const chunk of chatbot.textStream) { // stream again
   *      process.stdout.write(chunk)
   *   }
   * }
   * 
   * // Access conversation history (now CoreMessage[])
   * for (const message of chatbot.messages) {
   *   console.log(`${message.role}: ${JSON.stringify(message.content)}`)
   * }
   * ```
   */
  var assistant: (systemPrompt: string, options?: {
    model?: string | LanguageModelV1
    temperature?: number
    maxTokens?: number
    tools?: Record<string, Tool<any, any>>
    maxSteps?: number
    autoExecuteTools?: boolean
    maxHistory?: number
  }) => {
    addUserMessage: (content: string | any[]) => void
    addSystemMessage: (content: string) => void
    addAssistantMessage: (text?: string, options?: { toolCalls?: ToolCallPart[]; parts?: CoreMessage['content'] }) => void
    addMessage: (message: CoreMessage) => void
    textStream: AsyncGenerator<string, void, unknown>
    stop: () => void
    generate: (abortSignal?: AbortSignal) => Promise<AssistantOutcome>
    messages: CoreMessage[]
    lastInteraction?: AssistantLastInteraction | null
    get autoExecuteTools(): boolean
    set autoExecuteTools(value: boolean)
    get maxHistory(): number
  }

  /**
   * Generates a structured JavaScript object based on a Zod schema and a prompt.
   * This is the standalone version of ai.object() available as a global function.
   * #### generate example
   * ```ts
   * import { z } from 'zod';
   * const sentimentSchema = z.object({
   *   sentiment: z.enum(['positive', 'neutral', 'negative']),
   *   confidence: z.number().min(0).max(1)
   * });
   * 
   * const result = await generate(
   *   "Analyze the sentiment of this text: 'I love programming!'", 
   *   sentimentSchema
   * );
   * // result will be { sentiment: 'positive', confidence: ... }
   * ```
   * [Examples](https://scriptkit.com?query=generate) | [Docs](https://johnlindquist.github.io/kit-docs/#generate) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=generate)
   */
  var generate: <Schema extends ZodTypeAny>(
    promptOrMessages: string | CoreMessage[],
    schema: Schema,
    options?: {
      model?: string | LanguageModelV1
      temperature?: number
      maxTokens?: number
    }
  ) => Promise<z.infer<Schema>>

  /**
   * The `metadata` object can include:
   * - `name`: Display name in Script Kit UI (defaults to filename)
   * - `author`: Creator's name
   * - `description`: Brief script summary (supports multiline with template literals)
   * - `enter`: Text shown on Enter button
   * - `alias`: Alternative search term
   * - `image`: Path to script icon
   * - `shortcut`: Global keyboard shortcut (must follow the pattern: modifiers+key, e.g., "cmd+opt+4", "ctrl+shift+a")
   *   - Valid modifiers: cmd/command, ctrl/control, opt/option/alt, shift
   *   - Modifiers must be separated by space or +
   *   - Example valid shortcuts: "cmd+shift+a", "ctrl alt x", "option+cmd+shift+1"
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
   * - `system`: Trigger on system events (sleep/wake/etc)
   * - `schedule`: Cron expression for timing
   * - `access`: REST API access level (public/key/private)
   * - `response`: Allow REST API response
   * - `index`: Order within group
   * 
   * **Important**: All string properties must be static string literals. Variables or expressions
   * (e.g., `${someVar}`) are not supported because metadata is parsed statically from the AST.
   * Use plain strings or template literals without expressions for multiline content.
   * 
   * #### metadata example
   * ```ts
   * metadata = {
   *   name: "Metadata Example",
   *   description: `This is a multiline description
   * that spans multiple lines
   * for better formatting`,
   *   author: "John Lindquist",
   *   shortcut: "cmd+shift+e",
   * };
   * ```
   * [Examples](https://scriptkit.com?query=metadata) | [Docs](https://johnlindquist.github.io/kit-docs/#metadata) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=metadata)
   */
  var metadata: Metadata

  /**
   * Zod schema validation library. Create and validate data schemas.
   * #### z example
   * ```ts
   * const UserSchema = z.object({
   *   name: z.string(),
   *   age: z.number().min(18)
   * });
   * 
   * const user = UserSchema.parse({ name: "John", age: 25 });
   * ```
   * [Examples](https://scriptkit.com?query=z) | [Docs](https://johnlindquist.github.io/kit-docs/#z) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=z)
   */
  var z: typeof import('zod').z

  /**
 * Type for MCP (Model Context Protocol) tool results
 * @example
 * ```ts
 * // Name: My MCP Tool
 * // Description: A tool that returns structured data
 * // mcp: my-tool
 * 
 * import "@johnlindquist/kit"
 * 
 * const result: MCPToolResult = {
 *   content: [{
 *     type: 'text',
 *     text: 'Hello from MCP tool!'
 *   }]
 * }
 * 
 * export default result
 * ```
 */
  type MCPToolResult = typeof CallToolResult

  /**
   * Define parameters for a script that can be used via MCP, CLI, or Script Kit UI
   * Returns the parameters when called, similar to arg() but with structured schema
   * @example
   * ```ts
   * // --- Simple shorthand schema ---
   * const { name } = await params({
   *   name: "Your name"
   * })
   *
   * // --- Full JSON-Schema style ---
   * const { operation, a, b } = await params({
   *   type: "object",
   *   properties: {
   *     operation: {
   *       type: "string",
   *       enum: ["add", "subtract", "multiply", "divide"],
   *       description: "The operation to perform"
   *     },
   *     a: { type: "number", description: "First number" },
   *     b: { type: "number", description: "Second number" }
   *   },
   *   required: ["operation", "a", "b"]
   * })
   *
   * const result = operation === "add" ? a + b : a - b
   * await sendResponse({ result })
   * ```
   */
  var params: typeof import('../api/params.js').params
}
