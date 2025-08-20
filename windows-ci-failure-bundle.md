This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: .github/workflows/release.yml, package.json, test/ava.config.mjs, test-sdk/ava.config.js, test-sdk/main.test.js, test-sdk/config.js, scripts/test-pre.js, scripts/test-post.js, src/globals/child_process.ts, src/globals/fs-extra.js, src/api/global.js, src/api/kit.js, src/api/lib.js, src/platform/base.js, src/platform/win32.js, src/core/utils.ts, src/core/enum.ts, build/build-ci.js, src/core/sourcemap-formatter.ts, src/core/sourcemap-formatter.test.ts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.github/
  workflows/
    release.yml
scripts/
  test-post.js
  test-pre.js
src/
  core/
    enum.ts
    sourcemap-formatter.test.ts
    sourcemap-formatter.ts
    utils.ts
  globals/
    child_process.ts
test/
  ava.config.mjs
test-sdk/
  ava.config.js
  config.js
  main.test.js
package.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="scripts/test-post.js">
import { rimraf } from "rimraf"

await import("../test-sdk/config.js")

if (test("-d", kitMockPath())) {
	await rimraf(kitMockPath())
}

process.env.KENV = home(".kenv")
await exec(`kit ${kitPath("cli", "refresh-scripts-db.js")}`)
</file>

<file path="src/globals/child_process.ts">
import child_process from "node:child_process"

export let spawn = (global.spawn = child_process.spawn)
export let spawnSync = (global.spawnSync = child_process.spawnSync)
export let fork = (global.fork = child_process.fork)
</file>

<file path="test/ava.config.mjs">
export default {
  workerThreads: false,
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: ["src/**/*.test.ts", "test/**/*.test.ts"],
}
</file>

<file path="test-sdk/config.js">
import path from "node:path"
import os from "node:os"
import { pathToFileURL } from "node:url"

process.env.KIT = process.env.KIT || path.resolve(os.homedir(), ".kit")

let importKit = async (...parts) => {
	let partsPath = path.resolve(process.env.KIT, ...parts)
	await import(pathToFileURL(partsPath).href)
}

await importKit("api/global.js")
await importKit("api/kit.js")
await importKit("api/lib.js")
await importKit("target/terminal.js")
await importKit("platform/base.js")

let platform = os.platform()
try {
	await importKit(`platform/${platform}.js`)
} catch (error) {
	// console.log(`No ./platform/${platform}.js`)
}

export let kitMockPath = (...parts) =>
	path.resolve(home(".kit-mock-path"), ...parts)

export let kenvTestPath = kitMockPath(".kenv-test")
export let kenvSetupPath = kitMockPath(".kenv-setup")

process.env.KENV = kenvTestPath

/** @type {import("../src/core/utils.js")} */
let { KIT_APP, KIT_APP_PROMPT, KIT_FIRST_PATH } = await import(
	pathToFileURL(path.resolve(`${process.env.KIT}`, "core", "utils.js")).href
)
/** @type {import("../src/core/enum.js")} */
let { Channel } = await import(
	pathToFileURL(path.resolve(`${process.env.KIT}`, "core", "enum.js")).href
)

process.env.PATH = KIT_FIRST_PATH

let execOptions = {
	env: {
		PATH: KIT_FIRST_PATH
	}
}
global.kenvTestPath = kenvTestPath
global.kenvSetupPath = kenvSetupPath
global.kitMockPath = kitMockPath
global.execOptions = execOptions

let testScript = async (name, content, type = "js") => {
	await exec(`kit new ${name} main --no-edit`, {
		env: {
			...process.env,
			KIT_NODE_PATH: process.execPath,
			KIT_MODE: type
		}
	})

	let scriptPath = kenvPath("scripts", `${name}.js`)
	await appendFile(scriptPath, content)

	let { stdout, stderr } = await exec(`${kenvPath("bin", name)} --trust`)

	return { stdout, stderr, scriptPath }
}

global.testScript = testScript

export { Channel, KIT_APP, KIT_APP_PROMPT, testScript }
</file>

<file path="test-sdk/ava.config.js">
export default {
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: [
    "src/**/*.test.js",
    "test/**/*.test.js",
  ],
}
</file>

<file path="src/core/sourcemap-formatter.test.ts">
import ava from 'ava'
import { SourcemapErrorFormatter } from './sourcemap-formatter.js'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

ava('formatError should parse basic error stack', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:1)
    at Module._compile (node:internal/modules/cjs/loader:1000:10)`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.message, 'Test error')
  t.is(result.name, 'Error')
  t.is(result.frames.length, 3)
  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
  t.is(result.frames[0].function, 'testFunction')
})

ava('formatError should handle file:// URLs', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at file:///Users/test/script.js:5:10
    at file://C:/Users/test/script.js:10:20`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames.length, 2)
  
  // First frame - Unix style
  if (os.platform() === 'win32') {
    t.is(result.frames[0].file, '\\Users\\test\\script.js')
  } else {
    t.is(result.frames[0].file, '/Users/test/script.js')
  }
  
  // Second frame - Windows style
  if (os.platform() === 'win32') {
    t.is(result.frames[1].file, 'C:\\Users\\test\\script.js')
  } else {
    t.is(result.frames[1].file, 'C:/Users/test/script.js')
  }
})

ava('formatError should remove query parameters', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at file:///path/to/file.js?uuid=12345:10:5`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
})

ava('formatError should skip node_modules by default', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)
    at internal/process (/internal/process/task_queues.js:95:5)
    at anotherUserFunction (/app/src/utils.js:20:15)`

  const result = SourcemapErrorFormatter.formatError(error)
  const formatted = result.stack.split('\n')

  // Should include error message and two user functions only
  t.is(formatted.length, 3)
  t.true(formatted[1].includes('userFunction'))
  t.true(formatted[2].includes('anotherUserFunction'))
  t.false(result.stack.includes('node_modules'))
  t.false(result.stack.includes('internal/process'))
})

ava('formatError should include all frames with KIT_ERROR_VERBOSE', (t) => {
  const originalVerbose = process.env.KIT_ERROR_VERBOSE
  process.env.KIT_ERROR_VERBOSE = 'true'

  const error = new Error('Test error')
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)`

  const result = SourcemapErrorFormatter.formatError(error)

  t.true(result.stack.includes('node_modules'))

  // Restore original value
  if (originalVerbose === undefined) {
    delete process.env.KIT_ERROR_VERBOSE
  } else {
    process.env.KIT_ERROR_VERBOSE = originalVerbose
  }
})

ava('extractErrorLocation should return first relevant frame', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at internal/modules (/node:internal/modules/cjs/loader:1000:10)
    at userFunction (${__filename}:10:5)
    at anotherFunction (/nonexistent/file.js:20:15)`

  const location = SourcemapErrorFormatter.extractErrorLocation(error)

  t.not(location, null)
  t.is(location?.file, __filename)
  t.is(location?.line, 10)
  t.is(location?.column, 5)
})

ava('resolveFilePath should handle various path formats', (t) => {
  // Test absolute path
  const resolved = SourcemapErrorFormatter.resolveFilePath(__filename)
  t.is(resolved, __filename)

  // Test file:// URL
  const fileUrl = `file://${__filename}`
  const resolvedUrl = SourcemapErrorFormatter.resolveFilePath(fileUrl)
  t.is(resolvedUrl, __filename)

  // Test non-existent file
  const nonExistent = SourcemapErrorFormatter.resolveFilePath('/nonexistent/file.js')
  t.is(nonExistent, null)
})

ava('resolveFilePath should try TypeScript extensions', (t) => {
  // This test assumes the test file exists as .ts
  const jsPath = __filename.replace(/\.ts$/, '.js')
  const resolved = SourcemapErrorFormatter.resolveFilePath(jsPath)
  
  // Should find the .ts version
  t.is(resolved, __filename)
})
</file>

<file path="scripts/test-pre.js">
/** @type {import("/Users/johnlindquist/.kit")} */

import { pathToFileURL } from "node:url"
import { rimraf } from "rimraf"

async function importRelativePath(relativePath) {
	const path = await import("node:path")
	const { fileURLToPath, pathToFileURL } = await import("node:url")
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const absolutePath = path.join(__dirname, relativePath)
	const fileURL = pathToFileURL(absolutePath).href
	return import(fileURL)
}

await importRelativePath("../test-sdk/config.js")
console.log({ kenvTestPath })

let escapePathPeriods = (p) => p.replace(/\./g, "\\.")

let userKenv = (...parts) => {
	return pathToFileURL(home(".kenv", ...parts.filter(Boolean))).href
}
let userBinPath = userKenv("bin")
if (await isDir(userBinPath)) {
	let staleMocks = userKenv("bin", "mock*")
	console.log(`Removing stale mocks: ${staleMocks}`)
	await rimraf(escapePathPeriods(staleMocks))
}

if (await isDir(kitMockPath())) {
	await rimraf(escapePathPeriods(kitMockPath()))
}

if (await isDir(kenvTestPath)) {
	console.log(`Clearing ${kenvTestPath}`)
	await rimraf(escapePathPeriods(kenvTestPath))
}

let { stdout: branch, stderr } = await exec("git branch --show-current")

if (stderr || !branch.match(/main|beta|alpha|next/)) exit(1)

branch = branch.trim()
let repo = `johnlindquist/kenv#${branch}`

console.log(`Cloning ${repo} to ${kenvTestPath}`)

await degit(repo, {
	force: true
}).clone(kenvTestPath)

console.log(`Cloning ${repo} to ${kenvSetupPath}`)

await degit(repo, {
	force: true
}).clone(kenvSetupPath)

console.log({ kitPath: kitPath() })

process.env.KENV = kenvTestPath

console.log({ kitPath: kitPath() })
await rimraf(escapePathPeriods(kitPath("db", "scripts.json")))
const { stdout: setupStdout, stderr: setupStderr } = await exec(
	`kit "${kitPath("setup", "setup.js")}" --no-edit`
)
console.log({ setupStdout })
if (setupStderr) {
	console.log({ setupStderr })
	exit(1)
}
// console.log(
//   await readFile(kenvPath("package.json"), "utf-8")
// )
const { stdout: refreshScriptsDbStdout, stderr: refreshScriptsDbStderr } =
	await exec(`kit "${kitPath("cli", "refresh-scripts-db.js")}"`)
console.log({ refreshScriptsDbStdout })
if (refreshScriptsDbStderr) {
	console.log({ refreshScriptsDbStderr })
	exit(1)
}

export {}
</file>

<file path="src/core/enum.ts">
export enum Env {
  REMOVE = '__KIT_REMOVE_ENV_VAR__'
}

export enum MainMenuType {
  SCRIPT = 'SCRIPT',
  APP = 'APP',
  SCRIPTLET = 'SCRIPTLET',
  SNIPPET = 'SNIPPET'
}

export enum Mode {
  FILTER = 'FILTER',
  GENERATE = 'GENERATE',
  HOTKEY = 'HOTKEY',
  MANUAL = 'MANUAL',
  CUSTOM = 'CUSTOM'
}

export enum Channel {
  RESPONSE = 'RESPONSE',
  ABANDON = 'ABANDON',
  APP_CONFIG = 'APP_CONFIG',
  APP_DB = 'APP_DB',
  AUDIO_ENDED = 'AUDIO_ENDED',
  AUDIO_DATA = 'AUDIO_DATA',
  CHOICE_FOCUSED = 'CHOICE_FOCUSED',
  CLEAR_CACHE = 'CLEAR_CACHE',
  CLEAR_PROMPT_CACHE = 'CLEAR_PROMPT_CACHE',
  CLEAR_PREVIEW = 'CLEAR_PREVIEW',
  CLIPBOARD_SYNC_HISTORY = 'CLIPBOARD_SYNC_HISTORY',
  CONSOLE_CLEAR = 'CONSOLE_CLEAR',
  CONSOLE_LOG = 'CONSOLE_LOG',
  CONSOLE_INFO = 'CONSOLE_INFO',
  CONSOLE_WARN = 'CONSOLE_WARN',
  CONSOLE_ERROR = 'CONSOLE_ERROR',
  CONTENT_HEIGHT_UPDATED = 'CONTENT_HEIGHT_UPDATED',
  CONTENT_SIZE_UPDATED = 'CONTENT_SIZE_UPDATED',
  COPY_PATH_AS_PICTURE = 'COPY_PATH_AS_PICTURE',
  CREATE_KENV = 'CREATE_KENV',
  SET_TRAY = 'SET_TRAY',
  ENV_CHANGED = 'ENV_CHANGED',
  ENV_UPDATED = 'ENV_UPDATED',
  CACHE_ENV_VAR = 'CACHE_ENV_VAR',
  DEV_TOOLS = 'DEV_TOOLS',
  ESCAPE_PRESSED = 'ESCAPE_PRESSED',
  EXIT = 'EXIT',
  FLAG_INPUT = 'FLAG_INPUT',
  FLAG_SUBMITTED = 'FLAG_SUBMITTED',
  GENERATE_CHOICES = 'GENERATE_CHOICES',
  GET_BACKGROUND = 'GET_BACKGROUND',
  GET_BOUNDS = 'GET_BOUNDS',
  GET_EDITOR_HISTORY = 'GET_EDITOR_HISTORY',
  GET_CLIPBOARD_HISTORY = 'GET_CLIPBOARD_HISTORY',
  GET_MOUSE = 'GET_MOUSE',
  GET_PROCESSES = 'GET_PROCESSES',
  GET_PROMPTS = 'GET_PROMPTS',
  GET_SCHEDULE = 'GET_SCHEDULE',
  GET_SCREEN_INFO = 'GET_SCREEN_INFO',
  GET_SCRIPTS_STATE = 'GET_SCRIPTS_STATE',
  GET_SERVER_STATE = 'GET_SERVER_STATE',
  GROW_PROMPT = 'GROW_PROMPT',
  HIDE_APP = 'HIDE_APP',
  KEYBOARD_CONFIG = 'KEYBOARD_CONFIG',
  KEYBOARD_TYPE = 'KEYBOARD_TYPE',
  KEYBOARD_PRESS_KEY = 'KEYBOARD_PRESS_KEY',
  KEYBOARD_RELEASE_KEY = 'KEYBOARD_RELEASE_KEY',
  KEYBOARD_COPY = 'KEYBOARD_COPY',
  KEYBOARD_PASTE = 'KEYBOARD_PASTE',
  KEYBOARD_CUT = 'KEYBOARD_CUT',
  KEYBOARD_SELECT_ALL = 'KEYBOARD_SELECT_ALL',
  KEYBOARD_UNDO = 'KEYBOARD_UNDO',
  KEYWORD_TRIGGERED = 'KEYWORD_TRIGGERED',
  KIT_LOG = 'KIT_LOG',
  KIT_CLEAR = 'KIT_CLEAR',
  KIT_PASTE = 'KIT_PASTE',
  KIT_WARN = 'KIT_WARN',
  NEEDS_RESTART = 'NEEDS_RESTART',
  OPEN_KIT_LOG = 'OPEN_KIT_LOG',
  OPEN_DEV_TOOLS = 'OPEN_DEV_TOOLS',
  OPEN_MENU = 'OPEN_MENU',
  BLUR = 'BLUR',
  PROMPT_BOUNDS_UPDATED = 'PROMPT_BOUNDS_UPDATED',
  PROMPT_ERROR = 'PROMPT_ERROR',
  QUIT_APP = 'QUIT_APP',
  RESET_PROMPT = 'RESET_PROMPT',
  REMOVE_CLIPBOARD_HISTORY_ITEM = 'REMOVE_CLIPBOARD_HISTORY_ITEM',
  RUN_SCRIPT = 'RUN_SCRIPT',
  SCRIPTS_CHANGED = 'SCRIPTS_CHANGED',
  SELECTED = 'SELECTED',
  SEND_RESPONSE = 'SEND_RESPONSE',
  SEND_KEYSTROKE = 'SEND_KEYSTROKE',
  SET_CONFIG = 'SET_CONFIG',
  SET_BOUNDS = 'SET_BOUNDS',
  SET_CHOICES = 'SET_CHOICES',
  SET_SELECTED_CHOICES = 'SET_SELECTED_CHOICES',
  SET_DARK = 'SET_DARK',
  SET_DESCRIPTION = 'SET_DESCRIPTION',
  SET_EDITOR_CONFIG = 'SET_EDITOR_CONFIG',
  SET_FLAGS = 'SET_FLAGS',
  SET_ACTIONS_CONFIG = 'SET_ACTIONS_CONFIG',
  SET_FIELDS = 'SET_FIELDS',
  SET_FILTER_INPUT = 'SET_FILTER_INPUT',
  SET_FOCUSED = 'SET_FOCUSED',
  SET_FOOTER = 'SET_FOOTER',
  SET_FORM_HTML = 'SET_FORM_HTML',
  SET_HINT = 'SET_HINT',
  SET_KIT_STATE = 'SET_KIT_STATE',
  SET_IGNORE_BLUR = 'SET_IGNORE_BLUR',
  SET_INPUT = 'SET_INPUT',
  GET_INPUT = 'GET_INPUT',
  SET_LOADING = 'SET_LOADING',
  SET_LOG = 'SET_LOG',
  SET_LOGO = 'SET_LOGO',
  SET_NAME = 'SET_NAME',
  SET_MAIN_HEIGHT = 'SET_MAIN_HEIGHT',
  SET_MAX_HEIGHT = 'SET_MAX_HEIGHT',
  SET_OPEN = 'SET_OPEN',
  SET_PANEL = 'SET_PANEL',
  SET_PID = 'SET_PID',
  SET_PLACEHOLDER = 'SET_PLACEHOLDER',
  SET_PREVIEW = 'SET_PREVIEW',
  SET_PREVIEW_ENABLED = 'SET_PREVIEW_ENABLED',
  SET_PROMPT_BLURRED = 'SET_PROMPT_BLURRED',
  SET_PROMPT_BOUNDS = 'SET_PROMPT_BOUNDS',
  SET_PROMPT_DATA = 'SET_PROMPT_DATA',
  SET_PROMPT_PROP = 'SET_PROMPT_PROP',
  SET_READY = 'SET_READY',
  SET_RESIZE = 'SET_RESIZE',
  SET_RESIZING = 'SET_RESIZING',
  SET_SCRIPT = 'SET_SCRIPT',
  SET_SCRIPT_HISTORY = 'SET_SCRIPT_HISTORY',
  SET_SHORTCUTS = 'SET_SHORTCUTS',
  SET_SHORTCODES = 'SET_SHORTCODES',
  SET_SPLASH_BODY = 'SET_SPLASH_BODY',
  SET_SPLASH_HEADER = 'SET_SPLASH_HEADER',
  SET_SPLASH_PROGRESS = 'SET_SPLASH_PROGRESS',
  SET_STATUS = 'SET_STATUS',
  SET_SUBMIT_VALUE = 'SET_SUBMIT_VALUE',
  SET_INVALIDATE_CHOICE_INPUTS = 'SET_INVALIDATE_CHOICE_INPUTS',
  SET_TAB_INDEX = 'SET_TAB_INDEX',
  SET_TEXTAREA_CONFIG = 'SET_TEXTAREA_CONFIG',
  SET_TEXTAREA_VALUE = 'SET_TEXTAREA_VALUE',
  SET_THEME = 'SET_THEME',
  SET_TOP_HEIGHT = 'SET_TOP_HEIGHT',
  SET_UNFILTERED_CHOICES = 'SET_UNFILTERED_CHOICES',
  SET_CHOICES_CONFIG = 'SET_CHOICES_CONFIG',
  SET_VALUE = 'SET_VALUE',
  SHEBANG = 'SHEBANG',
  START = 'START',
  SHOW = 'SHOW',
  SHOW_IMAGE = 'SHOW_IMAGE',
  SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',
  SHOW_TEXT = 'SHOW_TEXT',
  SHRINK_PROMPT = 'SHRINK_PROMPT',
  SWITCH_KENV = 'SWITCH_KENV',
  TAB_CHANGED = 'TAB_CHANGED',
  TERMINAL = 'TERMINAL',
  TOAST = 'TOAST',
  TOGGLE_ALL_SELECTED_CHOICES = 'TOGGLE_ALL_SELECTED_CHOICES',
  TOGGLE_BACKGROUND = 'TOGGLE_BACKGROUND',
  SET_SEARCH_DEBOUNCE = 'SET_SEARCH_DEBOUNCE',
  TOGGLE_TRAY = 'TOGGLE_TRAY',
  UPDATE_APP = 'UPDATE_APP',
  UPDATE_PROMPT_WARN = 'UPDATE_PROMPT_WARN',
  USER_RESIZED = 'USER_RESIZED',
  VALUE_SUBMITTED = 'VALUE_SUBMITTED',
  VALUE_INVALID = 'VALUE_INVALID',
  NO_CHOICES = 'NO_CHOICES',
  CHOICES = 'CHOICES',
  ESCAPE = 'ESCAPE',
  BACK = 'BACK',
  FORWARD = 'FORWARD',
  UP = 'UP',
  DOWN = 'DOWN',
  TAB = 'TAB',
  INPUT = 'INPUT',
  ACTIONS_INPUT = 'ACTIONS_INPUT',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NOTIFY = 'NOTIFY',
  WIDGET_GET = 'WIDGET_GET',
  WIDGET_CAPTURE_PAGE = 'WIDGET_CAPTURE_PAGE',
  WIDGET_END = 'WIDGET_END',
  WIDGET_UPDATE = 'WIDGET_UPDATE',
  WIDGET_SET_STATE = 'WIDGET_SET_STATE',
  WIDGET_CLICK = 'WIDGET_CLICK',
  WIDGET_DROP = 'WIDGET_DROP',
  WIDGET_MEASURE = 'WIDGET_MEASURE',
  WIDGET_MOUSE_DOWN = 'WIDGET_MOUSE_DOWN',
  WIDGET_MOUSE_UP = 'WIDGET_MOUSE_UP',
  WIDGET_INPUT = 'WIDGET_INPUT',
  WIDGET_DRAG_START = 'WIDGET_DRAG_START',
  TERMINATE_PROCESS = 'TERMINATE_PROCESS',
  WIDGET_RESIZED = 'WIDGET_RESIZED',
  WIDGET_MOVED = 'WIDGET_MOVED',
  WIDGET_SET_POSITION = 'WIDGET_SET_POSITION',
  WIDGET_SET_SIZE = 'WIDGET_SET_SIZE',
  WIDGET_FIT = 'WIDGET_FIT',
  WIDGET_INIT = 'WIDGET_INIT',
  WIDGET_THEME = 'WIDGET_THEME',
  WIDGET_ERROR = 'WIDGET_ERROR',
  SHORTCUT = 'SHORTCUT',
  ON_PASTE = 'ON_PASTE',
  ON_DRAG_ENTER = 'ON_DRAG_ENTER',
  ON_DRAG_LEAVE = 'ON_DRAG_LEAVE',
  ON_DRAG_OVER = 'ON_DRAG_OVER',
  ON_DROP = 'ON_DROP',
  ON_INIT = 'ON_INIT',
  ON_SUBMIT = 'ON_SUBMIT',
  GET_SCREENS_INFO = 'GET_SCREENS_INFO',
  GET_ACTIVE_APP = 'GET_ACTIVE_APP',
  TRASH = 'TRASH',
  COPY = 'COPY',
  PASTE = 'PASTE',
  CLEAR_SCRIPTS_MEMORY = 'CLEAR_SCRIPTS_MEMORY',
  SET_FORM = 'SET_FORM',
  CLEAR_TABS = 'CLEAR_TABS',
  VERIFY_FULL_DISK_ACCESS = 'VERIFY_FULL_DISK_ACCESS',
  SET_CLIPBOARD = 'SET_CLIPBOARD',
  SET_SELECTED_TEXT = 'SET_SELECTED_TEXT',
  ADD_CHOICE = 'ADD_CHOICE',
  FOCUS = 'FOCUS',
  SET_ALWAYS_ON_TOP = 'SET_ALWAYS_ON_TOP',
  SHOW_EMOJI_PANEL = 'SHOW_EMOJI_PANEL',
  SET_APPEARANCE = 'SET_APPEARANCE',
  SET_TEMP_THEME = 'SET_TEMP_THEME',
  SELECT_FILE = 'SELECT_FILE',
  REVEAL_FILE = 'REVEAL_FILE',
  SELECT_FOLDER = 'SELECT_FOLDER',
  PLAY_AUDIO = 'PLAY_AUDIO',
  STOP_AUDIO = 'STOP_AUDIO',
  SPEAK_TEXT = 'SPEAK_TEXT',
  BEEP = 'BEEP',
  SET_ENTER = 'SET_ENTER',
  CUT_TEXT = 'CUT_TEXT',
  DEBUG_SCRIPT = 'DEBUG_SCRIPT',
  BLUR_APP = 'BLUR_APP',
  WIDGET_CALL = 'WIDGET_CALL',
  SHOW_LOG_WINDOW = 'SHOW_LOG_WINDOW',
  PRO_STATUS = 'PRO_STATUS',
  GET_MAC_WINDOWS = 'GET_MAC_WINDOWS',
  GET_APP_STATE = 'GET_APP_STATE',
  APP = 'APP',
  CHANGE = 'CHANGE',
  SET_EDITOR_SUGGESTIONS = 'SET_EDITOR_SUGGESTIONS',
  APPEND_EDITOR_VALUE = 'APPEND_EDITOR_VALUE',
  CLIPBOARD_READ_TEXT = 'CLIPBOARD_READ_TEXT',
  CLIPBOARD_READ_HTML = 'CLIPBOARD_READ_HTML',
  CLIPBOARD_READ_IMAGE = 'CLIPBOARD_READ_IMAGE',
  CLIPBOARD_READ_RTF = 'CLIPBOARD_READ_RTF',
  CLIPBOARD_READ_BUFFER = 'CLIPBOARD_READ_BUFFER',
  CLIPBOARD_READ_BOOKMARK = 'CLIPBOARD_READ_BOOKMARK',
  CLIPBOARD_READ_FIND_TEXT = 'CLIPBOARD_READ_FIND_TEXT',
  CLIPBOARD_WRITE_TEXT = 'CLIPBOARD_WRITE_TEXT',
  CLIPBOARD_WRITE_HTML = 'CLIPBOARD_WRITE_HTML',
  CLIPBOARD_WRITE_IMAGE = 'CLIPBOARD_WRITE_IMAGE',
  CLIPBOARD_WRITE_RTF = 'CLIPBOARD_WRITE_RTF',
  CLIPBOARD_WRITE_BUFFER = 'CLIPBOARD_WRITE_BUFFER',
  CLIPBOARD_WRITE_BOOKMARK = 'CLIPBOARD_WRITE_BOOKMARK',
  CLIPBOARD_WRITE_FIND_TEXT = 'CLIPBOARD_WRITE_FIND_TEXT',
  CLIPBOARD_CLEAR = 'CLIPBOARD_CLEAR',
  GLOBAL_SHORTCUT_PRESSED = 'GLOBAL_SHORTCUT_PRESSED',
  REGISTER_GLOBAL_SHORTCUT = 'REGISTER_GLOBAL_SHORTCUT',
  UNREGISTER_GLOBAL_SHORTCUT = 'UNREGISTER_GLOBAL_SHORTCUT',
  START_DRAG = 'START_DRAG',
  GET_COLOR = 'GET_COLOR',
  CHAT_ADD_MESSAGE = 'CHAT_ADD_MESSAGE',
  CHAT_GET_MESSAGES = 'CHAT_GET_MESSAGES',
  CHAT_CLEAR_MESSAGES = 'CHAT_CLEAR_MESSAGES',
  CHAT_SET_MESSAGES = 'CHAT_SET_MESSAGES',
  CHAT_PUSH_TOKEN = 'CHAT_PUSH_TOKEN',
  CHAT_MESSAGES_CHANGE = 'CHAT_MESSAGES_CHANGE',
  CHAT_SUBMIT = 'CHAT_SUBMIT',
  CHAT_SET_MESSAGE = 'CHAT_SET_MESSAGE',
  MESSAGE_FOCUSED = 'MESSAGE_FOCUSED',
  ON_VALIDATION_FAILED = 'ON_VALIDATION_FAILED',
  APPEND_CHOICES = 'APPEND_CHOICES',
  TERM_EXIT = 'TERM_EXIT',
  TERM_KILL = 'TERM_KILL',
  APPEND_INPUT = 'APPEND_INPUT',
  SCROLL_TO = 'SCROLL_TO',
  GET_MICROPHONE = 'GET_MICROPHONE',
  GET_DEVICES = 'GET_DEVICES',
  SET_RUNNING = 'SET_RUNNING',
  GET_TYPED_TEXT = 'GET_TYPED_TEXT',
  WIDGET_CUSTOM = 'WIDGET_CUSTOM',
  SET_PAUSE_RESIZE = 'SET_PAUSE_RESIZE',
  TERM_WRITE = 'TERM_WRITE',
  SET_FORM_DATA = 'SET_FORM_DATA',
  SET_DISABLE_SUBMIT = 'SET_DISABLE_SUBMIT',
  WIDGET_EXECUTE_JAVASCRIPT = 'WIDGET_EXECUTE_JAVASCRIPT',
  START_MIC = 'START_MIC',
  STOP_MIC = 'STOP_MIC',
  EDITOR_GET_SELECTION = 'EDITOR_GET_SELECTION',
  EDITOR_SET_CODE_HINT = 'EDITOR_SET_CODE_HINT',
  PING = 'PING',
  PONG = 'PONG',
  EDITOR_GET_CURSOR_OFFSET = 'EDITOR_GET_CURSOR_OFFSET',
  EDITOR_MOVE_CURSOR = 'EDITOR_MOVE_CURSOR',
  EDITOR_INSERT_TEXT = 'EDITOR_INSERT_TEXT',
  EDITOR_REPLACE_RANGE = 'EDITOR_REPLACE_RANGE',
  EDITOR_GET_LINE_INFO = 'EDITOR_GET_LINE_INFO',
  EDITOR_FIND_REPLACE_ALL = 'EDITOR_FIND_REPLACE_ALL',
  EDITOR_GET_FOLDED_REGIONS = 'EDITOR_GET_FOLDED_REGIONS',
  EDITOR_SET_FOLDED_REGIONS = 'EDITOR_SET_FOLDED_REGIONS',
  EDITOR_EXECUTE_COMMAND = 'EDITOR_EXECUTE_COMMAND',
  EDITOR_SCROLL_TO = 'EDITOR_SCROLL_TO',
  EDITOR_SCROLL_TO_TOP = 'EDITOR_SCROLL_TO_TOP',
  EDITOR_SCROLL_TO_BOTTOM = 'EDITOR_SCROLL_TO_BOTTOM',
  EDITOR_GET_CURRENT_INPUT = 'EDITOR_GET_CURRENT_INPUT',
  SET_SCORED_CHOICES = 'SET_SCORED_CHOICES',
  SET_SCORED_FLAGS = 'SET_SCORED_FLAGS',
  PRELOAD = 'PRELOAD',
  SET_FLAG_VALUE = 'SET_FLAG_VALUE',
  DB = 'DB',
  CLEAR_TIMESTAMPS = 'CLEAR_TIMESTAMPS',
  REMOVE_TIMESTAMP = 'REMOVE_TIMESTAMP',
  CACHE_SCRIPTS = 'CACHE_SCRIPTS',
  PREVENT_SUBMIT = 'PREVENT_SUBMIT',
  ON_MENU_TOGGLE = 'ON_MENU_TOGGLE',
  TOGGLE_CLIPBOARD_WATCHER = 'TOGGLE_CLIPBOARD_WATCHER',
  TOGGLE_WATCHER = 'TOGGLE_WATCHER',
  ACTION = 'ACTION',
  ENABLE_ACCESSIBILITY = 'ENABLE_ACCESSIBILITY',
  QUIT_AND_RELAUNCH = 'QUIT_AND_RELAUNCH',
  BEFORE_EXIT = 'BEFORE_EXIT',
  MOUSE_SET_POSITION = 'MOUSE_SET_POSITION',
  MOUSE_LEFT_CLICK = 'MOUSE_LEFT_CLICK',
  MOUSE_RIGHT_CLICK = 'MOUSE_RIGHT_CLICK',
  MOUSE_MOVE = 'MOUSE_MOVE',
  SYSTEM_CLICK = 'SYSTEM_MOUSE_CLICK',
  SYSTEM_KEYDOWN = 'SYSTEM_KEYDOWN',
  SYSTEM_KEYUP = 'SYSTEM_KEYUP',
  SYSTEM_MOUSEDOWN = 'SYSTEM_MOUSEDOWN',
  SYSTEM_MOUSEUP = 'SYSTEM_MOUSEUP',
  SYSTEM_MOUSEMOVE = 'SYSTEM_MOUSEMOVE',
  SYSTEM_WHEEL = 'SYSTEM_WHEEL',
  KENV_NEW_PATH = 'KENV_NEW_PATH',
  SHOW_APP = 'SHOW_APP',
  MIC_STREAM = 'MIC_STREAM',
  SET_PROGRESS = 'SET_PROGRESS',
  ERROR = 'ERROR',
  HEARTBEAT = 'HEARTBEAT',
  GET_KIT_WINDOWS = 'GET_KIT_WINDOWS',
  FOCUS_KIT_WINDOW = 'FOCUS_KIT_WINDOW',
  WINDOW_CLOSE = 'WINDOW_CLOSE',
  WINDOW_HIDE = 'WINDOW_HIDE',
  WINDOW_SHOW = 'WINDOW_SHOW',
  WINDOW_MINIMIZE = 'WINDOW_MINIMIZE',
  WINDOW_MAXIMIZE = 'WINDOW_MAXIMIZE',
  PROMPT_READY = 'PROMPT_READY',
  FOCUS_PROMPT = 'FOCUS_PROMPT',
  CACHE_MAIN_SCRIPTS = 'CACHE_MAIN_SCRIPTS',
  KIT_READY = 'KIT_READY',
  MAIN_MENU_READY = 'MAIN_MENU_READY',
  KIT_LOADING = 'KIT_LOADING',
  GET_THEME = 'GET_THEME',
  TERMINATE_ALL_PROCESSES = 'TERMINATE_ALL_PROCESSES',
  CLOSE_ACTIONS = 'CLOSE_ACTIONS',
  CLOSE_PROMPT = 'CLOSE_PROMPT',
  OPEN_ACTIONS = 'OPEN_ACTIONS',
  KEYBOARD_TYPE_RATE = 'KEYBOARD_TYPE_RATE',
  SCREENSHOT = 'SCREENSHOT',
  SCRIPT_CHANGED = 'SCRIPT_CHANGED',
  SCRIPT_ADDED = 'SCRIPT_ADDED',
  SCRIPT_REMOVED = 'SCRIPT_REMOVED',
  STAMP_SCRIPT = 'STAMP_SCRIPT',
  VITE_WIDGET_GET = 'VITE_WIDGET_GET',
  VITE_WIDGET_SEND = 'VITE_WIDGET_SEND',
  LOG_TO_PARENT = 'LOG_TO_PARENT',
  HIDE_PROMPT = 'HIDE_PROMPT',
  TERMINATE_PROMPT = 'TERMINATE_PROMPT',
  CLEANUP_PROMPTS = 'CLEANUP_PROMPTS',
  GET_PROMPT_STATUS = 'GET_PROMPT_STATUS',
  FORCE_PROMPT_CLEANUP = 'FORCE_PROMPT_CLEANUP'
}

export enum ProcessType {
  App = 'App',
  Background = 'Background',
  Prompt = 'Prompt',
  Schedule = 'Schedule',
  System = 'System',
  Watch = 'Watch'
}

export enum ErrorAction {
  Ask = 'Ask',
  KitLog = 'KitLog',
  Log = 'Log',
  Open = 'Open',
  Copy = 'Copy',
  CopySyncPath = 'CopySyncPath'
}

export enum ProcessState {
  Active = 'Active',
  Idle = 'Idle'
}

export enum UI {
  none = 'none',
  arg = 'arg',
  textarea = 'textarea',
  hotkey = 'hotkey',
  drop = 'drop',
  editor = 'editor',
  form = 'form',
  div = 'div',
  log = 'log',
  splash = 'splash',
  term = 'term',
  fields = 'fields',
  emoji = 'emoji',
  debugger = 'debugger',
  chat = 'chat',
  mic = 'mic',
  webcam = 'webcam'
}

export enum Bin {
  cli = 'cli',
  scripts = 'scripts'
}

export enum Secret {
  password = 'password',
  text = 'text'
}

export enum Value {
  NoValue = '__noValue__',
  Undefined = '__undefined__'
}

export enum Key {
  Space = 'space',
  Escape = 'escape',
  Tab = 'tab',
  LeftAlt = 'alt',
  LeftControl = 'left_control',
  RightAlt = 'alt',
  RightControl = 'right_control',
  LeftShift = 'shift',
  LeftSuper = 'command',
  RightShift = 'right_shift',
  RightSuper = 'command',
  F1 = 'f1',
  F2 = 'f2',
  F3 = 'f3',
  F4 = 'f4',
  F5 = 'f5',
  F6 = 'f6',
  F7 = 'f7',
  F8 = 'f8',
  F9 = 'f9',
  F10 = 'f10',
  F11 = 'f11',
  F12 = 'f12',
  F13 = 'f13',
  F14 = 'f14',
  F15 = 'f15',
  F16 = 'f16',
  F17 = 'f17',
  F18 = 'f18',
  F19 = 'f19',
  F20 = 'f20',
  F21 = 'f21',
  F22 = 'f22',
  F23 = 'f23',
  F24 = 'f24',
  Num0 = 'numpad_0',
  Num1 = 'numpad_1',
  Num2 = 'numpad_2',
  Num3 = 'numpad_3',
  Num4 = 'numpad_4',
  Num5 = 'numpad_5',
  Num6 = 'numpad_6',
  Num7 = 'numpad_7',
  Num8 = 'numpad_8',
  Num9 = 'numpad_9',
  A = 'a',
  B = 'b',
  C = 'c',
  D = 'd',
  E = 'e',
  F = 'f',
  G = 'g',
  H = 'h',
  I = 'i',
  J = 'j',
  K = 'k',
  L = 'l',
  M = 'm',
  N = 'n',
  O = 'o',
  P = 'p',
  Q = 'q',
  R = 'r',
  S = 's',
  T = 't',
  U = 'u',
  V = 'v',
  W = 'w',
  X = 'x',
  Y = 'y',
  Z = 'z',
  Grave = 'grave',
  Minus = 'minus',
  Equal = 'equal',
  Backspace = 'backspace',
  LeftBracket = 'left_bracket',
  RightBracket = 'right_bracket',
  Backslash = 'backslash',
  Semicolon = 'semicolon',
  Quote = 'quote',
  Return = 'enter',
  Comma = 'comma',
  Period = 'period',
  Slash = 'slash',
  Left = 'left',
  Up = 'up',
  Right = 'right',
  Down = 'down',
  Print = 'printscreen',
  Pause = 'pause',
  Insert = 'insert',
  Delete = 'delete',
  Home = 'home',
  End = 'end',
  PageUp = 'pageup',
  PageDown = 'pagedown',
  Add = 'numpad_+',
  Subtract = 'numpad_-',
  Multiply = 'numpad_*',
  Divide = 'numpad_/',
  Decimal = 'numpad_.',
  Enter = 'enter',
  NumPad0 = 'numpad_0',
  NumPad1 = 'numpad_1',
  NumPad2 = 'numpad_2',
  NumPad3 = 'numpad_3',
  NumPad4 = 'numpad_4',
  NumPad5 = 'numpad_5',
  NumPad6 = 'numpad_6',
  NumPad7 = 'numpad_7',
  NumPad8 = 'numpad_8',
  NumPad9 = 'numpad_9',
  CapsLock = 'capslock',
  ScrollLock = 'scrolllock',
  NumLock = 'numpad_lock',
  AudioMute = 'audio_mute',
  AudioVolDown = 'audio_vol_down',
  AudioVolUp = 'audio_vol_up',
  AudioPlay = 'audio_play',
  AudioStop = 'audio_stop',
  AudioPause = 'audio_pause',
  AudioPrev = 'audio_prev',
  AudioNext = 'audio_next',
  AudioRewind = 'audio_rewind',
  AudioForward = 'audio_forward',
  AudioRepeat = 'audio_repeat',
  AudioRandom = 'audio_random',
  LightsMonUp = 'lights_mon_up',
  LightsMonDown = 'lights_mon_down',
  LightsKbdToggle = 'lights_kbd_toggle',
  LightsKbdUp = 'lights_kbd_up',
  LightsKbdDown = 'lights_kbd_down'
}

export const statuses = ['default', 'success', 'warn', 'busy', 'error', 'pause', 'update'] as const

export enum AppChannel {
  BUILD_TS_SCRIPT = 'BUILD_TS_SCRIPT',
  DRAG_FILE_PATH = 'DRAG_FILE_PATH',
  EDIT_SCRIPT = 'EDIT_SCRIPT',
  FOCUS_PROMPT = 'FOCUS_PROMPT',
  GET_ASSET = 'GET_ASSET',
  INIT_RESIZE_HEIGHT = 'INIT_RESIZE_HEIGHT',
  OPEN_FILE = 'OPEN_FILE',
  OPEN_SCRIPT = 'OPEN_SCRIPT',
  OPEN_SCRIPT_DB = 'OPEN_SCRIPT_DB',
  OPEN_SCRIPT_LOG = 'OPEN_SCRIPT_LOG',
  PROMPT_HEIGHT_RESET = 'PROMPT_HEIGHT_RESET',
  READ_FILE_CONTENTS = 'READ_FILE_CONTENTS',
  RECEIVE_FILE_CONTENTS = 'RECEIVE_FILE_CONTENTS',
  RESIZE = 'RESIZE',
  RUN_MAIN_SCRIPT = 'RUN_MAIN_SCRIPT',
  SET_FILEPATH_BOUNDS = 'SET_PROMPT_DB',
  SET_MAIN_HEIGHT = 'SET_MAIN_HEIGHT',
  END_PROCESS = 'END_PROCESS',
  FEEDBACK = 'SUBMIT_SURVEY',
  PROCESSES = 'PROCESSES',
  RUN_PROCESSES_SCRIPT = 'RUN_PROCESSES_SCRIPT',
  LOG = 'LOG',
  MAIN_SCRIPT = 'MAIN_SCRIPT',
  KIT_STATE = 'STATE',
  APPLY_UPDATE = 'APPLY_UPDATE',
  LOGIN = 'LOGIN',
  USER_CHANGED = 'USER_CHANGED'
}

export enum WindowChannel {
  SET_LAST_LOG_LINE = 'LOG_LINE',
  SET_EDITOR_LOG_MODE = 'SET_EDITOR_LOG_MODE',
  SET_LOG_VALUE = 'SET_LOG_VALUE',
  CLEAR_LOG = 'CLEAR_LOG',
  MOUNTED = 'MOUNTED'
}

export enum Trigger {
  App = 'app',
  Background = 'background',
  Info = 'info',
  Schedule = 'schedule',
  Snippet = 'snippet',
  System = 'system',
  Shortcut = 'shortcut',
  Watch = 'watch',
  Kit = 'kit',
  Kar = 'kar',
  Menu = 'menu',
  Tray = 'tray',
  Trigger = 'trigger',
  RunTxt = 'runTxt'
}

export const PROMPT = {
  RATIO: 1.6,
  INPUT: {
    HEIGHT: {
      XXS: 32,
      XS: 40,
      SM: 46,
      BASE: 56,
      LG: 64,
      XL: 72
    }
  },
  ITEM: {
    HEIGHT: {
      XXXS: 28,
      XXS: 30,
      XS: 38,
      SM: 46,
      BASE: 56,
      LG: 64,
      XL: 72,
      XXL: 80
    }
  },
  WIDTH: {
    XXXS: 360,
    XXS: 480,
    XS: 512,
    SM: 640,
    BASE: 768,
    LG: 896,
    XL: 1024,
    '2XL': 1152,
    '3XL': 1280,
    '4XL': 1408,
    '5XL': 1536,
    '6XL': 1664
  },
  HEIGHT: {
    get XXS() {
      return Math.round(PROMPT.WIDTH.XXS / PROMPT.RATIO)
    },
    get XS() {
      return Math.round(PROMPT.WIDTH.XS / PROMPT.RATIO)
    },
    get SM() {
      return Math.round(PROMPT.WIDTH.SM / PROMPT.RATIO)
    },
    get BASE() {
      return Math.round(PROMPT.WIDTH.BASE / PROMPT.RATIO)
    },
    get LG() {
      return Math.round(PROMPT.WIDTH.LG / PROMPT.RATIO)
    },
    get XL() {
      return Math.round(PROMPT.WIDTH.XL / PROMPT.RATIO)
    },
    get '2XL'() {
      return Math.round(PROMPT.WIDTH['2XL'] / PROMPT.RATIO)
    },
    get '3XL'() {
      return Math.round(PROMPT.WIDTH['3XL'] / PROMPT.RATIO)
    },
    get '4XL'() {
      return Math.round(PROMPT.WIDTH['4XL'] / PROMPT.RATIO)
    },
    get '5XL'() {
      return Math.round(PROMPT.WIDTH['5XL'] / PROMPT.RATIO)
    },
    get '6XL'() {
      return Math.round(PROMPT.WIDTH['6XL'] / PROMPT.RATIO)
    },
    HEADER: 24,
    FOOTER: 28,
    INPUT_INFO: 26,
    get INPUT_ONLY() {
      return PROMPT.HEIGHT.HEADER + PROMPT.INPUT.HEIGHT.BASE + PROMPT.HEIGHT.FOOTER
    }
  }
}

export { }
</file>

<file path="src/core/sourcemap-formatter.ts">
import { existsSync } from 'fs'
import { isAbsolute, normalize, resolve } from 'path'
import os from 'os'

export interface StackFrame {
  file: string
  line: number
  column: number
  function?: string
  isNative?: boolean
  isEval?: boolean
  isConstructor?: boolean
}

export interface FormattedError {
  message: string
  name: string
  stack: string
  frames: StackFrame[]
  originalStack?: string
}

export class SourcemapErrorFormatter {
  private static readonly STACK_FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
  // Windows absolute path: drive letter ("C:\" or "C:/") or UNC ("\\server\share")
  private static readonly WINDOWS_PATH_REGEX = /^([a-zA-Z]:[\\/]|\\\\)/
  private static readonly FILE_URL_REGEX = /^file:\/\//

  /**
   * Formats an error with enhanced stack trace information
   */
  static formatError(error: Error): FormattedError {
    const frames = this.parseStackTrace(error.stack || '')
    
    return {
      message: error.message,
      name: error.name,
      stack: this.formatStackTrace(frames, error),
      frames,
      originalStack: error.stack
    }
  }

  /**
   * Parses a stack trace string into structured frames
   */
  private static parseStackTrace(stack: string): StackFrame[] {
    const lines = stack.split('\n')
    const frames: StackFrame[] = []

    for (const line of lines) {
      const match = line.match(this.STACK_FRAME_REGEX)
      if (match) {
        const [, functionName, fileRaw, lineStr, columnStr] = match
        
        // Clean up file path
        let file = fileRaw
          .replace(this.FILE_URL_REGEX, '')
          .replace(/\?.*$/, '') // Remove query parameters
        
        // Drop the leading slash for Windows drive paths like "/C:/..."
        // This handles file://C:/... URLs that become /C:/... after protocol removal
        file = file.replace(/^\/([a-zA-Z]:\/?)/, '$1')
        
        // Ensure absolute paths remain absolute after normalization
        const isAbsolutePath = file.startsWith('/') || this.WINDOWS_PATH_REGEX.test(file)
        file = normalize(file)
        
        // On Unix, normalize may strip leading slash, restore it if needed
        // But don't add a slash to Windows-style paths (C:/, \\server\share)
        if (isAbsolutePath && !file.startsWith('/') && !this.WINDOWS_PATH_REGEX.test(file) && os.platform() !== 'win32') {
          file = '/' + file
        }
        
        frames.push({
          file,
          line: parseInt(lineStr, 10),
          column: parseInt(columnStr, 10),
          function: functionName || '<anonymous>',
          isNative: line.includes('native'),
          isEval: line.includes('eval'),
          isConstructor: line.includes('new ')
        })
      }
    }

    return frames
  }

  /**
   * Formats stack frames back into a readable stack trace
   */
  private static formatStackTrace(frames: StackFrame[], error: Error): string {
    const lines = [`${error.name}: ${error.message}`]
    
    for (const frame of frames) {
      // Skip node_modules and internal frames unless in verbose mode
      if (!process.env.KIT_ERROR_VERBOSE && this.shouldSkipFrame(frame)) {
        continue
      }
      
      const location = `${frame.file}:${frame.line}:${frame.column}`
      const functionPart = frame.function !== '<anonymous>' 
        ? `${frame.function} (${location})` 
        : location
        
      lines.push(`    at ${functionPart}`)
    }
    
    return lines.join('\n')
  }

  /**
   * Determines if a frame should be skipped in the output
   */
  private static shouldSkipFrame(frame: StackFrame): boolean {
    // Normalize path separators so regexes behave the same on Win & POSIX
    const f = frame.file.replace(/\\/g, '/')
    const skipPatterns = [
      /(?:^|\/)node_modules(?:\/|$)/,
      /(?:^|\/)internal\/modules(?:\/|$)/,
      /(?:^|\/)internal\/process(?:\/|$)/,
      /(?:^|\/)internal\/timers(?:\/|$)/,
      /^node:internal\//, // e.g., node:internal/modules/...
    ]
    
    return skipPatterns.some(pattern => pattern.test(f))
  }

  /**
   * Extracts error location for the error prompt
   */
  static extractErrorLocation(error: Error): { file: string; line: number; column: number } | null {
    const formatted = this.formatError(error)
    
    // Find first non-internal frame
    const relevantFrame = formatted.frames.find(frame => 
      !this.shouldSkipFrame(frame) && 
      existsSync(frame.file)
    )
    
    if (relevantFrame) {
      return {
        file: relevantFrame.file,
        line: relevantFrame.line,
        column: relevantFrame.column
      }
    }
    
    return null
  }

  /**
   * Validates and resolves a file path
   */
  static resolveFilePath(filePath: string, basePath?: string): string | null {
    try {
      // Remove file:// protocol if present
      let cleanPath = filePath.replace(this.FILE_URL_REGEX, '')
      
      // Drop the leading slash for Windows drive paths like "/C:/..."
      // This handles file://C:/... URLs that become /C:/... after protocol removal
      cleanPath = cleanPath.replace(/^\/([a-zA-Z]:\/?)/, '$1')
      
      // Resolve relative paths
      const isAbsolutePath = cleanPath.startsWith('/') || this.WINDOWS_PATH_REGEX.test(cleanPath)
      let resolvedPath = (isAbsolute(cleanPath) || this.WINDOWS_PATH_REGEX.test(cleanPath))
        ? normalize(cleanPath)
        : resolve(basePath || process.cwd(), cleanPath)
      
      // On Unix, normalize may strip leading slash, restore it if needed
      // But don't add a slash to Windows-style paths (C:/, \\server\share)
      if (isAbsolutePath && !resolvedPath.startsWith('/') && !this.WINDOWS_PATH_REGEX.test(resolvedPath) && os.platform() !== 'win32') {
        resolvedPath = '/' + resolvedPath
      }
      
      // Check if file exists
      if (existsSync(resolvedPath)) {
        return resolvedPath
      }
      
      // Try with .ts extension if .js doesn't exist
      const tsPath = resolvedPath.replace(/\.js$/, '.ts')
      if (existsSync(tsPath)) {
        return tsPath
      }
      
      // Try with .tsx extension
      const tsxPath = resolvedPath.replace(/\.js$/, '.tsx')
      if (existsSync(tsxPath)) {
        return tsxPath
      }
      
      return null
    } catch (error) {
      return null
    }
  }
}
</file>

<file path="test-sdk/main.test.js">
import ava from 'ava';
import slugify from 'slugify';
import path from 'node:path';
import os from 'node:os';
import { Channel, KIT_APP_PROMPT } from './config.js';
import { pathToFileURL } from 'url';

process.env.NODE_NO_WARNINGS = 1;

process.env.KIT = process.env.KIT || path.resolve(os.homedir(), '.kit');

ava.serial('app-prompt.js', async (t) => {
  let script = 'mock-script-with-arg';
  let scriptPath = kenvPath('scripts', `${script}.js`);
  let placeholder = 'hello';
  let contents = `
    await arg("${placeholder}")
    `;
  await exec(`kit new ${script} main --no-edit`);
  await writeFile(scriptPath, contents);

  t.log('Starting app-prompt.js...');
  let mockApp = fork(KIT_APP_PROMPT, {
    env: {
      NODE_NO_WARNINGS: '1',
      KIT: home('.kit'),
      KENV: kenvPath(),
      KIT_CONTEXT: 'app'
    }
  });

  let command = 'mock-script-with-arg';
  let value = {
    script: command,
    args: ['hello']
  };

  t.log('Waiting for app-prompt.js to start...');
  let result = await new Promise((resolve, reject) => {
    /**
    channel: Channel
    pid: number
    newPid?: number
    state: AppState
    widgetId?: number
       * 
       */
    mockApp.on('message', (data) => {
      console.log('received', data);
      if (data.channel === Channel.SET_SCRIPT) {
        // The mockApp will hang waiting for input if you don't submit a value
        mockApp.send({
          channel: Channel.VALUE_SUBMITTED,
          value: 'done'
        });
        resolve(data);
      }
    });

    mockApp.on('spawn', () => {
      mockApp.send(
        {
          channel: Channel.VALUE_SUBMITTED,
          value
        },
        (error) => { }
      );
    });
  });

  t.log({ result, command });
  t.is(result.value.command, command);
});

ava.serial('kit setup', async (t) => {
  let envPath = kenvPath('.env');
  let fileCreated = test('-f', envPath);

  t.true(fileCreated);

  let contents = await readFile(envPath, 'utf-8');
  t.true(contents.includes('KIT_TEMPLATE=default'));
});

// Flaky test
ava('TypeScript support', async (t) => {
  let tsScript = 'mock-typescript-script';
  await exec(`kit set-env-var KIT_MODE ts`);
  await wait(100);

  await exec(`kit new ${tsScript} main --no-edit`);

  let tsScriptPath = kenvPath('scripts', `${tsScript}.ts`);

  t.true(await pathExists(tsScriptPath), `Should create ${tsScriptPath}`);

  t.is(
    await readFile(tsScriptPath, 'utf-8'),
    await readFile(kenvPath('templates', 'default.ts'), 'utf-8'),
    'Generated TypeScript file matches TypeScript template'
  );

  await appendFile(
    tsScriptPath,
    `
console.log(await arg())`
  );

  let message = 'success';
  let { stdout, stderr } = await exec(`kit ${tsScript} ${message}`);

  t.is(stderr, '');

  t.regex(stdout, new RegExp(`${message}`), 'TypeScript script worked');

  let JSofTSExists = await pathExists(tsScriptPath.replace(/\.ts$/, '.js'));

  t.false(JSofTSExists, 'Should remove generated JS file');

  let envContents = await readFile(kenvPath('.env'), 'utf-8');

  t.log({
    envContents
  });

  t.true(envContents.includes('KIT_MODE=ts'), `Should set KIT_MODE=ts ${envContents}`);
});

ava('TypeScript import from lib', async (t) => {
  let tsScript = 'mock-typescript-script-load-lib';
  await exec(`kit set-env-var KIT_MODE ts`);
  await exec(`kit new ${tsScript} main --no-edit`);

  let tsScriptPath = kenvPath('scripts', `${tsScript}.ts`);

  t.true(await pathExists(tsScriptPath), `Should create ${tsScript}.ts`);

  t.is(
    await readFile(tsScriptPath, 'utf-8'),
    await readFile(kenvPath('templates', 'default.ts'), 'utf-8'),
    'Generated TypeScript file matches TypeScript template'
  );
  await outputFile(
    kenvPath('lib', 'yo.ts'),
    `
import "@johnlindquist/kit"    
export let go = async ()=> await arg()
  `
  );

  t.log(await readdir(kenvPath('lib')));

  await appendFile(
    tsScriptPath,
    `
import { go } from "../lib/yo"    
console.log(await go())`
  );

  let message = 'success';
  let { stdout, stderr } = await exec(`kit ${tsScript} ${message}`);

  t.is(stderr, '');

  t.regex(stdout, new RegExp(`${message}`), 'TypeScript script worked');

  let JSofTSExists = await pathExists(tsScriptPath.replace(/\.ts$/, '.js'));

  t.false(JSofTSExists, 'Should remove generated JS file');
});

ava.serial('JavaScript support', async (t) => {
  let script = 'mock-javascript-script';
  await exec(`kit new ${script} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  let scriptPath = kenvPath('scripts', `${script}.js`);

  t.true(await pathExists(scriptPath));

  let scriptContents = await readFile(scriptPath, 'utf-8');
  let defaultTemplateContents = await readFile(kenvPath('templates', 'default.js'), 'utf-8');

  t.is(scriptContents, defaultTemplateContents, 'Generated JavaScript file matches JavaScript template');
});

ava.serial('kit new, run, and rm', async (t) => {
  let command = 'mock-script-for-new-run-rm';
  let scriptContents = `
  let value = await arg()
  console.log(\`${command} \${value} 🎉!\`)
`;

  let { stdout, stderr } = await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  let scriptPath = kenvPath('scripts', `${command}.js`);
  let binPath = kenvPath('bin', `${command}`);

  if (process.platform === 'win32') {
    binPath += '.cmd';
  }

  t.true(stderr === '', 'kit new errored out');
  t.true(test('-f', scriptPath), 'script created');
  await writeFile(scriptPath, scriptContents);

  t.true(test('-f', binPath), 'bin created');

  let message = 'success';
  ({ stdout, stderr } = await exec(`${binPath} ${message}`));

  t.true(stdout.includes(message), `stdout includes ${message}`);

  let { stdout: rmStdout, stderr: rmStderr } = await exec(`kit rm ${command} --confirm`);

  let scripts = await readdir(kenvPath('scripts'));
  let bins = await readdir(kenvPath('bin'));
  t.log({ scripts, bins, rmStdout, rmStderr });

  let fileRmed = !scripts.includes(command);
  let binRmed = !(await isFile(binPath));

  t.true(fileRmed);
  t.true(binRmed);
});

ava.serial('kit hook', async (t) => {
  let script = 'mock-script-with-export';
  let contents = `
  export let value = await arg()
  `;
  await exec(`kit new ${script} main --no-edit`);
  await writeFile(kenvPath('scripts', `${script}.js`), contents);

  let message = 'hello';
  await import(pathToFileURL(kitPath('index.js')).href);
  let result = await kit(`${script} ${message}`);
  t.is(result.value, message);
});

ava.serial('kit script-output-hello', async (t) => {
  let script = 'mock-script-output-hello';
  let contents = 'console.log(await arg())';
  await exec(`kit new ${script} main --no-edit`);
  await writeFile(kenvPath('scripts', `${script}.js`), contents);

  let { stdout } = await exec(`kit ${script} "hello"`);

  t.log({ stdout });

  t.true(stdout.includes('hello'));
});

ava.serial('kit script in random dir', async (t) => {
  let someRandomDir = kitMockPath('.kit-some-random-dir');
  let script = 'mock-some-random-script';
  let contents = 'console.log(await arg())';
  let scriptPath = path.resolve(someRandomDir, `${script}.js`);
  await outputFile(scriptPath, contents);

  try {
    let command = `kit "${scriptPath}" "hello"`;
    let { stdout, stderr } = await exec(command);
    t.log({ stdout, stderr, scriptPath, contents, command });

    t.true(stdout.includes('hello'), "Expected 'hello' in stdout");
  } catch (error) {
    t.log({ error: error.message, scriptPath, contents });
    t.fail(`Error executing script: ${error.message}`);
  }

  // Verify the file contents
  let actualContents = await readFile(scriptPath, 'utf-8');
  t.is(actualContents, contents, 'Script file contents should match');
});

ava.serial('Run both JS and TS scripts', async (t) => {
  let jsCommand = 'mock-js-script';
  let tsCommand = 'mock-ts-script';

  let newJSCommandResult = await exec(`kit new ${jsCommand} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });
  let newTSCommandResult = await exec(`kit new ${tsCommand} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'ts'
    }
  });

  process.env.PATH = `${kenvPath('bin')}${path.delimiter}${process.env.PATH}`;

  let jsCommandResult = await exec(`${jsCommand}`);
  let tsCommandResult = await exec(`${tsCommand}`);

  t.log({
    newJSCommandResult,
    newTSCommandResult,
    jsCommandResult,
    tsCommandResult
  });

  t.is(jsCommandResult.stderr, '');
  t.is(tsCommandResult.stderr, '');
});

ava.serial('Run kit from package.json', async (t) => {
  let command = 'mock-pkg-json-script';
  let scriptPath = kenvPath('scripts', `${command}.js`);
  await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  await appendFile(
    scriptPath,
    `
let value = await arg()  
console.log(value)
`
  );

  let pkgPath = kenvPath('package.json');
  let pkgJson = await readJson(pkgPath);
  let npmScript = 'run-kit';

  let message = 'success';

  pkgJson.scripts = {
    [npmScript]: `kit ${command} ${message}`
  };

  await writeJson(pkgPath, pkgJson);

  pkgJson = await readJson(pkgPath);
  t.log(pkgJson);

  cd(kenvPath());
  let { stdout, stderr } = await exec(`pnpm run ${npmScript}`);

  t.is(stderr, '');
  t.regex(stdout, new RegExp(`${message}`));
});

ava.serial('Run a script with --flag values: pass hello instead of one and two', async (t) => {
  let command = 'mock-boolean-flag-values-pass-hello-instead-of-one-and-two';
  let scriptPath = kenvPath('scripts', `${command}.js`);
  await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  let success = 'success';
  let fail = 'fail';

  await appendFile(
    scriptPath,
    `
let value = await arg()
if(flag.one === "one" && flag.two === "two"){
  console.log("${success}")
}else{
  console.log("${fail}")
}
`
  );

  cd(kenvPath());
  ({ stdout, stderr } = await exec(`kit ${command} hello`));

  t.is(stderr, '');
  t.regex(stdout, new RegExp(fail));
});

ava.serial('Run a script with --flag values: ones and twos match', async (t) => {
  let command = 'mock-boolean-flag-values-ones-and-twos-match';
  let scriptPath = kenvPath('scripts', `${command}.js`);
  await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  let success = 'success';
  let fail = 'fail';

  await appendFile(
    scriptPath,
    `
let value = await arg()
if(flag.one === "one" && flag.two === "two"){
  console.log("${success}")
}else{
  console.log("${fail}")
}
`
  );

  cd(kenvPath());
  let { stdout, stderr } = await exec(`kit ${command} hello --one one --two two`);

  t.is(stderr, '');
  t.regex(stdout, new RegExp(success));
});

ava.serial('Run a script with --flag values: ones match, twos mismatch', async (t) => {
  let command = 'mock-boolean-flag-values-ones-match-twos-mismatch';
  let scriptPath = kenvPath('scripts', `${command}.js`);
  await exec(`kit new ${command} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'js'
    }
  });

  let success = 'success';
  let fail = 'fail';

  await appendFile(
    scriptPath,
    `
let value = await arg()
if(flag.one === "one" && flag.two === "two"){
  console.log("${success}")
}else{
  console.log("${fail}")
}
`
  );

  cd(kenvPath());
  ({ stdout, stderr } = await exec(`kit ${command} hello --one one --two three`));

  t.is(stderr, '');
  t.regex(stdout, new RegExp(fail));
});

ava.serial('Run a scriptlet from a .md file', async (t) => {
  let scriptlet = 'mock-scriptlet-from-md-file';
  let scriptletPath = kenvPath('scriptlets', `${scriptlet}.md`);
  let testFilePathContents = 'Success!';
  let scriptletName = 'Test Scriptlet';
  let scriptletNameSlug = slugify(scriptletName);
  await ensureDir(kenvPath('scriptlets'));

  let content = `
## ${scriptletName}
	
\`\`\`ts
await writeFile(kenvPath("test.md"), "${testFilePathContents}")
\`\`\`
`.trim();

  await writeFile(scriptletPath, content);
  let { stdout, stderr } = await exec(`kit "${scriptletPath}#${scriptletNameSlug}"`);
  t.log({ stdout, stderr, content });
  let testFilePathFinalContents = await readFile(kenvPath('test.md'), 'utf8');
  t.is(testFilePathFinalContents, testFilePathContents);
});

ava.serial('Run a scriptlet from a .md file with args', async (t) => {
  let scriptlet = 'mock-scriptlet-from-md-file-with-args';
  let scriptletPath = kenvPath('scriptlets', `${scriptlet}.md`);

  let scriptletDir = path.parse(scriptletPath).dir;
  t.log;
  await ensureDir(scriptletDir);
  let scriptletName = 'Test Scriptlet With Args';
  t.log(`Slugifying ${scriptletName}`);
  let scriptletNameSlug = slugify(scriptletName);

  t.log(`Writing file: ${scriptletPath}`);
  let scriptletContent = `
## ${scriptletName}

\`\`\`ts
let scope = await arg("scope")
let message = await arg("message")
console.log(scope + ": " + message)
\`\`\`
	  `.trim();
  t.log({ scriptletPath, scriptletNameSlug, scriptletContent });
  try {
    await writeFile(scriptletPath, scriptletContent);
  } catch (error) {
    t.log(error);
  }

  let fullCommand = `kit ${scriptletPath}#${scriptletNameSlug} test "Hello, world!"`;
  t.log({ fullCommand });
  let { stdout } = await exec(fullCommand);

  t.is(stdout, 'test: Hello, world!');
});

ava.serial('Run a bash scriptlet from a .md file with args', async (t) => {
  if (process.platform === 'win32') {
    t.pass('Skipping test on Windows');
    return;
  }

  let scriptlet = 'mock-bash-scriptlet-from-md-file-with-args';
  let scriptletPath = kenvPath('scriptlets', `${scriptlet}.md`);

  let scriptletDir = path.parse(scriptletPath).dir;
  t.log;
  await ensureDir(scriptletDir);
  let scriptletName = 'Test Bash Scriptlet With Args';
  let scriptletNameSlug = slugify(scriptletName);

  let scriptletContent = `
## ${scriptletName}

\`\`\`bash
echo "fix($1): $2"
\`\`\`
	  `.trim();
  t.log({ scriptletPath, scriptletNameSlug, scriptletContent });
  try {
    await writeFile(scriptletPath, scriptletContent);
  } catch (error) {
    t.log(error);
  }

  let fullCommand = `kit ${scriptletPath}#${scriptletNameSlug} test "Hello, world!"`;
  t.log({ fullCommand });
  let { stdout } = await exec(fullCommand);

  t.is(stdout, 'fix(test): Hello, world!');
});
</file>

<file path="src/core/utils.ts">
import '../globals/index.js'
import { config } from 'dotenv-flow'

import { md as globalMd, marked } from '../globals/marked.js'

import * as path from 'node:path'

import type { Script, Metadata, Shortcut, Scriptlet, Snippet } from '../types/core'
import { lstatSync, realpathSync } from 'node:fs'
import { lstat, readdir } from 'node:fs/promises'
import { execSync } from 'node:child_process'

import { Channel, ProcessType } from './enum.js'
import { type AssignmentExpression, type Identifier, type ObjectExpression, Parser, type Program } from 'acorn'
import tsPlugin from 'acorn-typescript'
import type { Stamp } from './db'
import { pathToFileURL } from 'node:url'
import { parseScript } from './parser.js'
import { kitPath, kenvPath } from './resolvers.js'
import { cmd, scriptsDbPath, statsPath } from './constants.js'
import { isBin, isJsh, isDir, isWin, isMac } from './is.js'
import { stat } from "node:fs/promises";
import { parentPort } from 'node:worker_threads';

// Module-level variables to store the last known mtimes for the DB files
// These are global for this utility, shared by any cache using it.
let utilLastScriptsDbMtimeMs: number = 0;
let utilLastStatsPathMtimeMs: number = 0;

export async function checkDbAndInvalidateCache(
  cacheMap: Map<any, any>,
  cacheName: string // For logging/debugging purposes
): Promise<void> {
  let currentScriptsDbMtimeMs = 0;
  let currentStatsPathMtimeMs = 0;

  try {
    currentScriptsDbMtimeMs = (await stat(scriptsDbPath)).mtimeMs;
  } catch (dbError) {
    // console.warn(`Could not stat scriptsDbPath "${scriptsDbPath}" for ${cacheName} cache:`, dbError);
    currentScriptsDbMtimeMs = -1; // Mark as different/error
  }

  try {
    currentStatsPathMtimeMs = (await stat(statsPath)).mtimeMs;
  } catch (dbError) {
    // console.warn(`Could not stat statsPath "${statsPath}" for ${cacheName} cache:`, dbError);
    currentStatsPathMtimeMs = -1; // Mark as different/error
  }

  if (
    currentScriptsDbMtimeMs !== utilLastScriptsDbMtimeMs ||
    currentStatsPathMtimeMs !== utilLastStatsPathMtimeMs
  ) {
    if (parentPort) {
      parentPort.postMessage({
        channel: Channel.LOG_TO_PARENT,
        value: `[CacheUtil] '${cacheName}' cache cleared due to ${currentScriptsDbMtimeMs !== utilLastScriptsDbMtimeMs ? 'scriptsDb' : ''} ${currentStatsPathMtimeMs !== utilLastStatsPathMtimeMs ? 'stats' : ''} file changes/inaccessibility.`
      });
    }
    cacheMap.clear();
    // Update the utility's last known mtimes
    utilLastScriptsDbMtimeMs = currentScriptsDbMtimeMs;
    utilLastStatsPathMtimeMs = currentStatsPathMtimeMs;
  } else {
    // DB files haven't changed AND were accessible (or still inaccessible as before)
    // No need to clear cache based on DB files.
  }
}

export let extensionRegex = /\.(mjs|ts|js)$/g
// Regex to detect VS Code snippet variables like:
// $1, $2 - Simple numbered placeholders
// ${1:default} - Numbered placeholders with default values
// ${foo|bar} - Choice placeholders with options
// ${name} - Named placeholders
export let templatePlaceholdersRegex = /\$(?:\d+|\{(?:\d+:[^{}]*|[^{}|]+(?:\|[^{}|]+)*|[^{}|]+)\})/

export let wait = async (time: number): Promise<void> => new Promise((res) => setTimeout(res, time))

export let checkProcess = (pid: string | number) => {
  return execSync(`kill -0 ` + pid).buffer.toString()
}

export let combinePath = (arrayOfPaths: string[]): string => {
  const pathSet = new Set<string>()

  for (const p of arrayOfPaths) {
    if (p) {
      const paths = p.split(path.delimiter)
      for (const singlePath of paths) {
        if (singlePath) {
          pathSet.add(singlePath)
        }
      }
    }
  }

  return Array.from(pathSet).join(path.delimiter)
}

const DEFAULT_PATH = process.env.PATH
export const resetPATH = () => {
  process.env.PATH = DEFAULT_PATH
}
const UNIX_DEFAULT_PATH = combinePath(['/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'])

const WIN_DEFAULT_PATH = combinePath([])

export const KIT_DEFAULT_PATH = isWin ? WIN_DEFAULT_PATH : UNIX_DEFAULT_PATH

export const KIT_BIN_PATHS = combinePath([
  kitPath('bin'),
  ...(isWin ? [] : [kitPath('override', 'code')]),
  kenvPath('bin')
])

export const KIT_FIRST_PATH = combinePath([KIT_BIN_PATHS, process?.env?.PATH, KIT_DEFAULT_PATH])

export const KIT_LAST_PATH = combinePath([process.env.PATH, KIT_DEFAULT_PATH, KIT_BIN_PATHS])

export let assignPropsTo = (
  source: { [s: string]: unknown } | ArrayLike<unknown>,
  target: { [x: string]: unknown }
) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

//app
let fileExists = (path: string) => {
  try {
    return lstatSync(path, {
      throwIfNoEntry: false
    })?.isFile()
  } catch {
    return false
  }
}

export let isScriptletPath = (filePath: unknown) => {
  return typeof filePath === 'string' && filePath.includes('.md#')
}

//app
export let resolveToScriptPath = (rawScript: string, cwd: string = process.cwd()): string => {
  let extensions = ['', '.js', '.ts', '.md']
  let resolvedScriptPath = ''

  // Remove anchor from the end
  let script = rawScript.replace(/\#.*$/, '')

  // if (!script.match(/(.js|.mjs|.ts)$/)) script += ".js"
  if (fileExists(script)) return script

  // Check sibling scripts
  if (global.kitScript) {
    let currentRealScriptPath = realpathSync(global.kitScript)
    let maybeSiblingScriptPath = path.join(path.dirname(currentRealScriptPath), script)
    if (fileExists(maybeSiblingScriptPath)) {
      return maybeSiblingScriptPath
    }

    if (fileExists(maybeSiblingScriptPath + '.js')) {
      return maybeSiblingScriptPath + '.js'
    }

    if (fileExists(maybeSiblingScriptPath + '.ts')) {
      return maybeSiblingScriptPath + '.ts'
    }
  }

  // Check main kenv

  for (let ext of extensions) {
    resolvedScriptPath = kenvPath('scripts', script + ext)
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath
  }

  // Check other kenvs
  let [k, s] = script.split('/')
  if (s) {
    for (let ext of extensions) {
      resolvedScriptPath = kenvPath('kenvs', k, 'scripts', s + ext)
      if (fileExists(resolvedScriptPath)) return resolvedScriptPath
    }
  }

  // Check scripts dir

  for (let ext of extensions) {
    resolvedScriptPath = path.resolve(cwd, 'scripts', script + ext)
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath
  }

  // Check anywhere

  for (let ext of extensions) {
    resolvedScriptPath = path.resolve(cwd, script + ext)
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath
  }

  throw new Error(`${script} not found`)
}

export let resolveScriptToCommand = (script: string) => {
  return path.basename(script).replace(new RegExp(`\\${path.extname(script)}$`), '')
}

//app
export const shortcutNormalizer = (shortcut: string) =>
  shortcut
    ? shortcut
      .replace(/(option|opt|alt)/i, isMac ? 'Option' : 'Alt')
      .replace(/(ctl|cntrl|ctrl|control)/, 'Control')
      .replace(/(command|cmd)/i, isMac ? 'Command' : 'Control')
      .replace(/(shift|shft)/i, 'Shift')
      .split(/\s/)
      .filter(Boolean)
      .map((part) => (part[0].toUpperCase() + part.slice(1)).trim())
      .join('+')
    : ''

export const friendlyShortcut = (shortcut: string) => {
  let f = ''
  if (shortcut.includes('Command+')) f += 'cmd+'
  if (shortcut.match(/(?<!Or)Control\+/)) f += 'ctrl+'
  if (shortcut.includes('Alt+')) f += 'alt+'
  if (shortcut.includes('Option+')) f += 'opt+'
  if (shortcut.includes('Shift+')) f += 'shift+'
  if (shortcut.includes('+')) f += shortcut.split('+').pop()?.toLowerCase()

  return f
}

export let setMetadata = (
  contents: string,
  overrides: {
    [key: string]: string
  }
) => {
  Object.entries(overrides).forEach(([key, value]) => {
    let k = key[0].toUpperCase() + key.slice(1)
    // if not exists, then add
    if (!contents.match(new RegExp(`^\/\/\\s*(${key}|${k}):.*`, 'gm'))) {
      // uppercase first letter
      contents = `// ${k}: ${value}
${contents}`.trim()
    } else {
      // if exists, then replace
      contents = contents.replace(new RegExp(`^\/\/\\s*(${key}|${k}):.*$`, 'gm'), `// ${k}: ${value}`)
    }
  })
  return contents
}

// Exhaustive, compile-time-checked list of metadata keys.
// `satisfies` ensures every entry is a valid `keyof Metadata` **and**
// warns if we add an invalid key. Missing keys will surface when hovering the
// `_MissingKeys` helper type during development.
const META_KEYS = [
  "author",
  "name",
  "description",
  "enter",
  "alias",
  "image",
  "emoji",
  "shortcut",
  "shortcode",
  "trigger",
  "snippet", // Keep deprecated for now
  "expand",
  "keyword",
  "pass",
  "group",
  "exclude",
  "watch",
  "log",
  "background",
  "system",
  "schedule",
  "index",
  "access",
  "response",
  "tag",
  "longRunning",
  "mcp",
  'timeout',
  'cache',
  'bin'
] as const satisfies readonly (keyof Metadata)[];

// Optional development-time check for forgotten keys.
type _MissingKeys = Exclude<keyof Metadata, typeof META_KEYS[number]>; // should be never

export const VALID_METADATA_KEYS_SET: ReadonlySet<keyof Metadata> = new Set(META_KEYS);

const getMetadataFromComments = (contents: string): Record<string, any> => {
  const lines = contents.split('\n')
  const metadata = {}
  let commentStyle = null
  let inMultilineComment = false
  let multilineCommentEnd = null

  // Valid metadata key pattern: starts with a letter, can contain letters, numbers, and underscores
  const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  // Common prefixes to ignore
  const ignoreKeyPrefixes = ['TODO', 'FIXME', 'NOTE', 'HACK', 'XXX', 'BUG']

  // Regex to match comment lines with metadata
  const commentRegex = {
    '//': /^\/\/\s*([^:]+):(.*)$/,
    '#': /^#\s*([^:]+):(.*)$/
  }

  for (const line of lines) {
    // Check for the start of a multiline comment block
    if (
      !inMultilineComment &&
      (line.trim().startsWith('/*') ||
        line.trim().startsWith("'''") ||
        line.trim().startsWith('"""') ||
        line.trim().match(/^: '/))
    ) {
      inMultilineComment = true
      multilineCommentEnd = line.trim().startsWith('/*')
        ? '*/'
        : line.trim().startsWith(": '")
          ? "'"
          : line.trim().startsWith("'''")
            ? "'''"
            : '"""'
    }

    // Check for the end of a multiline comment block
    if (inMultilineComment && line.trim().endsWith(multilineCommentEnd)) {
      inMultilineComment = false
      multilineCommentEnd = null
      continue // Skip the end line of a multiline comment block
    }

    // Skip lines that are part of a multiline comment block
    if (inMultilineComment) continue

    // Determine comment style and try to match metadata
    let match = null
    if (line.startsWith('//')) {
      match = line.match(commentRegex['//'])
      commentStyle = '//'
    } else if (line.startsWith('#')) {
      match = line.match(commentRegex['#'])
      commentStyle = '#'
    }

    if (!match) continue

    // Extract and trim the key and value
    const [, rawKey, value] = match
    const trimmedKey = rawKey.trim()
    const trimmedValue = value.trim()

    // Skip if key starts with common prefixes to ignore
    if (ignoreKeyPrefixes.some(prefix => trimmedKey.toUpperCase().startsWith(prefix))) continue

    // Skip if key doesn't match valid pattern
    if (!validKeyPattern.test(trimmedKey)) continue

    // Transform the key case
    let key = trimmedKey
    if (key?.length > 0) {
      key = key[0].toLowerCase() + key.slice(1)
    }

    // Skip empty keys or values
    if (!key || !trimmedValue) {
      continue
    }

    let parsedValue: string | boolean | number
    let lowerValue = trimmedValue.toLowerCase()
    let lowerKey = key.toLowerCase()
    switch (true) {
      case lowerValue === 'true':
        parsedValue = true
        break
      case lowerValue === 'false':
        parsedValue = false
        break
      case lowerKey === 'timeout':
        parsedValue = Number.parseInt(trimmedValue, 10)
        break
      default:
        parsedValue = trimmedValue
    }

    // Only assign if the key hasn't been assigned before AND is in the valid set
    // Cast key to keyof Metadata because Set.has expects this type due to Set<keyof Metadata>.
    // We trust the string `key` corresponds if .has returns true.
    if (!(key in metadata) && VALID_METADATA_KEYS_SET.has(key as keyof Metadata)) {
      metadata[key] = parsedValue
    }
  }

  return metadata
}

function parseTypeScript(code: string) {
  const parser = Parser.extend(
    // @ts-expect-error Somehow these are not 100% compatible
    tsPlugin({ allowSatisfies: true })
  )
  return parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest'
  })
}

function isOfType<T extends { type: string }, TType extends string>(node: T, type: TType): node is T & { type: TType } {
  return node.type === type
}

function parseMetadataProperties(properties: ObjectExpression['properties']) {
  return properties.reduce((acc, prop) => {
    if (!isOfType(prop, 'Property')) {
      throw Error('Not a Property')
    }

    const key = prop.key
    const value = prop.value

    if (!isOfType(key, 'Identifier')) {
      throw Error('Key is not an Identifier')
    }

    // Handle both Literal and TemplateLiteral
    if (isOfType(value, 'Literal')) {
      acc[key.name] = value.value
    } else if (isOfType(value, 'TemplateLiteral')) {
      // For template literals, concatenate all the quasi elements
      // Template literals without expressions will have quasis with the full content
      if (value.expressions.length === 0 && value.quasis.length === 1) {
        // Simple template literal without expressions
        acc[key.name] = value.quasis[0].value.cooked
      } else {
        // Template literal with expressions - throw an error with helpful message
        throw Error(`Template literals with expressions are not supported in metadata. The metadata.${key.name} property contains a template literal with ${value.expressions.length} expression(s). Please use a plain string or a template literal without expressions.`)
      }
    } else {
      throw Error(`value is not a Literal or TemplateLiteral, but a ${value.type}`)
    }

    return acc
  }, {})
}

function getMetadataFromExport(ast: Program): Partial<Metadata> {
  for (const node of ast.body) {
    const isExpressionStatement = isOfType(node, 'ExpressionStatement')

    if (isExpressionStatement) {
      const expression = node.expression as AssignmentExpression

      const isMetadata = (expression.left as Identifier).name === 'metadata'
      const isEquals = expression.operator === '='
      const properties = (expression.right as ObjectExpression).properties

      const isGlobalMetadata = isMetadata && isEquals

      if (isGlobalMetadata) {
        return parseMetadataProperties(properties)
      }
    }

    const isExportNamedDeclaration = isOfType(node, 'ExportNamedDeclaration')

    if (!isExportNamedDeclaration || !node.declaration) {
      continue
    }

    const declaration = node.declaration

    if (declaration.type !== 'VariableDeclaration' || !declaration.declarations[0]) {
      continue
    }

    const namedExport = declaration.declarations[0]

    if (!('name' in namedExport.id) || namedExport.id.name !== 'metadata') {
      continue
    }

    if (namedExport.init?.type !== 'ObjectExpression') {
      continue
    }

    const properties = namedExport.init?.properties

    return parseMetadataProperties(properties)
  }

  // Nothing found
  return {}
}

//app
export let getMetadata = (contents: string): Metadata => {
  const fromComments = getMetadataFromComments(contents)

  // if (
  //   !/(const|var|let) metadata/g.test(contents) &&
  //   !/^metadata = {/g.test(contents)
  // ) {
  //   // No named export in file, return early
  //   return fromComments
  // }

  let ast: Program
  try {
    ast = parseTypeScript(contents)
  } catch (err) {
    // TODO: May wanna introduce some error handling here. In my script version, I automatically added an error
    //  message near the top of the user's file, indicating that their input couldn't be parsed...
    //  acorn-typescript unfortunately doesn't support very modern syntax, like `const T` generics.
    //  But it works in most cases.
    return fromComments
  }

  try {
    const fromExport = getMetadataFromExport(ast)
    return { ...fromComments, ...fromExport }
  } catch (err) {
    return fromComments
  }
}

export let getLastSlashSeparated = (string: string, count: number) => {
  return string.replace(/\/$/, '').split('/').slice(-count).join('/') || ''
}

export let kenvFromFilePath = (filePath: string) => {
  let { dir } = path.parse(filePath)
  let { name: scriptsName, dir: kenvDir } = path.parse(dir)
  if (scriptsName !== 'scripts') return '.kit'
  let { name: kenv } = path.parse(kenvDir)
  if (path.relative(kenvDir, kenvPath()) === '') return ''
  return kenv
}

//app
export let getLogFromScriptPath = (filePath: string) => {
  let { name, dir } = path.parse(filePath)
  let { name: scriptsName, dir: kenvDir } = path.parse(dir)
  if (scriptsName !== 'scripts') return kitPath('logs', 'main.log')

  return path.resolve(kenvDir, 'logs', `${name}.log`)
}

//new RegExp(`(^//([^(:|\W)]+

export let stripMetadata = (fileContents: string, exclude: string[] = []) => {
  let excludeWithCommon = [`http`, `https`, `TODO`, `FIXME`, `NOTE`].concat(exclude);

  // Regex to capture the metadata key and the colon
  // It matches lines starting with //, followed by a key (word characters), then a colon.
  // It uses a negative lookbehind for exclusions.
  const regex = new RegExp(
    `^(//\\s*([^(:|\\W|\\n)]+${exclude.length ? `(?<!\\b(${excludeWithCommon.join('|')})\\b)` : ''}):).*$\n?`,
    'gim'
  );

  return fileContents.replace(regex, (match, group1) => {
    // group1 contains the key part like "// Name:" or "// Shortcode:"
    // We want to keep this part and just remove the value after it, then add a newline.
    return `${group1.trimEnd()}\n`;
  });
}

export let stripName = (name: string) => {
  let strippedName = path.parse(name).name
  strippedName = strippedName.trim().replace(/\s+/g, '-')
  // Only lowercase if there's no hyphen in the original input
  if (!name.includes('-')) {
    strippedName = strippedName.toLowerCase()
  }
  strippedName = strippedName.replace(/[^\w-]+/g, '')
  strippedName = strippedName.replace(/-{2,}/g, '-')
  return strippedName
}

//validator
export let checkIfCommandExists = async (input: string) => {
  if (await isBin(kenvPath('bin', input))) {
    return global.chalk`{red.bold ${input}} already exists. Try again:`
  }

  if (await isDir(kenvPath('bin', input))) {
    return global.chalk`{red.bold ${input}} exists as group. Enter different name:`
  }

  if (await isBin(input)) {
    return global.chalk`{red.bold ${input}} is a system command. Enter different name:`
  }

  if (!input.match(/^([a-z]|[0-9]|\-|\/)+$/g)) {
    return global.chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
  }

  return true
}

export let getKenvs = async (ignorePattern = /^ignore$/): Promise<string[]> => {
  if (!(await isDir(kenvPath('kenvs')))) return []

  let dirs = await readdir(kenvPath('kenvs'), {
    withFileTypes: true
  })

  let kenvs = []
  for (let dir of dirs) {
    if (!dir.name.match(ignorePattern) && (dir.isDirectory() || dir.isSymbolicLink())) {
      kenvs.push(kenvPath('kenvs', dir.name))
    }
  }

  return kenvs
}

export let kitMode = () => (process.env.KIT_MODE || 'ts').toLowerCase()

global.__kitRun = false

let kitGlobalRunCount = 0
export let run = async (command: string, ...commandArgs: string[]) => {
  performance.mark('run')
  kitGlobalRunCount++
  let kitLocalRunCount = kitGlobalRunCount

  let scriptArgs = []
  let script = ''
  let match
  // This regex splits the command string into parts:
  // - Matches single-quoted strings: '[^']+?'
  // - Matches double-quoted strings: "[^"]+?"
  // - Matches one or more whitespace characters: \s+
  // This allows us to preserve quoted arguments as single units
  let splitRegex = /('[^']+?')|("[^"]+?")|\s+/
  let quoteRegex = /'|"/g
  let parts = command.split(splitRegex).filter(Boolean)

  for (let item of parts) {
    if (!script) {
      script = item.replace(quoteRegex, '')
    } else if (!item.match(quoteRegex)) {
      scriptArgs.push(...item.trim().split(/\s+/))
    } else {
      scriptArgs.push(item.replace(quoteRegex, ''))
    }
  }
  // In case a script is passed with a path, we want to use the full command
  if (script.includes(path.sep)) {
    script = command
    scriptArgs = []
  }
  let resolvedScript = resolveToScriptPath(script)
  global.projectPath = (...args) => path.resolve(path.dirname(path.dirname(resolvedScript)), ...args)

  global.onTabs = []
  global.kitScript = resolvedScript
  global.kitCommand = resolveScriptToCommand(resolvedScript)
  let realProjectPath = projectPath()
  updateEnv(realProjectPath)
  if (process.env.KIT_CONTEXT === 'app') {
    let script = await parseScript(global.kitScript)

    if (commandArgs.includes(`--${cmd}`)) {
      script.debug = true
      global.send(Channel.DEBUG_SCRIPT, script)

      return await Promise.resolve('Debugging...')
    }

    cd(realProjectPath)

    global.send(Channel.SET_SCRIPT, script)
  }

  let result = await global.attemptImport(resolvedScript, ...scriptArgs, ...commandArgs)

  global.flag.tab = ''

  return result
}

export let updateEnv = (scriptProjectPath: string) => {
  let { parsed, error } = config({
    node_env: process.env.NODE_ENV || 'development',
    path: scriptProjectPath,
    silent: true
  })

  if (parsed) {
    assignPropsTo(process.env, global.env)
  }

  if (error) {
    let isCwdKenv = path.normalize(cwd()) === path.normalize(kenvPath())
    if (isCwdKenv && !error?.message?.includes('files matching pattern') && !process.env.CI) {
      global.log(error.message)
    }
  }
}

export let configEnv = () => {
  let { parsed, error } = config({
    node_env: process.env.NODE_ENV || 'development',
    path: process.env.KIT_DOTENV_PATH || kenvPath(),
    silent: true
  })

  if (error) {
    let isCwdKenv = path.normalize(cwd()) === path.normalize(kenvPath())
    if (isCwdKenv && !error?.message?.includes('files matching pattern') && !process.env.CI) {
      global.log(error.message)
    }
  }

  process.env.PATH_FROM_DOTENV = combinePath([parsed?.PATH || process.env.PATH])

  process.env.PATH = combinePath([process.env.PARSED_PATH, KIT_FIRST_PATH])

  assignPropsTo(process.env, global.env)

  return parsed
}

export let trashScriptBin = async (script: Script) => {
  let { command, kenv, filePath } = script
  let { pathExists } = await import('fs-extra')

  let binJSPath = isJsh()
    ? kenvPath('node_modules', '.bin', command + '.js')
    : kenvPath(kenv && `kenvs/${kenv}`, 'bin', command + '.js')

  let binJS = await pathExists(binJSPath)
  let { name, dir } = path.parse(filePath)
  let commandBinPath = path.resolve(path.dirname(dir), 'bin', name)

  if (process.platform === 'win32') {
    if (!commandBinPath.endsWith('.cmd')) {
      commandBinPath += '.cmd'
    }
  }

  if (binJS) {
    let binPath = isJsh() ? kenvPath('node_modules', '.bin', command) : commandBinPath

    await global.trash([binPath, ...(binJS ? [binJSPath] : [])])
  }

  if (await pathExists(commandBinPath)) {
    await global.trash(commandBinPath)
  }
}

export let trashScript = async (script: Script) => {
  let { filePath } = script

  await trashScriptBin(script)

  let { pathExists } = await import('fs-extra')

  await global.trash([...((await pathExists(filePath)) ? [filePath] : [])])

  await wait(100)
}

export let getScriptFiles = async (kenv = kenvPath()) => {
  let scriptsPath = path.join(kenv, 'scripts')
  try {
    let dirEntries = await readdir(scriptsPath)
    let scriptFiles: string[] = []
    for (let fileName of dirEntries) {
      if (!fileName.startsWith('.')) {
        let fullPath = path.join(scriptsPath, fileName)
        if (path.extname(fileName)) {
          scriptFiles.push(fullPath)
        } else {
          try {
            let stats = await lstat(fullPath)
            if (!stats.isDirectory()) {
              scriptFiles.push(fullPath)
            }
          } catch (error) {
            log(error)
          }
        }
      }
    }
    return scriptFiles
  } catch {
    return []
  }
}

export let scriptsSort = (timestamps: Stamp[]) => (a: Script, b: Script) => {
  let aTimestamp = timestamps.find((t) => t.filePath === a.filePath)
  let bTimestamp = timestamps.find((t) => t.filePath === b.filePath)

  if (aTimestamp && bTimestamp) {
    return bTimestamp.timestamp - aTimestamp.timestamp
  }

  if (aTimestamp) {
    return -1
  }

  if (bTimestamp) {
    return 1
  }

  if (a?.index || b?.index) {
    if ((a?.index || 9999) < (b?.index || 9999)) {
      return -1
    }
    return 1
  }

  let aName = (a?.name || '').toLowerCase()
  let bName = (b?.name || '').toLowerCase()

  return aName > bName ? 1 : aName < bName ? -1 : 0
}

export let isParentOfDir = (parent: string, dir: string) => {
  let relative = path.relative(parent, dir)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export let isInDir = (parentDir: string) => (dir: string) => {
  const relative = path.relative(parentDir, dir)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export let escapeShortcut: Shortcut = {
  name: `Escape`,
  key: `escape`,
  bar: 'left',
  onPress: async () => {
    exit()
  }
}

export let backToMainShortcut: Shortcut = {
  name: `Back`,
  key: `escape`,
  bar: 'left',
  onPress: async () => {
    await mainScript()
  }
}

export let closeShortcut: Shortcut = {
  name: 'Exit',
  key: `${cmd}+w`,
  bar: 'right',
  onPress: () => {
    exit()
  }
}

export let editScriptShortcut: Shortcut = {
  name: 'Edit Script',
  key: `${cmd}+o`,
  onPress: async (input, { script }) => {
    await run(kitPath('cli', 'edit-script.js'), script?.filePath)
    exit()
  },
  bar: 'right'
}

export let submitShortcut: Shortcut = {
  name: 'Submit',
  key: `${cmd}+s`,
  bar: 'right',
  onPress: async (input) => {
    await submit(input)
  }
}

export let viewLogShortcut: Shortcut = {
  name: 'View Log',
  key: `${cmd}+l`,
  onPress: async (input, { focused }) => {
    await run(kitPath('cli', 'open-script-log.js'), focused?.value?.scriptPath)
  },
  bar: 'right',
  visible: true
}

export let terminateProcessShortcut: Shortcut = {
  name: 'Terminate Process',
  key: `${cmd}+enter`,
  onPress: async (input, { focused }) => {
    await sendWait(Channel.TERMINATE_PROCESS, focused?.value?.pid)
  },
  bar: 'right',
  visible: true
}

export let terminateAllProcessesShortcut: Shortcut = {
  name: 'Terminate All Processes',
  key: `${cmd}+shift+enter`,
  onPress: async () => {
    await sendWait(Channel.TERMINATE_ALL_PROCESSES)
  },
  bar: 'right',
  visible: true
}

export let smallShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut
]

export let argShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  editScriptShortcut
]

export let editorShortcuts: Shortcut[] = [closeShortcut, editScriptShortcut, submitShortcut]

export let defaultShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  editScriptShortcut,
  submitShortcut
]

export let divShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut,
  {
    ...editScriptShortcut,
    bar: ''
  }
]

export let formShortcuts: Shortcut[] = [
  // escapeShortcut,
  {
    ...editScriptShortcut,
    bar: ''
  },
  closeShortcut,
  {
    name: 'Reset',
    key: `${cmd}+alt+r`,
    bar: ''
  }
]

export let cliShortcuts: Shortcut[] = [
  // escapeShortcut,
  closeShortcut
]

let kitFilePath = (...paths: string[]) => pathToFileURL(kitPath('images', ...paths)).href
let iconPath = kitFilePath('icon.svg')
let kentPath = kitFilePath('kent.jpg')
let mattPath = kitFilePath('matt.jpg')

const checkmarkStyles = `
  <style>
    .checkmark-list {
      list-style-type: none !important;
      padding-left: 0 !important;
    }
    .checkmark-list li {
      padding-left: 1.5em;
      position: relative;
    }
    .checkmark-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--color-primary);
    }
    .checkmark-list li::marker {
      content: none !important;
    }
  </style>
`
export let proPane = () =>
  `
  ${checkmarkStyles}


<svg width="0" height="0">
  <defs>
    <filter id="dropShadow" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceAlpha" dx="0" dy="3" />
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
</svg>

<div class="px-8">
<div class="flex flex-col items-center">
  <img src="${iconPath}" alt="Script Kit Pro" class="mx-auto mt-4 mb-3"  style="width: 50px; height: 50px; filter: url(#dropShadow);">
  <h3 class="text-2xl font-bold my-1">Script Kit Pro</h3>
  <p class="text-lg -mt-1">$7 / month</p>
  <a href="submit:pro" class="shadow-lg shadow-primary/25 max-w-52 text-center text-bg-base font-bold px-3 py-3 h-12 no-underline rounded bg-primary bg-opacity-100 hover:shadow-md hover:shadow-primary/10">Unlock All Features</a>
  <p class="text-xs mt-3">Cancel anytime</p>
</div>

<hr class="mt-4 -mb-2">

<div class="flex">
  <div class="list-inside flex-1">
    <h3 class="text-xl font-bold">Pro Features</h3>
    <ul class="checkmark-list">
    <li>Unlimited Active Prompts</li>
    <li>Built-in Debugger</li>
    <li>Script Log Window</li>
    <li>Vite Widgets</li>
    <li>Webcam Capture</li>
    <li>Basic Screenshots</li>
    <li>Desktop Color Picker</li>
    <li>Support through Discord</li>
    </ul>
  </div>

  <div class="list-inside flex-1">
    <h3 class="text-xl font-bold">Planned Features...</h3>
    <ul class="checkmark-list">
      <li>Sync Scripts to GitHub Repo</li>
      <li>Run Script Remotely as GitHub Actions</li>
      <li>Advanced Screenshots</li>
      <li>Screen Recording</li>      
      <li>Measure Tool</li>
    </ul>
  </div>
</div>

<hr class="my-4">

<h3 class="text-xl font-bold">What the community is saying</h3>
<div class="flex flex-row">
  
  <div class="flex flex-col w-1/2 pr-8">
    <div class="flex flex-row items-center -mb-2">
    <img src="${kentPath}" alt="Kent C. Dodds" class="rounded-full mx-auto" style="width: 40px; height: 40px;">
    <p class="font-bold text-lg ml-2 mb-0">Kent C. Dodds</p>
    </div>
    <p class="text-sm text-left">I forgot that a lot of people don't know what Script Kit is. <strong>You're missing out!</strong> I use it to easily open projects in VSCode, start a zoom meeting and put the link in my clipboard, download Twitter images, upload images to cloudinary, and so much more!</p>
  </div>


  <div class="flex flex-col w-1/2">
  <div class="flex flex-row items-center -mb-2">
    <img src="${mattPath}" alt="Matt Pocock" class="rounded-full mx-auto" style="width: 40px; height: 40px;">
    <p class="font-bold text-lg ml-2 mb-0">Matt Pocock</p>
    </div>
    <p class="text-sm text-left">So, <strong>Script Kit is AMAZING.</strong> Just spent a very happy morning figuring out a script where it takes my latest recording from OBS and trims the silence from the start and end with ffmpeg. Now, it's just a command palette action away.</p>
  </div>
  </div>
  
  </div>
`

export const getShellSeparator = () => {
  let separator = '&&'
  if (process.platform === 'win32') {
    separator = '&'
  }
  // if powershell
  if (
    process.env.KIT_SHELL?.includes('pwsh') ||
    process.env.KIT_SHELL?.includes('powershell') ||
    process.env.SHELL?.includes('pwsh') ||
    process.env.SHELL?.includes('powershell') ||
    process.env.ComSpec?.includes('powershell') ||
    process.env.ComSpec?.includes('pwsh')
  ) {
    separator = ';'
  }

  if (process.env.KIT_SHELL?.includes('fish') || process.env.SHELL?.includes('fish')) {
    separator = ';'
  }

  return separator
}

export let getTrustedKenvsKey = () => {
  let username = process.env?.USER || process.env?.USERNAME || 'NO_USER_ENV_FOUND'

  let formattedUsername = username.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()

  let trustedKenvKey = `KIT_${formattedUsername}_DANGEROUSLY_TRUST_KENVS`

  return trustedKenvKey
}

export const uniq = (array: any[]): any[] => {
  if (!Array.isArray(array)) {
    throw new Error('Input should be an array')
  }
  return [...new Set(array)]
}

interface DebounceSettings {
  leading?: boolean
  trailing?: boolean
}

type Procedure = (...args: any[]) => void

type DebouncedFunc<T extends Procedure> = (...args: Parameters<T>) => void

export const debounce = <T extends Procedure>(
  func: T,
  waitMilliseconds = 0,
  options: DebounceSettings = {}
): DebouncedFunc<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return (...args: Parameters<T>) => {
    const doLater = () => {
      timeoutId = undefined
      // If trailing is enabled, we invoke the function only if the function was invoked during the wait period
      if (options.trailing !== false) {
        func(...args)
      }
    }

    const shouldCallNow = options.leading && timeoutId === undefined

    // Always clear the timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(doLater, waitMilliseconds)

    // If leading is enabled and no function call has been scheduled, we call the function immediately
    if (shouldCallNow) {
      func(...args)
    }
  }
}

export const range = (start: number, end: number, step = 1): number[] => {
  return Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step)
}

type Iteratee<T> = ((item: T) => any) | keyof T

export let sortBy = <T>(collection: T[], iteratees: Iteratee<T>[]): T[] => {
  const iterateeFuncs = iteratees.map((iteratee) =>
    typeof iteratee === 'function' ? iteratee : (item: T) => item[iteratee as keyof T]
  )

  return [...collection].sort((a, b) => {
    for (const iteratee of iterateeFuncs) {
      const valueA = iteratee(a)
      const valueB = iteratee(b)

      if (valueA < valueB) {
        return -1
      } else if (valueA > valueB) {
        return 1
      }
    }

    return 0
  })
}

export let isUndefined = (value: any): value is undefined => {
  return value === undefined
}

export let isString = (value: any): value is string => {
  return typeof value === 'string'
}

export let getCachePath = (filePath: string, type: string) => {
  // Normalize file path
  const normalizedPath = path.normalize(filePath)

  // Replace all non-alphanumeric characters and path separators with dashes
  let dashedName = normalizedPath.replace(/[^a-zA-Z0-9]/g, '-')

  // Remove leading dashes
  while (dashedName.charAt(0) === '-') {
    dashedName = dashedName.substr(1)
  }

  // Replace multiple consecutive dashes with a single dash
  dashedName = dashedName.replace(/-+/g, '-')

  // Append .json extension
  return kitPath('cache', type, `${dashedName}.json`)
}

export let adjustPackageName = (packageName: string) => {
  let adjustedPackageName = ''
  if (packageName.startsWith('@')) {
    let parts = packageName.split('/')
    adjustedPackageName = `${parts[0]}/${parts[1]}`
  } else {
    adjustedPackageName = packageName.split('/')[0]
  }

  return adjustedPackageName
}

export let keywordInputTransformer = (keyword: string) => {
  if (!keyword) return (input: string) => input

  let keywordRegex = new RegExp(`(?<=${global.arg.keyword}\\s)(.*)`, 'gi')

  return (input: string) => {
    return input.match(keywordRegex)?.[0] || ''
  }
}

export let escapeHTML = (text: string) => {
  // Handle null or undefined input
  if (!text || typeof text !== 'string') return ''

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  // Perform HTML escape on the updated text
  text = text.replace(/[&<>"']/g, function (m) {
    return map[m]
  })

  // Convert tabs to spaces
  text = text.replace(/\t/g, '    ')

  // Convert newline characters to <br/>
  return text.replace(/\n/g, '<br/>')
}

// Optimized for worker: larger batch size, no retries for local ops, fast path for small arrays
export let processInBatches = async <T>(items: Promise<T>[], batchSize: number = 500, maxRetries = 0): Promise<T[]> => {
  if (!items.length) return []
  if (items.length <= batchSize) {
    return Promise.all(items)
  }
  let result: T[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch)
    result = result.concat(batchResults.filter((item): item is Awaited<T> => item !== undefined))
  }
  return result
}

export let md = (content = '', containerClasses = 'p-5 prose prose-sm') => {
  return globalMd(content + '\n', containerClasses)
}

export let highlight = async (markdown: string, containerClass = 'p-5 leading-loose', injectStyles = '') => {
  let { default: highlight } = global.__kitHighlight || (await import('highlight.js'))
  if (!global.__kitHighlight) global.__kitHighlight = { default: highlight }

  let renderer = new marked.Renderer()
  renderer.paragraph = (p) => {
    // Convert a tag with href .mov, .mp4, or .ogg video links to video tags
    const text = p.text || ''
    if (text.match(/<a href=".*\.(mov|mp4|ogg)">.*<\/a>/)) {
      let url = text.match(/href="(.*)"/)[1]
      return `<video controls src="${url}" style="max-width: 100%;"></video>`
    }

    return `<p>${p.text}</p>`
  }

  let highlightedMarkdown = marked(markdown)

  let result = `<div class="${containerClass}">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  ${injectStyles}
  </style>
  ${highlightedMarkdown}
</div>`

  return result
}

export let tagger = (script: Script) => {
  if (!script.tag) {
    let tags = []

    if (script.friendlyShortcut) {
      tags.push(script.friendlyShortcut)
    } else if (script.shortcut) {
      tags.push(friendlyShortcut(shortcutNormalizer(script.shortcut)))
    }

    if (script.kenv && script.kenv !== '.kit') {
      tags.push(script.kenv)
    }
    if (script.trigger) tags.push(`trigger: ${script.trigger}`)
    if (script.keyword) tags.push(`keyword: ${script.keyword}`)
    if (script.snippet) tags.push(`snippet ${script.snippet}`)
    if (script.expand) {
      tags.push(`expand: ${script.expand}`)
    }

    if (typeof script.pass === 'string' && script.pass !== 'true') {
      tags.push(script.pass.startsWith('/') ? `pattern: ${script.pass}` : `postfix: ${script.pass}`)
    }

    script.tag = tags.join(' ')
  }
}

export let getKenvFromPath = (filePath: string): string => {
  let normalizedPath = path.normalize(filePath)
  let normalizedKenvPath = path.normalize(kenvPath())

  if (!normalizedPath.startsWith(normalizedKenvPath)) {
    return ''
  }

  let relativePath = normalizedPath.replace(normalizedKenvPath, '')
  if (!relativePath.includes('kenvs')) {
    return ''
  }

  let parts = relativePath.split(path.sep)
  let kenvIndex = parts.indexOf('kenvs')
  return kenvIndex !== -1 && parts[kenvIndex + 1] ? parts[kenvIndex + 1] : ''
}

export let isScriptlet = (script: Script | Scriptlet): script is Scriptlet => {
  return 'scriptlet' in script
}

export let isSnippet = (script: Script): script is Snippet => {
  return 'text' in script || script?.filePath?.endsWith('.txt')
}

export let processPlatformSpecificTheme = (cssString: string): string => {
  const platform = process.platform
  const platformSuffix = platform === 'darwin' ? '-mac' : platform === 'win32' ? '-win' : '-other'

  // Split the CSS string into lines
  const lines = cssString.split('\n')

  // Process each line
  const processedLines = lines.map((line) => {
    // Check if the line contains a CSS variable
    if (line.includes('--') && line.includes(':')) {
      const parts = line.split(':')
      const variableName = parts[0].trim()

      // Check if the variable ends with a platform suffix
      if (variableName.endsWith('-mac') || variableName.endsWith('-win') || variableName.endsWith('-other')) {
        // If it matches the current platform, remove the suffix
        if (variableName.endsWith(platformSuffix)) {
          return `    ${variableName.slice(0, -platformSuffix.length)}: ${parts[1].trim()}`
        }
        // If it doesn't match, remove the line
        return null
      }
    }
    // If it's not a platform-specific variable, keep the line as is
    return line
  })

  // Join the processed lines, filtering out null values
  return processedLines.filter((line) => line !== null).join('\n')
}

export let infoPane = (title: string, description?: string) => {
  return `<div class="w-full h-full flex items-center justify-center -mt-4">
	<div class="text-center -mt-2">
		<h1 class="text-2xl font-bold">${title}</h1>
		<p class="text-sm text-secondary">${description}</p>
	</div>
</div>`
}

// TODO: Clean-up re-exports
export {
  parseScript,
  commandFromFilePath,
  getShebangFromContents,
  iconFromKenv,
  parseFilePath,
  parseMetadata,
  postprocessMetadata
} from './parser.js'

export {
  defaultGroupClassName,
  defaultGroupNameClassName,
  formatChoices
} from './format.js'

export { groupChoices } from './group.js'
export {
  parseScriptletsFromPath,
  parseMarkdownAsScriptlets,
  parseScriptlets
} from './scriptlets.js'

export { getSnippet, parseSnippets } from './snippets.js'

export {
  createPathResolver,
  home,
  kitPath,
  kenvPath,
  kitPnpmPath,
  kitDotEnvPath
} from './resolvers.js'

export {
  isBin,
  isFile,
  isJsh,
  isDir,
  isLinux,
  isMac,
  isWin
} from './is.js'
export {
  cmd,
  returnOrEnter,
  scriptsDbPath,
  timestampsPath,
  statsPath,
  prefsPath,
  promptDbPath,
  themeDbPath,
  userDbPath,
  tmpClipboardDir,
  tmpDownloadsDir,
  getMainScriptPath,
  kitDocsPath,
  KENV_SCRIPTS,
  KENV_APP,
  KENV_BIN,
  KIT_APP,
  KIT_APP_PROMPT,
  KIT_APP_INDEX,
  SHELL_TOOLS
} from './constants.js'
</file>

<file path=".github/workflows/release.yml">
name: Release kit.zip

on:
  push:
    branches:
      - main
      - beta
      - alpha
      - next
    tags:
      - "*"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-windows:
    runs-on: windows-latest
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Check node $PATH version
        shell: bash
        run: |
          node --version
          pnpm --version

      - name: pnpm i
        shell: bash
        run: |
          cd "${{ env.wd_path }}"
          pnpm i

      - name: pnpm build-kit
        shell: bash
        env:
          KIT: ${{ env.kit_path }}
        run: |
          pnpm build-kit

      - name: pnpm ava
        shell: bash
        env:
          KIT: ${{ env.kit_path }}
        run: |
          pnpm ava:ci

      - name: pnpm test
        uses: nick-invision/retry@v3
        with:
          max_attempts: 3
          timeout_minutes: 30
          command: |
            pnpm test
        env:
          KIT: ${{ env.kit_path }}

  test-mac-and-ubuntu:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Get Time
        id: time
        uses: nanzm/get-time-action@v2.0
        with:
          timeZone: 8
          format: "YYYY-MM-DD-HH-mm-ss"

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Build Kit
        run: |
          pnpm i
          export KIT_NODE_PATH=$(pnpm node -e )
          KIT=./.kit pnpm node ./build/build-ci.js
        env:
          KIT: ${{ env.kit_path }}

      - name: Add node and kit to PATH
        run: |
          echo "${{ env.kit_path }}/bin" >> $GITHUB_PATH
          echo "---"
          echo "$GITHUB_PATH"
          echo "$PATH"

      - name: Check node $PATH version
        run: |
          node --version
          npm --version

      - name: Log ./.kit
        run: |
          ls ./.kit/*/*

      - name: pnpm i
        run: |
          cd "${{ env.wd_path }}"
          pnpm i

      - name: Verify Types
        run: |
          mkdir -p ~/dev
          cd ~/dev
          git clone https://github.com/johnlindquist/kit-examples-ts.git
          cd kit-examples-ts
          pnpm i ${{ env.kit_path }}
          pnpm i typescript
          # Create temporary tsconfig for type checking
          echo '{
            "compilerOptions": {
              "skipLibCheck": true,
              "types": ["@johnlindquist/kit"],
              "typeRoots": ["./node_modules/@johnlindquist"],
              "module": "nodenext",
              "target": "esnext",
              "moduleResolution": "nodenext",
              "esModuleInterop": true
            }
          }' > tsconfig.temp.json

          echo "Running type check on all .ts files..."
          # Run tsc and store output
          TYPECHECK_OUTPUT=$(find ./scripts -name '*.ts' -exec pnpm exec tsc --project tsconfig.temp.json {} \; 2>&1)
          if [ $? -ne 0 ]; then
            echo "❌ Type checking failed:"
            echo "$TYPECHECK_OUTPUT"
            exit 1
          else
            echo "✅ Type checking passed for all files"
            echo "Files checked:"
            find ./scripts -name '*.ts' | wc -l
          fi

      - name: pnpm ava
        run: |
          pnpm ava:ci

      - name: pnpm test
        uses: nick-invision/retry@v3
        with:
          max_attempts: 3
          timeout_minutes: 30
          command: |
            pnpm test
        env:
          KIT: ${{ env.kit_path }}

  release:
    runs-on: macos-latest
    needs: [test-windows, test-mac-and-ubuntu]
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Get Time
        id: time
        uses: nanzm/get-time-action@v2.0
        with:
          timeZone: 8
          format: "YYYY-MM-DD-HH-mm-ss"

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Build Kit
        run: |
          pnpm install
          KIT=./.kit pnpm node ./build/build-ci.js

      - name: Add node and kit to PATH
        run: |
          echo "${{ env.kit_path }}/bin" >> $GITHUB_PATH
          echo "---"
          echo "$GITHUB_PATH"
          echo "$PATH"

      - name: Check node $PATH version
        run: |
          node --version
          pnpm --version

      - name: Semantic Release
        run: |
          cd "${{ env.wd_path }}"
          npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Archive Release
        uses: thedoctor0/zip-release@master
        with:
          filename: "kit.zip"
          path: ".kit"

      - name: Create Draft Release
        id: create_release
        uses: softprops/action-gh-release@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.time.outputs.time }}
          name: ${{ env.release_channel }}
          draft: true
          prerelease: false

      - name: Create and Upload Release
        uses: softprops/action-gh-release@v2
        with:
          files: ./kit.zip
          tag_name: ${{ steps.time.outputs.time }}
          name: ${{ env.release_channel }}
          draft: true
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: eregon/publish-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          release_id: ${{ steps.create_release.outputs.id }}
</file>

<file path="package.json">
{
  "name": "@johnlindquist/kit",
  "type": "module",
  "bin": {
    "kit": "bin/kit",
    "sk": "bin/sk",
    "kitblitz": "bin/kitblitz.mjs"
  },
  "engines": {
    "node": ">=14.8.0"
  },
  "version": "0.0.0-development",
  "description": "The Script Kit sdk",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/johnlindquist/kit.git"
  },
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./index.js",
      "default": "./index.js"
    },
    "./*": "./*",
    "./api/*": "./api/*.js",
    "./cli/*": "./cli/*.js",
    "./target/*": "./target/*.js",
    "./platform/*": "./platform/*.js",
    "./run/*": "./run/*.js",
    "./core/*": "./core/*.js",
    "./workers": "./workers/index.js",
    "./types/*": "./types/*.js"
  },
  "types": "./types/index.d.ts",
  "scripts": {
    "ava": "ava --config ./test/ava.config.mjs --fail-fast",
    "ava:ci": "ava --config ./test/ava.config.mjs",
    "ava:watch": "ava --watch --no-worker-threads --config ./test/ava.config.mjs",
    "ava:reset": "ava reset-cache --config ./test/ava.config.mjs",
    "ava:debug": "ava debug --config ./test/ava.config.mjs",
    "coverage": "c8 --reporter=text --reporter=html npm run ava",
    "coverage:v8": "c8 --reporter=text --reporter=lcov --reporter=html npm run ava",
    "build-kit": "tsx ./build/build-kit.ts",
    "build": "tsx ./build/build-kit.ts",
    "verify": "tsc --noEmit -p tsconfig.verify.json",
    "commit": "cz",
    "rebuild-kit": "tsx ./build/rebuild-kit.ts",
    "download-md": "node ./build/download-md.js",
    "declaration": "tsc -p ./tsconfig-declaration.json --watch",
    "pretest:core": "node ./scripts/test-pre.js",
    "test:core": "cross-env NODE_NO_WARNINGS=1 ava ./src/core/*.test.js --no-worker-threads",
    "posttest:core": "node ./scripts/test-post.js",
    "pretest:kit": "node ./scripts/test-pre.js",
    "test:kit": "cross-env NODE_NO_WARNINGS=1 ava ./src/api/kit.test.js --no-worker-threads",
    "pretest:sdk": "node ./scripts/test-pre.js",
    "test:sdk": "cross-env NODE_NO_WARNINGS=1 ava ./test-sdk/*.test.js --no-worker-threads",
    "posttest:sdk": "node ./scripts/test-post.js",
    "pretest:api": "node ./scripts/test-pre.js",
    "test:api": "cross-env NODE_NO_WARNINGS=1 ava ./src/api/*.test.js --no-worker-threads",
    "posttest:api": "node ./scripts/test-post.js",
    "pretest:metadata": "node ./scripts/test-pre.js",
    "test:metadata": "cross-env NODE_NO_WARNINGS=1 ava ./src/core/metadata.test.js --no-worker-threads",
    "posttest:metadata": "node ./scripts/test-post.js",
    "pretest": "node ./scripts/test-pre.js",
    "test": "cross-env NODE_NO_WARNINGS=1 ava --no-worker-threads --fail-fast",
    "posttest": "node ./scripts/test-post.js",
    "build-editor-types": "tsx ./build/build-editor-types.ts",
    "rebuild-test": "npm run rebuild-kit && npm run test -- --fail-fast",
    "lazy-install": "npm i esbuild@0.23.1 --save-exact --production --prefer-dedupe --loglevel=verbose",
    "preinstall": "node ./build/preinstall.js"
  },
  "author": "John Lindquist (https://johnlindquist.com)",
  "license": "ISC",
  "pnpm": {
    "overrides": {
      "typescript": "5.8.3",
      "esbuild": "0.25.5"
    }
  },
  "dependencies": {
    "@ai-sdk/anthropic": "2.0.0-beta.5",
    "@ai-sdk/google": "2.0.0-beta.8",
    "@ai-sdk/openai": "2.0.0-beta.7",
    "@ai-sdk/react": "2.0.0-beta.16",
    "@ai-sdk/xai": "2.0.0-beta.4",
    "@johnlindquist/open": "^10.1.1",
    "@modelcontextprotocol/sdk": "1.13.3",
    "@octokit/auth-oauth-device": "8.0.1",
    "@octokit/core": "7.0.2",
    "@octokit/plugin-paginate-rest": "13.0.0",
    "@octokit/plugin-rest-endpoint-methods": "15.0.0",
    "@octokit/plugin-retry": "8.0.1",
    "@octokit/plugin-throttling": "11.0.1",
    "@openrouter/ai-sdk-provider": "1.0.0-beta.1",
    "@types/chalk": "2.2.4",
    "@types/download": "8.0.5",
    "@types/fs-extra": "11.0.4",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@types/shelljs": "0.8.17",
    "@typescript/lib-dom": "npm:@johnlindquist/no-dom@^1.0.2",
    "acorn": "^8.15.0",
    "acorn-typescript": "^1.4.13",
    "advanced-calculator": "1.1.1",
    "ai": "5.0.0-beta.18",
    "axios": "1.10.0",
    "body-parser": "^2.2.0",
    "bottleneck": "^2.19.5",
    "chalk": "5.4.1",
    "chalk-template": "1.1.0",
    "chrome-trace-event": "^1.0.4",
    "color-name": "2.0.0",
    "date-fns": "4.1.0",
    "dotenv": "^17.0.1",
    "dotenv-flow": "4.1.0",
    "download": "8.0.0",
    "enquirer": "2.4.1",
    "esbuild": "0.25.5",
    "execa": "9.6.0",
    "filesize": "10.1.6",
    "fs-extra": "^11.3.0",
    "globby": "^14.1.0",
    "handlebars": "4.7.8",
    "highlight.js": "^11.11.1",
    "isomorphic-git": "1.32.1",
    "jsonfile": "6.1.0",
    "keyv": "^5.3.4",
    "keyv-file": "^5.1.2",
    "lowdb": "7.0.1",
    "marked": "15.0.12",
    "marked-extended-tables": "2.0.1",
    "marked-gfm-heading-id": "4.1.1",
    "marked-highlight": "2.2.1",
    "minimist": "1.2.8",
    "open": "10.1.2",
    "p-retry": "6.2.1",
    "project-name-generator": "2.1.9",
    "quick-score": "^0.2.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "replace-in-file": "8.3.0",
    "rimraf": "6.0.1",
    "safe-stable-stringify": "^2.5.0",
    "shelljs": "0.10.0",
    "slugify": "1.6.6",
    "source-map-support": "^0.5.21",
    "strip-ansi": "7.1.0",
    "suggestion": "2.1.2",
    "tmp-promise": "3.0.3",
    "untildify": "5.0.0",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@types/debug": "4.1.12",
    "@types/node": "^22.15.30",
    "@types/node-ipc": "9.2.3",
    "@types/sinon": "17.0.4",
    "acorn-walk": "8.3.4",
    "ava": "^6.4.0",
    "c8": "10.1.3",
    "cross-env": "^7.0.3",
    "cz-conventional-changelog": "^3.3.0",
    "debug": "4.4.1",
    "husky": "^9.1.7",
    "node-stream-zip": "^1.15.0",
    "semantic-release": "24.2.6",
    "semantic-release-plugin-update-version-in-files": "2.0.0",
    "sinon": "20.0.0",
    "tsc-watch": "7.1.1",
    "tsx": "4.20.3",
    "typescript": "5.8.3",
    "unzipper": "0.12.3",
    "vite": "6.3.5"
  },
  "ava": {
    "environmentVariables": {
      "KIT_TEST": "true"
    },
    "verbose": true,
    "files": [
      "src/**/*.test.js",
      "test/**/*.test.js",
      "test-sdk/**/*.test.js"
    ]
  },
  "release": {
    "branches": [
      "+([0-9]).x",
      "main",
      "next",
      {
        "name": "beta",
        "prerelease": true
      },
      {
        "name": "alpha",
        "prerelease": true
      }
    ],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/npm",
        {
          "pkgRoot": "./.kit"
        }
      ],
      [
        "semantic-release-plugin-update-version-in-files",
        {
          "files": [
            "./.kit/package.json"
          ]
        }
      ]
    ]
  },
  "volta": {
    "node": "22.17.1"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  },
  "optionalDependencies": {
    "@johnlindquist/mac-windows": "1.0.2",
    "file-icon": "5.1.1",
    "get-app-icon": "1.0.1"
  },
  "packageManager": "pnpm@10.13.1"
}
</file>

</files>
