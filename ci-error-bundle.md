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
- Only files matching these patterns are included: src/api/kit.ts, test-sdk/*.js, test-sdk/*.config.js, scripts/test-*.js, src/api/send-result.ts, src/core/utils.ts, src/core/utils.test.ts, src/core/db.ts, src/run/app-prompt.ts, src/target/*.ts, src/main/index.ts, src/setup/setup.ts, src/setup/setup.test.js, src/setup/create-env.ts, src/setup/degit-kenv.ts, src/setup/link-kenv-to-kit.ts, src/types/index.d.ts, package.json, .github/workflows/test.yml
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
scripts/
  test-post.js
  test-pre.js
src/
  api/
    kit.ts
    send-result.ts
  core/
    db.ts
    utils.test.ts
    utils.ts
  main/
    index.ts
  run/
    app-prompt.ts
  setup/
    create-env.ts
    degit-kenv.ts
    link-kenv-to-kit.ts
    setup.test.js
    setup.ts
  types/
    index.d.ts
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

<file path="src/main/index.ts">
// Name: Main
// Description: Script Kit
// Placeholder: Run script
// UI: arg
// Exclude: true
// Cache: true
performance.measure("index", "run")

import { Channel, Value } from "../core/enum.js"
import {
  run,
  cmd,
  getMainScriptPath,
  isScriptlet,
  isSnippet,
} from "../core/utils.js"
import type {
  Choice,
  Scriptlet,
  Script,
} from "../types/core.js"
import {
  mainMenu,
  scriptFlags,
  actions,
  modifiers,
  errorPrompt,
  getFlagsFromActions,
} from "../api/kit.js"
import type { Open } from "../types/packages.js"
import { parseShebang } from "../core/shebang.js"
import "./../target/path/path.js"


console.clear()

if (env.KIT_EDITOR !== "code") {
  scriptFlags["code"] = {
    group: "Script Actions",
    name: "Open Kenv in VS Code",
    description: "Open the script's kenv in VS Code",
    shortcut: `${cmd}+shift+o`,
  }
}

let panel = ``

// let submitted = false
// let onInput = input => {
//   if (input.startsWith("/")) submit("/")
//   if (input.startsWith("~")) submit("~")
//   if (input.startsWith(">")) submit(">")
//   submitted = true
// }

let onNoChoices = async (input, state) => {
  // if (submitted) return
  if (input && state.flaggedValue === "") {
    let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
    let invalid = regex.test(input)

    if (invalid) {
      panel = md(`# No matches found
No matches found for <code>${input}</code>`)
      setPanel(panel)
      return
    }

    let scriptName = input
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s/g, "-")
      .toLowerCase()

    panel = md(`# Quick New Script

Create a script named <code>${scriptName}</code>
        `)
    setPanel(panel)
  }
}

/*
> terminal
~ browse home
/ browse root
' snippets
" word api
: emoji search
; app launcher
, "sticky note"
. file search
< clipboard history
0-9 calculator
? docs
*/

let isApp = false
let isPass = false
let input = ""
let focused: Choice | undefined

trace.instant({
  args: "mainMenu",
})
let script = await mainMenu({
  name: "Main",
  description: "Script Kit",
  placeholder: "Script Kit",
  enter: "Run",
  strict: false,
  flags: scriptFlags,
  onMenuToggle: async (input, state) => {
    if (!state?.flag) {
      let menuFlags = {
        ...(scriptFlags as object),
        ...getFlagsFromActions(actions),
      }
      setFlags(menuFlags)
    }
  },
  onKeyword: async (input, state) => {
    let { keyword, value } = state
    if (keyword) {
      if (value?.filePath) {
        preload(value?.filePath)
        await run(value.filePath, `--keyword`, keyword)
      }
    }
  },

  onSubmit: i => {
    if (i) {
      input = i.trim()
    }
  },
  onBlur: async (input, state) => {
    hide()
    exit()
  },
  onNoChoices,
  onChoiceFocus: async (input, state) => {
    isApp =
      state?.focused?.group === "Apps" ||
      state?.focused?.group === "Community"
    isPass =
      state?.focused?.group === "Pass" &&
      !state?.focused?.exact

    focused = state?.focused
  },
  // footer: `Script Options: ${cmd}+k`,
  shortcodes: {
    // "=": kitPath("handler", "equals-handler.js"),
    // ">": kitPath("handler", "greaterthan-handler.js"),
    // "/": kitPath("main", "browse.js"),
    // "~": kitPath("handler", "tilde-handler.js"),
    // "'": kitPath("handler", "quote-handler.js"),
    // '"': kitPath("handler", "doublequote-handler.js"),
    // ";": kitPath("handler", "semicolon-handler.js"),
    // ":": kitPath("handler", "colon-handler.js"),
    // ".": kitPath("handler", "period-handler.js"),
    // "\\": kitPath("handler", "backslash-handler.js"),
    // "|": kitPath("handler", "pipe-handler.js"),
    // ",": kitPath("handler", "comma-handler.js"),
    // "`": kitPath("handler", "backtick-handler.js"),
    // "<": kitPath("handler", "lessthan-handler.js"),
    // "-": kitPath("handler", "minus-handler.js"),
    // "[": kitPath("handler", "leftbracket-handler.js"),
    "1": `${kitPath("handler", "number-handler.js")} 1`,
    "2": `${kitPath("handler", "number-handler.js")} 2`,
    "3": `${kitPath("handler", "number-handler.js")} 3`,
    "4": `${kitPath("handler", "number-handler.js")} 4`,
    "5": `${kitPath("handler", "number-handler.js")} 5`,
    "6": `${kitPath("handler", "number-handler.js")} 6`,
    "7": `${kitPath("handler", "number-handler.js")} 7`,
    "8": `${kitPath("handler", "number-handler.js")} 8`,
    "9": `${kitPath("handler", "number-handler.js")} 9`,
    // "0": kitPath("handler", "zero-handler.js"),
    // "?": kitPath("handler", "question-handler.js"),
  },

  actions,
  input: arg?.input || "",
})

trace.instant({
  args: "mainMenu submitted",
})

if (!script && Object.keys(flag).length === 0) {
  global.warn(
    `Running error action because of no script or flag detected`
  )
  await errorPrompt({
    message: `An unknown error occurred. Please try again.`,
    name: "No Script or Flag Detected",
  })
}

if (typeof script === "boolean" && !script) {
  exit()
}

const runScript = async (script: Script | string) => {
  if (isApp && typeof script === "string") {
    return await Promise.all([
      hide({
        preloadScript: getMainScriptPath(),
      }),
      (open as unknown as Open)(script as string),
    ])
  }

  if (isPass || (script as Script)?.postfix) {
    let hardPass = (script as any).postfix || input
    if (typeof global?.flag === "object") {
      global.flag.hardPass = hardPass
    }
    return await run(
      (script as Script)?.filePath,
      "--pass",
      hardPass
    )
  }

  if (
    script === Value.NoValue ||
    typeof script === "undefined"
  ) {
    console.warn("🤔 No script selected", script)
    return
  }

  if (typeof script === "string") {
    if (script === "kit-sponsor") {
      return await run(kitPath("main", "sponsor.js"))
    }

    let scriptPath = script as string
    let [maybeScript, numarg] = scriptPath.split(/\s(?=\d)/)
    if (await isFile(maybeScript)) {
      return await run(maybeScript, numarg)
    }

    return await run(
      `${kitPath("cli", "new")}.js`,
      scriptPath.trim().replace(/\s/g, "-").toLowerCase(),
      `--scriptName`,
      scriptPath.trim()
    )
  }

  let shouldEdit = flag?.open

  let selectedFlag: string | undefined = Object.keys(
    flag
  ).find(f => {
    return f && !modifiers[f]
  })

  if (selectedFlag && flag?.code) {
    return await exec(
      `open -a 'Visual Studio Code' '${path.dirname(
        path.dirname(script.filePath)
      )}'`
    )
  }

  if (selectedFlag && selectedFlag === "settings") {
    return await run(kitPath("main", "kit.js"))
  }
  if (selectedFlag?.startsWith("kenv")) {
    let k = script.kenv || "main"
    if (selectedFlag === "kenv-term") {
      k = path.dirname(path.dirname(script.filePath))
    }

    return await run(
      `${kitPath("cli", selectedFlag)}.js`,
      k
    )
  }

  if (selectedFlag?.endsWith("menu")) {
    return await run(`${kitPath("cli", selectedFlag)}.js`)
  }

  if (selectedFlag && !flag?.open) {
    return await run(
      `${kitPath("cli", selectedFlag)}.js`,
      script.filePath
    )
  }

  if (flag[modifiers.opt]) {
    return showLogWindow(script?.filePath)
  }

  if (script.background) {
    return await run(
      kitPath("cli", "toggle-background.js"),
      script?.filePath
    )
  }

  if (shouldEdit) {
    return await edit(script.filePath, kenvPath())
  }

  if (isSnippet(script)) {
    send(Channel.STAMP_SCRIPT, script as Script)

    return await run(
      kitPath("app", "paste-snippet.js"),
      "--filePath",
      script.filePath
    )
  }

  if (isScriptlet(script)) {
    let { runScriptlet } = await import("./scriptlet.js")
    updateArgs(args)
    await runScriptlet(script, script.inputs || [], flag)
    return
  }

  if (Array.isArray(script)) {
    let { runScriptlet } = await import("./scriptlet.js")
    updateArgs(args)
    await runScriptlet(focused as Scriptlet, script, flag)
    return
  }

  if ((script as Script)?.shebang) {
    const shebang = parseShebang(script as Script)
    return await sendWait(Channel.SHEBANG, shebang)
  }

  if (script?.filePath) {
    preload(script?.filePath)
    let runP = run(
      script.filePath,
      ...Object.keys(flag).map(f => `--${f}`)
    )

    return await runP
  }

  return await arg("How did you get here?")
}

await runScript(script)
</file>

<file path="src/run/app-prompt.ts">
process.env.KIT_TARGET = 'app-prompt'
import { Channel, Trigger } from '../core/enum.js'
import os from 'node:os'
import { configEnv, run } from '../core/utils.js'

// TODO: Fix the types around accepting an early Scriptlet
let script: any = ''
let args = []
let tooEarlyHandler = (data) => {
  if (data.channel === Channel.VALUE_SUBMITTED) {
    script = data?.value?.scriptlet ? data?.value : data?.value?.script || data?.state?.value?.filePath
    args = data?.value?.args || data?.state?.value?.args || []
    global.headers = data?.value?.headers || {}

    // const value = `${process.pid}: ${
    //   data?.channel
    // }: ${script} ${performance.now()}ms`
    // process.send({
    //   channel: Channel.CONSOLE_LOG,
    //   value,
    // });
  }
}

process.send({
  channel: Channel.KIT_LOADING,
  value: 'app-prompt.ts'
})

process.on('message', tooEarlyHandler)

await import('../api/global.js')
let { initTrace } = await import('../api/kit.js')
await initTrace()
await import('../api/pro.js')
await import('../api/lib.js')
await import('../platform/base.js')

let platform = os.platform()

try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import('../target/app.js')

if (process.env.KIT_MEASURE) {
  let { PerformanceObserver, performance } = await import('node:perf_hooks')
  let obs = new PerformanceObserver((list) => {
    let entry = list.getEntries()[0]
    log(`⌚️ [Perf] ${entry.name}: ${entry.duration}ms`)
  })
  obs.observe({ entryTypes: ['measure'] })
}

try {
  await silentAttemptImport(kenvPath('globals.ts'))
} catch (error) {
  log('No user-defined globals.ts')
}

let trigger = ''
let name = ''
let result = null
let choices = []
let scriptlet = null
process.title = 'Kit Idle - App Prompt'
process.send({
  channel: Channel.KIT_READY,
  value: result
})

try {
  result = await new Promise((resolve, reject) => {
    process.off('message', tooEarlyHandler)

    if (script) {
      // process.send({
      //   channel: Channel.CONSOLE_LOG,
      //   value: `Too early ${tooEarly}...`,
      // })

      // TODO: Revisit what causes "too early" and the edge-cases here
      if (script?.scriptlet) {
        resolve(script)
        return
      }
      resolve({
        script,
        args,
        trigger: Trigger.Trigger
      })
      return
    }

    type MessageData = {
      channel: Channel
      value: any
    }

    let messageHandler = (data: MessageData) => {
      if (data.channel === Channel.HEARTBEAT) {
        send(Channel.HEARTBEAT)
      }
      if (data.channel === Channel.VALUE_SUBMITTED) {
        trace.instant({
          name: 'app-prompt.ts -> VALUE_SUBMITTED',
          args: data
        })
        global.headers = data?.value?.headers || {}
        process.off('message', messageHandler)
        resolve(data.value)
      }
    }
    process.on('message', messageHandler)
  })
} catch (e) {
  global.warn(e)
  exit()
}
;({ script, args, trigger, choices, name, scriptlet } = result)

process.env.KIT_TRIGGER = trigger

configEnv()
process.title = `Kit - ${path.basename(script)}`

process.once('beforeExit', () => {
  if (global?.trace?.flush) {
    global.trace.flush()
    global.trace = null
  }
  send(Channel.BEFORE_EXIT)
})

performance.mark('run')

if (choices?.length > 0) {
  global.kitScript = scriptlet?.filePath
  let inputs: string[] = []

  if (choices[0].inputs?.length > 0) {
    inputs = await arg<string[]>(
      {
        name,
        scriptlet: true,
        resize: true,
        onEscape: () => {
          exit()
        }
      },
      choices
    )
  }
  let { runScriptlet } = await import('../main/scriptlet.js')
  updateArgs(args)
  await runScriptlet(scriptlet, inputs, flag)
} else {
  if (script.includes('.md')) {
    log({ script, ugh: '❌' })
    exit()
  }
  await run(script, ...args)
}
</file>

<file path="src/setup/create-env.ts">
import { backupEnvFile, mergeEnvFiles, formatEnvContent } from "../core/env-backup.js"
import { safeWriteEnvFile } from "../core/env-file-lock.js"
import chalk from "chalk"

// Check if .env already exists
const envPath = kenvPath(".env")
const alreadyExists = await pathExists(envPath)

if (!alreadyExists) {
	// Create new .env from template
	let envTemplatePath = kitPath("templates", "env", "template.env")

	let envTemplate = await readFile(envTemplatePath, "utf8")

	let envTemplateCompiler = compile(envTemplate)
	let compiledEnvTemplate = envTemplateCompiler({
		...process.env,
		KIT_MAIN_SHORTCUT: process.platform === "win32" ? "ctrl ;" : "cmd ;"
	})

	const templateLines = compiledEnvTemplate.split(/\r?\n/)
	await safeWriteEnvFile(templateLines, envPath)

	global.log?.(chalk.green(`✅ Created new .env file with template variables`))
} else {
	// Merge template variables with existing .env file
	global.log?.(chalk.blue(`📝 .env file exists, checking for new template variables...`))

	// Create backup first
	const backupResult = await backupEnvFile()

	if (backupResult.success) {
		try {
			let envTemplatePath = kitPath("templates", "env", "template.env")
			let envTemplate = await readFile(envTemplatePath, "utf8")

			let envTemplateCompiler = compile(envTemplate)
			let compiledEnvTemplate = envTemplateCompiler({
				...process.env,
				KIT_MAIN_SHORTCUT: process.platform === "win32" ? "ctrl ;" : "cmd ;"
			})

			// Write template to temporary file
			const tempTemplatePath = kenvPath(".env.template.tmp")
			await writeFile(tempTemplatePath, compiledEnvTemplate, "utf8")

			// Merge existing .env with new template
			const merged = await mergeEnvFiles(envPath, tempTemplatePath)

			// Format merged content using the corrected function
			const mergedContentString = formatEnvContent(merged)
			const mergedLines = mergedContentString.split('\n');

			// Write merged content safely
			await safeWriteEnvFile(mergedLines, envPath)

			// Clean up temporary template file
			await unlink(tempTemplatePath).catch(() => { })

			global.log?.(chalk.green(`✅ Merged .env file with ${merged.size} variables (preserving your existing settings)`))

			// Clean up backup since merge was successful
			if (backupResult.backupPath) {
				await unlink(backupResult.backupPath).catch(() => { })
			}
		} catch (error) {
			global.log?.(chalk.red(`❌ Failed to merge .env template: ${error}`))

			// Restore from backup if merge failed
			if (backupResult.backupPath) {
				try {
					await copyFile(backupResult.backupPath, envPath)
					await unlink(backupResult.backupPath)
					global.log?.(chalk.yellow(`🔄 Restored .env from backup after merge failure`))
				} catch (restoreError) {
					global.log?.(chalk.red(`❌ Failed to restore .env backup: ${restoreError}`))
				}
			}
		}
	} else {
		global.log?.(chalk.yellow(`⚠️ Could not backup .env file: ${backupResult.error}`))
		global.log?.(chalk.yellow(`⚠️ Skipping template merge to avoid potential data loss`))
	}
}

export { }
</file>

<file path="src/setup/degit-kenv.ts">
await trash(kenvPath(".git"))

export {}
</file>

<file path="src/setup/setup.test.js">
import ava from "ava"
import os from "node:os"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

/** @type {import("../core/utils")} */
let { isFile, KIT_FIRST_PATH } = await import(
	pathToFileURL(kitPath("core", "utils.js")).href
)

let KIT = kitPath()
let KENV = kenvTestPath

let kenvSetupMockPath = (...parts) => {
	return path.resolve(KENV, ...parts)
}

/** @type {import("child_process").SpawnSyncOptions} */
const options = {
	cwd: KIT,
	encoding: "utf-8",
	env: {
		KIT,
		KENV,
		KIT_NODE_PATH: process.execPath,
		PATH: KIT_FIRST_PATH
	}
}

ava.before(`Run setup script`, (t) => {
	const setupResult = spawnSync(`./script`, [`./setup/setup.js`], options)
})

ava.serial("env was created", async (t) => {
	let envPath = kenvSetupMockPath(".env")
	t.log({ envPath })
	let checkEnv = await isFile(envPath)
	let contents = await readFile(envPath, "utf-8")

	t.true(checkEnv, `env was created`)
	t.false(contents.includes("{{"), `Check if .env was compiled`)
})

ava.serial("kenv linked to kit", async (t) => {
	let pkg = await readJson(kenvSetupMockPath("package.json"))

	t.assert(
		pkg.devDependencies?.["@johnlindquist/kit"],
		"file:../.kit",
		`kenv linked to kit`
	)
})

ava.serial("kenv degit", async (t) => {
	let files = await readdir(kenvSetupMockPath())

	t.false(files.includes(".git"), ".git was removed from kenv")
})

ava.serial("chmod", async (t) => {
	if (process.platform === "win32") {
		t.pass("Skipping chmod test on Windows")
		return
	}

	let { access } = await import("node:fs/promises")
	let { constants } = await import("node:fs")

	let bins = ["scripts", "kar", "bin k", "bin kit", "bin sk"]

	for (let b of bins) {
		let binPath = kitPath(...b.split(" "))
		t.log(binPath)
		let result = await access(binPath, constants.X_OK)
		t.true(isUndefined(result), "bins can be executed")
	}
})

ava.serial("example script exists", async (t) => {
	t.truthy(await pathExists(kenvPath("scripts", "browse-scriptkit.ts")))
})
</file>

<file path="src/setup/setup.ts">
await setup("create-env")
await setup("link-kenv-to-kit")
await setup("chmod-helpers")
await setup("switch-windows-kit-to-bat")
await setup("ensure-snippets")
await setup("ensure-scriptlets")
// await setup("setup-pnpm")

export {}
</file>

<file path="src/types/index.d.ts">
import "./globals.d.ts"
import type { AppApi } from "./kitapp.ts"
import type { KitApi, Run } from "./kit.ts"
import type { PackagesApi } from "./packages.ts"
import type { PlatformApi } from "./platform.ts"
import type { ProAPI } from "./pro.ts"

export type GlobalApi =
  KitApi &
  PackagesApi &
  PlatformApi &
  AppApi &
  ProAPI

declare global {
  var kit: GlobalApi & Run
  interface Global extends GlobalApi {}
}

export * from "./core.js"
export * from "../core/utils.js"

export default kit
</file>

<file path="test-sdk/ava.config.js">
export default {
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: [
    "src/**/*.test.js"
    "test/**/*.test.js",
  ],
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

<file path="src/api/send-result.ts">
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { Channel } from '../core/enum.js'

// Content types based on MCP spec
interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image'
  data: string // base64-encoded
  mimeType: string
}

interface AudioContent {
  type: 'audio'
  data: string // base64-encoded
  mimeType: string
}

interface ResourceContent {
  type: 'resource'
  resource: {
    uri: string
    mimeType?: string
    text?: string
    blob?: string // base64-encoded
  }
}

// Union of all content types
type ContentItem = TextContent | ImageContent | AudioContent | ResourceContent

// Additional result options
interface ResultOptions {
  isError?: boolean
  structuredContent?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

// Result object combines content with options
type ResultObject = ContentItem & ResultOptions

// Main function overloads
export function sendResult(content: string): Promise<void>
export function sendResult(content: ResultObject): Promise<void>
export function sendResult(content: ContentItem[]): Promise<void>

export async function sendResult(
  content: string | ResultObject | ContentItem[]
): Promise<void> {
  let toolResult: CallToolResult
  
  if (typeof content === 'string') {
    // Simple string - wrap as text content
    toolResult = {
      content: [{
        type: 'text',
        text: content
      }]
    }
  } else if (Array.isArray(content)) {
    // Array of content items
    toolResult = {
      content: content as any
    }
  } else {
    // Single object - extract type and options
    const { type, isError, structuredContent, _meta, ...contentData } = content as ResultObject & { type: string }
    
    // Build content item based on type
    const contentItem: ContentItem = { type, ...contentData } as ContentItem
    
    // Build result with options
    toolResult = {
      content: [contentItem] as any
    }
    
    if (isError !== undefined) toolResult.isError = isError
    if (structuredContent !== undefined) toolResult.structuredContent = structuredContent
    if (_meta !== undefined) toolResult._meta = _meta
  }
  
  // Send via MCP channel
  await global.sendWait(Channel.RESPONSE, {
    body: toolResult,
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Export types for users
export type {
  TextContent,
  ImageContent,
  AudioContent,
  ResourceContent,
  ContentItem,
  ResultObject,
  ResultOptions
}
</file>

<file path="src/core/db.ts">
import * as path from 'node:path'
import { rm } from 'node:fs/promises'
import {
  kitPath,
  kenvPath,
  prefsPath,
  promptDbPath,
  isDir,
  isFile,
  extensionRegex,
  resolveScriptToCommand,
  scriptsSort,
  scriptsDbPath,
  statsPath,
  userDbPath,
  getScriptFiles,
  getKenvs,
  processInBatches,
  parseSnippets
} from './utils.js'

import { parseScript } from './parser.js'

import { parseScriptlets } from './scriptlets.js'

import { writeJson, readJson } from '../globals/fs-extra.js'

import type { Choice, Script, PromptDb } from '../types/core'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import type { Keyv } from 'keyv'
import type { DBData, DBKeyOrPath, DBReturnType } from '../types/kit.js'
import { Env } from './enum.js'

export const resolveKenv = (...parts: string[]) => {
  if (global.kitScript) {
    return path.resolve(global.kitScript, '..', '..', ...parts)
  }

  return kenvPath(...parts)
}

export let store = async (nameOrPath: string, initialData: object | (() => Promise<object>) = {}): Promise<Keyv> => {
  let isPath = nameOrPath.includes('/') || nameOrPath.includes('\\')
  let { default: Keyv } = await import('keyv')
  let { KeyvFile } = await import('keyv-file')
  let dbPath = isPath ? nameOrPath : kenvPath('db', `${nameOrPath}.json`)

  let fileExists = await isFile(dbPath)

  let keyv = new Keyv({
    store: new KeyvFile({
      filename: dbPath
      // Not all options are required...
    } as any)
  })

  if (!fileExists) {
    let dataToInit: Record<string, any> = {}

    if (typeof initialData === 'function') {
      dataToInit = await (initialData as () => Promise<any>)()
    } else {
      dataToInit = initialData
    }

    for await (let [key, value] of Object.entries(dataToInit)) {
      await keyv.set(key, value)
    }
  }

  return keyv
}

export async function db<T>(
  dataOrKeyOrPath?: DBKeyOrPath<T>,
  data?: DBData<T>,
  fromCache = true
): Promise<DBReturnType<T>> {
  let dbPath = ''

  // If 'data' is undefined and 'dataOrKeyOrPath' is not a string,
  // treat 'dataOrKeyOrPath' as 'data' and generate a default key/path
  if (typeof data === 'undefined' && typeof dataOrKeyOrPath !== 'string') {
    data = dataOrKeyOrPath
    dataOrKeyOrPath = '_' + resolveScriptToCommand(global.kitScript)
  }

  // Handle case when 'dataOrKeyOrPath' is a string (key or path)
  if (typeof dataOrKeyOrPath === 'string') {
    // Initialize or reset the cache map based on 'fromCache'
    global.__kitDbMap = fromCache ? global.__kitDbMap || new Map() : new Map()

    // Return cached database if available
    if (global.__kitDbMap.has(dataOrKeyOrPath)) {
      return global.__kitDbMap.get(dataOrKeyOrPath)
    }

    dbPath = dataOrKeyOrPath

    // Ensure the database file has a '.json' extension and resolve its full path
    if (!dbPath.endsWith('.json')) {
      dbPath = resolveKenv('db', `${dbPath}.json`)
    }
  }

  // Check if the parent directory of 'dbPath' exists
  const parentExists = await isDir(path.dirname(dbPath))
  if (!parentExists) {
    dbPath = kenvPath('db', `${path.basename(dbPath)}`)
  }
  
  // Always ensure the directory exists before creating the database
  await ensureDir(path.dirname(dbPath))

  let _db: Low<any>

  // Initialize the database
  const init = async () => {
    const jsonFile = new JSONFile(dbPath)
    const result = await jsonFile.read()
    _db = new Low(jsonFile, result)

    try {
      // Read existing data
      await _db.read()
    } catch (error) {
      // Log error and attempt to recover if possible
      global.warn?.(error)

      if (path.dirname(dbPath) === kitPath('db')) {
        // Attempt to reinitialize the database
        // await rm(dbPath); // This line is commented out in the original code
        _db = new Low(jsonFile, result)
        await _db.read()
      }
    }

    // If no data or not using cache, initialize with provided data
    if (!_db.data || !fromCache) {
      const getData = async () => {
        if (typeof data === 'function') {
          const result = await (data as () => Promise<T>)()
          return Array.isArray(result) ? { items: result } : result
        }
        return Array.isArray(data) ? { items: data } : data
      }

      _db.data = await getData()

      try {
        // Write initial data to the database
        await _db.write()
      } catch (error) {
        global.log?.(error)
        // On Windows, sometimes the rename fails due to timing issues
        // Retry once after a short delay
        if (process.platform === 'win32' && error?.code === 'ENOENT') {
          await new Promise(resolve => setTimeout(resolve, 100))
          try {
            await _db.write()
          } catch (retryError) {
            global.log?.('Retry write also failed:', retryError)
          }
        }
      }
    }
  }

  await init()

  // Define database API with additional methods
  const dbAPI = {
    dbPath,
    clear: async () => {
      await rm(dbPath)
    },
    reset: async () => {
      await rm(dbPath)
      await init()
    }
  }

  // Create a proxy to handle property access and modification
  const dbProxy = new Proxy(dbAPI as any, {
    get: (_target, key: string) => {
      if (key === 'then') return _db
      if (key in dbAPI) {
        return typeof dbAPI[key] === 'function' ? dbAPI[key].bind(dbAPI) : dbAPI[key]
      }
      const dbInstance = _db as any
      if (dbInstance[key]) {
        return typeof dbInstance[key] === 'function' ? dbInstance[key].bind(dbInstance) : dbInstance[key]
      }
      return _db.data?.[key]
    },
    set: (_target: any, key: string, value: any) => {
      try {
        ;(_db as any).data[key] = value
        // Optionally send data to a parent process if connected
        // if (process.send) {
        //   send(`DB_SET_${key}` as any, value);
        // }
        return true
      } catch (error) {
        return false
      }
    }
  })

  // Cache the database instance if a key/path is provided
  if (typeof dataOrKeyOrPath === 'string') {
    global.__kitDbMap.set(dataOrKeyOrPath, dbProxy)
  }

  return dbProxy
}

global.db = db
global.store = store

export let parseScripts = async (ignoreKenvPattern = /^ignore$/) => {
  let scriptFiles = await getScriptFiles()
  let kenvDirs = await getKenvs(ignoreKenvPattern)

  for await (let kenvDir of kenvDirs) {
    let scripts = await getScriptFiles(kenvDir)
    scriptFiles = [...scriptFiles, ...scripts]
  }

  let scriptInfoPromises = []
  for (const file of scriptFiles) {
    let asyncScriptInfoFunction = parseScript(file)

    scriptInfoPromises.push(asyncScriptInfoFunction)
  }

  let scriptInfo = await processInBatches(scriptInfoPromises, 5)

  let timestamps = []
  try {
    let timestampsDb = await getTimestamps()
    timestamps = timestampsDb.stamps
  } catch {}

  scriptInfo.sort(scriptsSort(timestamps))

  return scriptInfo
}

export let getScriptsDb = async (fromCache = true, ignoreKenvPattern = /^ignore$/) => {
  let dbResult = await db<{
    scripts: Script[]
  }>(
    scriptsDbPath,
    async () => {
      const [scripts, scriptlets, snippets] = await Promise.all([
        parseScripts(ignoreKenvPattern),
        parseScriptlets(),
        parseSnippets()
      ])
      return {
        scripts: scripts.concat(scriptlets, snippets) as Script[]
      }
    },
    fromCache
  )

  return dbResult
}

export let setScriptTimestamp = async (stamp: Stamp): Promise<Script[]> => {
  let timestampsDb = await getTimestamps()
  let index = timestampsDb.stamps.findIndex((s) => s.filePath === stamp.filePath)

  let oldStamp = timestampsDb.stamps[index]

  stamp.timestamp = Date.now()
  if (stamp.runCount) {
    stamp.runCount = oldStamp?.runCount ? oldStamp.runCount + 1 : 1
  }
  if (oldStamp) {
    timestampsDb.stamps[index] = {
      ...oldStamp,
      ...stamp
    }
  } else {
    timestampsDb.stamps.push(stamp)
  }

  try {
    await timestampsDb.write()
  } catch (error) {
    if (global.log) global.log(error)
  }

  let scriptsDb = await getScriptsDb(false)
  let script = scriptsDb.scripts.find((s) => s.filePath === stamp.filePath)

  if (script) {
    scriptsDb.scripts = scriptsDb.scripts.sort(scriptsSort(timestampsDb.stamps))
    try {
      await scriptsDb.write()
    } catch (error) {}
  }

  return scriptsDb.scripts
}

// export let removeScriptFromDb = async (
//   filePath: string
// ): Promise<Script[]> => {
//   let scriptsDb = await getScriptsDb()
//   let script = scriptsDb.scripts.find(
//     s => s.filePath === filePath
//   )

//   if (script) {
//     scriptsDb.scripts = scriptsDb.scripts.filter(
//       s => s.filePath !== filePath
//     )
//     await scriptsDb.write()
//   }

//   return scriptsDb.scripts
// }

global.__kitScriptsFromCache = true
export let refreshScripts = async () => {
  await getScripts(false)
}

export let getPrefs = async () => {
  return await db(kitPath('db', 'prefs.json'))
}

export type Stamp = {
  filePath: string
  timestamp?: number
  compileStamp?: number
  compileMessage?: string
  executionTime?: number
  changeStamp?: number
  exitStamp?: number
  runStamp?: number
  runCount?: number
}

export let getTimestamps = async (fromCache = true) => {
  return await db<{
    stamps: Stamp[]
  }>(
    statsPath,
    {
      stamps: []
    },
    fromCache
  )
}

export let getScriptFromString = async (script: string): Promise<Script> => {
  let scripts = await getScripts(false)

  // Check if the string contains any path separators (both Unix and Windows style)
  const containsPathSeparator = script.includes('/') || script.includes('\\')
  
  if (!containsPathSeparator) {
    let result = scripts.find((s) => s.name === script || s.command === script.replace(extensionRegex, ''))

    if (!result) {
      // Provide detailed error information for debugging
      const availableNames = scripts.map(s => s.name).slice(0, 10).join(', ')
      const availableCommands = scripts.map(s => s.command).slice(0, 10).join(', ')
      const totalScripts = scripts.length
      
      throw new Error(
        `Cannot find script based on name or command: ${script}\n` +
        `Total scripts available: ${totalScripts}\n` +
        `Sample script names: ${availableNames}${totalScripts > 10 ? '...' : ''}\n` +
        `Sample commands: ${availableCommands}${totalScripts > 10 ? '...' : ''}`
      )
    }

    return result
  }
  
  // Helper function to normalize paths for cross-platform comparison
  const normalizePath = (p: string): string => {
    // Replace all backslashes with forward slashes for consistent comparison
    return p.replace(/\\/g, '/')
  }
  
  // For case-insensitive comparison on Windows
  const isWindows = process.platform === 'win32'
  const compareStrings = (a: string, b: string): boolean => {
    if (isWindows) {
      return a.toLowerCase() === b.toLowerCase()
    }
    return a === b
  }
  
  // Normalize input path
  const normalizedInput = normalizePath(script)
  
  // Try to find the script
  let result = scripts.find((s) => {
    const normalizedScriptPath = normalizePath(s.filePath)
    
    // Direct comparison (handles most cases including scriptlets with anchors)
    if (compareStrings(normalizedScriptPath, normalizedInput)) {
      return true
    }
    
    // For scriptlets with anchors, also try more flexible matching
    if (s.filePath.includes('#') && script.includes('#')) {
      const [inputBase, inputAnchor] = normalizedInput.split('#')
      const [scriptBase, scriptAnchor] = normalizedScriptPath.split('#')
      
      // Compare base paths and anchors separately
      if (compareStrings(inputBase, scriptBase) && inputAnchor === scriptAnchor) {
        return true
      }
    }
    
    return false
  })

  if (!result) {
    // Provide detailed error information for path-based searches
    const availablePaths = scripts
      .map(s => s.filePath)
      .filter(p => p.toLowerCase().includes(path.basename(script).toLowerCase()))
      .slice(0, 5)
    
    const pathInfo = {
      input: script,
      normalized: normalizedInput,
      basename: path.basename(script),
      dirname: path.dirname(script),
      separator: path.sep,
      platform: process.platform
    }
    
    throw new Error(
      `Cannot find script based on path: ${script}\n` +
      `Path details: ${JSON.stringify(pathInfo, null, 2)}\n` +
      `Similar paths found:\n${availablePaths.map(p => `  - ${p}`).join('\n')}` +
      (availablePaths.length === 0 ? '  (none found)' : '')
    )
  }

  return result
}

export let getScripts = async (fromCache = true, ignoreKenvPattern = /^ignore$/) => {
  global.__kitScriptsFromCache = fromCache
  return (await getScriptsDb(fromCache, ignoreKenvPattern)).scripts
}

export type ScriptValue = (pluck: keyof Script, fromCache?: boolean) => () => Promise<Choice<string>[]>

export let scriptValue: ScriptValue = (pluck, fromCache) => async () => {
  let menuItems: Script[] = await getScripts(fromCache)

  return menuItems.map((script: Script) => ({
    ...script,
    value: script[pluck]
  }))
}

export type AppDb = {
  version: string
  openAtLogin: boolean
  previewScripts: boolean
  autoUpdate: boolean
  tray: boolean
  authorized: boolean
  searchDebounce?: boolean
  termFont?: string
  convertKeymap?: boolean
  cachePrompt?: boolean
  mini?: boolean
  disableGpu?: boolean
  disableBlurEffect?: boolean
}

export type UserDb = Partial<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>

export let setUserJson = async (user: UserDb) => {
  await global.cli('set-env-var', 'KIT_LOGIN', user?.login || Env.REMOVE)
  await writeJson(userDbPath, user)
}

export let getUserJson = async (): Promise<UserDb> => {
  let user: any = {}
  let userDbExists = await isFile(userDbPath)
  if (userDbExists) {
    try {
      user = await readJson(userDbPath)
    } catch (error) {
      await setUserJson({})
      user = {}
    }
  }

  return user
}

type PrefsDb = {
  showJoin: boolean
}
export let getPrefsDb = async () => {
  return await db<PrefsDb>(prefsPath, { showJoin: true })
}

export let getPromptDb = async () => {
  return await db<PromptDb & { clear?: boolean }>(promptDbPath, {
    screens: {},
    clear: false
  })
}
</file>

<file path="src/setup/link-kenv-to-kit.ts">
let copyIfNotExists = async (p: string, dest: string) => {
  let exists = await isFile(dest)
  console.log({
    p,
    dest,
    exists: exists ? "true" : "false",
  })
  if (!exists) await copyFile(p, dest)
}

let writeIfNotExists = async (p: string, dest: string) => {
  if (!(await isFile(p))) await writeFile(p, dest)
}

let npmRc = `
registry=https://registry.npmjs.org
install-links=false
`.trim()

await writeIfNotExists(kenvPath(".npmrc"), npmRc)

// add install-links=false to kenv's .npmrc if it doesn't exist
let npmrcContent = await readFile(
  kenvPath(".npmrc"),
  "utf-8"
)
if (!npmrcContent.match(/^install-links=false$/gm)) {
  if (npmrcContent.split("\n").at(-1) !== "") {
    await appendFile(kenvPath(".npmrc"), "\n")
  }
  await appendFile(
    kenvPath(".npmrc"),
    `install-links=false`
  )
}

await cli("install", `"${kitPath()}"`)

// ensure kenvPath('package.json') has a "type": "module"



let defaultPackageJson = {
  type: "module",
  engines: {
    node: "22.17.1",
  },
  devDependencies: {
    "@johnlindquist/kit": `link:${(process.env.KIT || home(".kit"))?.replace(/\\/g, '/')}`,
    "@typescript/lib-dom":
      "npm:@johnlindquist/no-dom@^1.0.2",
  },
}

let packageJson = await ensureReadFile(
  kenvPath("package.json"),
  JSON.stringify(defaultPackageJson, null, 2)
)
let packageJsonObj = JSON.parse(packageJson)
if (!packageJsonObj.type) {
  packageJsonObj.type = "module"
  packageJsonObj.engines = defaultPackageJson.engines
  await writeFile(
    kenvPath("package.json"),
    JSON.stringify(packageJsonObj, null, 2)
  )
}

export { }
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

if (await isDir("-d", kitMockPath())) {
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

<file path="src/core/utils.test.ts">
import ava from 'ava'
import {
  parseScript,
  parseMarkdownAsScriptlets,
  shortcutNormalizer,
  getKenvFromPath,
  home,
  kenvPath,
  processPlatformSpecificTheme,
  parseSnippets,
  parseScriptletsFromPath,
  scriptsSort,
  templatePlaceholdersRegex
} from './utils'
import { outputTmpFile } from '../api/kit'
import { ensureDir } from '../globals/fs-extra'
import { cmd } from './constants'
import slugify from 'slugify'
import type { Stamp } from './db'
import type { CronExpression, Script, Snippet } from '../types'
import path from 'path'

// Helper function to create a temporary snippet file
process.env.KENV = home('.mock-kenv')
async function createTempSnippet(fileName: string, content: string) {
  const snippetDir = kenvPath('snippets')
  await ensureDir(snippetDir)
  return await outputTmpFile(path.join(snippetDir, fileName), content)
}

/**
 * [IMPORTANT]
 * These test create files in the tmp directory.
 * They each need unique names or tests will fail
 */

ava('parseScript name comment metadata', async (t) => {
  let name = 'Testing Parse Script Comment'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript comment full metadata', async (t) => {
  let name = 'Testing Parse Script Comment Full Metadata'
  let description = 'This is a test description'
  let schedule = '0 0 * * *'
  let shortcut = `${cmd}+9`
  let normalizedShortcut = shortcutNormalizer(shortcut)
  let timeout = 15000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Description: ${description}
// Schedule: ${schedule}
// Shortcut: ${shortcut}
// Timeout: ${timeout}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
  t.is(script.schedule, schedule as CronExpression)
  t.is(script.filePath, scriptPath)
  t.is(script.shortcut, normalizedShortcut)
  t.is(script.timeout, timeout)
})

ava('parseScript multiline description in global metadata', async (t) => {
  let name = 'Testing Multiline Description Global'
  let description = `This is a multiline description
that spans multiple lines
and should be properly parsed`
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}",
  description: \`${description}\`
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
})

ava('parseScript multiline description in export metadata', async (t) => {
  let name = 'Testing Multiline Description Export'
  let description = `This is a multiline description
that spans multiple lines
and should be properly parsed`
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}",
  description: \`${description}\`
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
})

ava('parseScript export convention metadata name', async (t) => {
  let name = 'Testing Parse Script Convention'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from comments', async (t) => {
  let name = 'Testing Timeout Metadata'
  let timeout = 5000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Timeout: ${timeout}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from export', async (t) => {
  let name = 'Testing Timeout Export Metadata'
  let timeout = 10000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}",
  timeout: ${timeout}
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript timeout metadata from global', async (t) => {
  let name = 'Testing Timeout Global Metadata'
  let timeout = 30000
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}",
  timeout: ${timeout}
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.timeout, timeout)
  t.is(script.filePath, scriptPath)
})

ava('parseScript global convention metadata name', async (t) => {
  let name = 'Testing Parse Script Convention Global'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

ava('parseScript ignore metadata variable name', async (t) => {
  let name = 'Testing Parse Script Convention Ignore Metadata Variable Name'
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(`${fileName}.ts`, scriptContent)

  let script = await parseScript(scriptPath)
  // Don't pick up on the metadata variable name, so it's the slugified version
  t.is(script.name, fileName)
  t.is(script.filePath, scriptPath)
})

ava('parseMarkdownAsScripts', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{{File Name}}.txt"), {{Note}})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].scriptlet, 'await appendFile(home("{{File Name}}.txt"), {{Note}})')
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseMarkdownAsScripts handles quotes in name and formats command', async (t) => {
  let markdown = `
## What's This?
<!-- 
Trigger: test-quotes
Alias:
Enabled: Yes
  -->

\`\`\`bash
echo "This is a test script"
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  t.is(scripts.length, 1)
  t.is(scripts[0].name, "What's This?")
  t.is(scripts[0].trigger, 'test-quotes')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, 'echo "This is a test script"')
  t.is(scripts[0].command, 'whats-this')
})

ava('parseMarkdownAsScripts allow JavaScript objects', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

\`\`\`kit
await appendFile(home("{{File Name}}.txt"), {{Note}})
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  // t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].scriptlet, 'await appendFile(home("{{File Name}}.txt"), {{Note}})')
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseMarkdownAsScripts allow JavaScript imports, exports, ${', async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}}
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
prepend: PATH=/usr/local/bin
append: | grep "foo"
-->

\`\`\`kit
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
export { note }
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)
  // t.log(scripts)
  // t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Open Script Kit')
  t.is(scripts[0].trigger, 'sk')
  t.is(scripts[0].tool, 'bash')
  t.is(scripts[0].tag, 'trigger: sk')
  t.is(scripts[0].scriptlet, "open -a 'Google Chrome' https://scriptkit.com/{{user}}")
  t.is(scripts[0].group, 'Scriptlets')
  t.deepEqual(scripts[0].inputs, ['user'])

  t.is(scripts[1].name, 'Append Note')
  t.is(scripts[1].tool, 'kit')
  t.is(scripts[1].cwd, '~/Downloads')
  t.is(scripts[1].prepend, 'PATH=/usr/local/bin')
  t.is(scripts[1].append, '| grep "foo"')
  if (process.platform === 'darwin') {
    t.is(scripts[1].tag, 'cmd+o')
  } else {
    t.is(scripts[1].tag, 'ctrl+o')
  }
  t.is(
    scripts[1].scriptlet,
    `
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
export { note }
		`.trim()
  )
  t.is(scripts[1].group, 'Scriptlets')
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava("parseMarkdownAsScripts allow doesn't create multiple inputs for the same template variable", async (t) => {
  let markdown = `
## Open Script Kit
<!-- 
Trigger: sk
Alias:
Enabled: Yes
  -->

\`\`\`bash
open -a 'Google Chrome' https://scriptkit.com/{{user}} && echo "{{user}}"
\`\`\`

This Script Opens the Script Kit URL

I hope you enjoy!

## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
prepend: PATH=/usr/local/bin
append: | grep "foo"
-->

\`\`\`kit
import { appendFile } from "fs"
let note = "This is a note"
await exec(\`echo "\${note}" >> foo.txt\`)
await appendFile(home("{{File Name}}.txt"), {{Note}})
console.log("Creating {{Note}}")
export { note }
\`\`\`
`

  const scripts = await parseMarkdownAsScriptlets(markdown)

  t.deepEqual(scripts[0].inputs, ['user'])
  t.deepEqual(scripts[1].inputs, ['File Name', 'Note'])
})

ava('parseScriptlets tool default to bash or cmd', async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)
  t.is(scriptlet[0].tool, process.platform === 'win32' ? 'cmd' : 'bash')
})

ava("parseMarkdownAsScriptlets doesn't error on empty string", async (t) => {
  let scriptlets = await parseMarkdownAsScriptlets('')
  t.is(scriptlets.length, 0)
})

ava('parseScriptletsFromPath - valid markdown file', async (t) => {
  const markdown = `
# Test

## Test Scriptlet
<!-- 
Shortcut: cmd t
-->

\`\`\`js
console.log("Hello, world!")
\`\`\`
`
  const filePath = await outputTmpFile('test-scriptlet.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  // t.log(scripts[0])
  t.is(scripts.length, 1)
  t.is(scripts[0].name, 'Test Scriptlet')
  if (process.platform === 'darwin') {
    t.is(scripts[0].friendlyShortcut, 'cmd+t')
  } else {
    t.is(scripts[0].friendlyShortcut, 'ctrl+t')
  }
  t.is(scripts[0].scriptlet.trim(), 'console.log("Hello, world!")')
  t.is(scripts[0].group, 'Test')
  t.is(scripts[0].filePath, `${filePath}#Test-Scriptlet`)
  t.is(scripts[0].kenv, '')
})

ava('parseScriptletsFromPath - empty file', async (t) => {
  const filePath = await outputTmpFile('empty-scriptlet.md', '')
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 0)
})

ava('parseScriptletsFromPath  me- file with multiple scriptlets', async (t) => {
  const markdown = `
## Scriptlet 1
\`\`\`js
console.log("Scriptlet 1")
\`\`\`

## Scriptlet 2
\`\`\`js
console.log("Scriptlet 2")
\`\`\`
`
  const filePath = await outputTmpFile('multiple-scriptlets.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Scriptlet 1')
  t.is(scripts[1].name, 'Scriptlet 2')
})

ava('parseScriptletsFromPath - h1 as group', async (t) => {
  const markdown = `
# Group A
## Scriptlet 1
\`\`\`js
console.log("Scriptlet 1")
\`\`\`

## Scriptlet 2
\`\`\`js
console.log("Scriptlet 2")
\`\`\`
\`\`\`
`
  const filePath = await outputTmpFile('grouped-scriptlets.md', markdown)
  const scripts = await parseScriptletsFromPath(filePath)

  t.is(scripts.length, 2)
  t.is(scripts[0].name, 'Scriptlet 1')
  t.is(scripts[0].group, 'Group A')
  t.is(scripts[1].name, 'Scriptlet 2')
  t.is(scripts[1].group, 'Group A')
})

ava('getKenvFromPath - main kenv', async (t) => {
  let scriptletsPath = kenvPath('script', 'kit.md')
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, '')
})

ava('getKenvFromPath - sub kenv', async (t) => {
  let scriptletsPath = kenvPath('kenvs', 'test', 'script', 'kit.md')
  let kenv = getKenvFromPath(scriptletsPath)
  t.is(kenv, 'test')
})

ava('getKenvFromPath - no kenv, empty string', async (t) => {
  let scriptletsPath = home('kit.md')
  t.is(getKenvFromPath(scriptletsPath), '')
})

ava('processPlatformSpecificTheme - Mac specific', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'darwin' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-primary: #ff0000;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - Windows specific', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'win32' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-secondary: #00ff00;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - Other platform', (t) => {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', { value: 'linux' })

  const input = `
    --color-primary-mac: #ff0000;
    --color-secondary-win: #00ff00;
    --color-tertiary-other: #0000ff;
    --color-neutral: #cccccc;
  `

  const expected = `
    --color-tertiary: #0000ff;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), expected.trim())

  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

ava('processPlatformSpecificTheme - No platform-specific variables', (t) => {
  const input = `
    --color-primary: #ff0000;
    --color-secondary: #00ff00;
    --color-tertiary: #0000ff;
    --color-neutral: #cccccc;
  `

  const result = processPlatformSpecificTheme(input)
  t.is(result.trim(), input.trim())
})

ava('processPlatformSpecificTheme - Empty input', (t) => {
  const input = ''
  const result = processPlatformSpecificTheme(input)
  t.is(result, '')
})

// TODO: Figure out process.env.KENV = on windows
if (process.platform !== 'win32') {
  ava('parseSnippets - basic snippet', async (t) => {
    const content = `
// Name: Test Snippet
// Snippet: test
console.log("Hello, world!");
  `.trim()

    await createTempSnippet('test-snippet.txt', content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.name === 'Test Snippet')

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, 'Test Snippet')
      t.is(testSnippet.tag, 'test')
      t.is(testSnippet.text.trim(), 'console.log("Hello, world!");')
      t.is(testSnippet.group, 'Snippets')
      t.is(testSnippet.kenv, '')
      t.is(testSnippet.expand, 'test')
    }
  })

  ava('parseSnippets - snippet without metadata', async (t) => {
    const content = `console.log("No metadata");`
    const fileName = 'no-metadata-snippet.txt'
    const filePath = await createTempSnippet(fileName, content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.filePath === filePath)

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, path.basename(filePath))
      t.is(testSnippet.tag, '')
      t.is(testSnippet.expand, '')
      t.is(testSnippet.text.trim(), content)
    }
  })

  ava('parseSnippets - snippet with HTML content', async (t) => {
    const content = `
// Name: HTML Snippet
<div>
  <h1>Hello, world!</h1>
</div>
  `.trim()

    await createTempSnippet('html-snippet.txt', content)

    const snippets = await parseSnippets()
    const testSnippet = snippets.find((s) => s.name === 'HTML Snippet')

    t.truthy(testSnippet)
    if (testSnippet) {
      t.is(testSnippet.name, 'HTML Snippet')
      t.is(testSnippet.text.trim(), '<div>\n  <h1>Hello, world!</h1>\n</div>')
      const expectedPreview = `<div class="p-4">\n  <style>\n  p{\n    margin-bottom: 1rem;\n  }\n  li{\n    margin-bottom: .25rem;\n  }\n  \n  </style>\n  <div>\n  <h1>Hello, world!</h1>\n</div>\n</div>`.trim()
      if (testSnippet.preview && typeof testSnippet.preview === 'string') {
        t.is(testSnippet.preview.replace(/\r\n/g, '\n').trim(), expectedPreview)
      }
    }
  })

  ava('parseSnippets - multiple snippets', async (t) => {
    const snippet1 = `
// Name: Snippet 1
// Snippet: s1
console.log("Snippet 1");
  `.trim()

    const snippet2 = `
// Name: Snippet 2
// Snippet: s2
console.log("Snippet 2");
  `.trim()

    await createTempSnippet('snippet1.txt', snippet1)
    await createTempSnippet('snippet2.txt', snippet2)

    const snippets = await parseSnippets()
    const testSnippet1 = snippets.find((s) => s.name === 'Snippet 1')
    const testSnippet2 = snippets.find((s) => s.name === 'Snippet 2')

    t.truthy(testSnippet1)
    t.truthy(testSnippet2)

    // Sorted by name by default
    const definedSnippets = [testSnippet1, testSnippet2].filter(Boolean) as Snippet[]
    const testSnippets = definedSnippets.sort((a, b) => a.name.localeCompare(b.name))

    t.is(testSnippets.length, 2)
    if (testSnippets[0] && testSnippets[1]) {
      t.is(testSnippets[0].tag, 's1')
      t.is(testSnippets[1].tag, 's2')
      t.is(testSnippets[0].value, 'console.log("Snippet 1");')
      t.is(testSnippets[1].value, 'console.log("Snippet 2");')
    }
  })
}

// Clean up temporary files after all tests
// ava.after.always(async () => {
// 	const snippetDir = path.join(kenvPath(), "snippets")
// 	await rmdir(snippetDir, { recursive: true })
// })

if (process.platform !== 'win32') {
  ava('parseScriptlets no tool preview uses bash codeblock', async (t) => {
    let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)

    t.log(scriptlet[0].preview)

    t.true((scriptlet[0].preview as string)?.includes('language-bash'))
  })

  ava('parseScriptlets with tool preview uses tool codeblock', async (t) => {
    let scriptlet = await parseMarkdownAsScriptlets(`
	## Append Note
	
	<!-- 
	Shortcut: cmd o
	cwd: ~/Downloads
	-->
	
	\`\`\`python
	echo "hello world"
	\`\`\`		
			
			`)

    t.log(scriptlet[0].preview)

    t.true((scriptlet[0].preview as string)?.includes('language-python'))
  })
}

ava('parseScriptlets with a shell tool and without inputs uses shebang', async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello world"
\`\`\`		
		
		`)

  // t.log(scriptlet[0])

  t.truthy(scriptlet[0].shebang)
})

ava("parseScriptlets with a shell tool with inputs doesn't use shebang", async (t) => {
  let scriptlet = await parseMarkdownAsScriptlets(`
## Append Note

<!-- 
Shortcut: cmd o
cwd: ~/Downloads
-->

\`\`\`
echo "hello {{who}}"
\`\`\`		
		
		`)

  // t.log(scriptlet[0])

  t.falsy(scriptlet[0].shebang)
})

ava('scriptsSort - sorts by index when timestamps are equal', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { index: 2, name: 'B', filePath: 'b.ts' },
    { index: 1, name: 'A', filePath: 'a.ts' },
    { index: 3, name: 'C', filePath: 'c.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'A')
  t.is(sortedScripts[1].name, 'B')
  t.is(sortedScripts[2].name, 'C')
})

ava('scriptsSort - treats missing index as 9999', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { name: 'No Index', filePath: 'no-index.ts' },
    { index: 1, name: 'Has Index', filePath: 'has-index.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'Has Index')
  t.is(sortedScripts[1].name, 'No Index')
})

ava('scriptsSort - timestamps take precedence over index', (t) => {
  const now = Date.now()
  const timestamps: Stamp[] = [
    { filePath: 'b.ts', timestamp: now },
    { filePath: 'a.ts', timestamp: now - 1000 }
  ]

  const scripts = [
    { index: 2, name: 'B', filePath: 'b.ts' },
    { index: 1, name: 'A', filePath: 'a.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'B', 'More recent timestamp should come first')
  t.is(sortedScripts[1].name, 'A')
})

ava('scriptsSort - falls back to name when no timestamps or index', (t) => {
  const timestamps: Stamp[] = []
  const scripts = [
    { name: 'Charlie', filePath: 'c.ts' },
    { name: 'Alpha', filePath: 'a.ts' },
    { name: 'Bravo', filePath: 'b.ts' }
  ] as Script[]

  const sortedScripts = [...scripts].sort(scriptsSort(timestamps))

  t.is(sortedScripts[0].name, 'Alpha')
  t.is(sortedScripts[1].name, 'Bravo')
  t.is(sortedScripts[2].name, 'Charlie')
})

ava('templatePlaceholdersRegex - detects VS Code snippet variables', (t) => {
  // Valid patterns
  t.true(templatePlaceholdersRegex.test('${1:default}'))
  t.true(templatePlaceholdersRegex.test('${foo|bar}'))
  t.true(templatePlaceholdersRegex.test('${name}'))
  t.true(templatePlaceholdersRegex.test('$1'))
  t.true(templatePlaceholdersRegex.test('${1}'))
  t.true(templatePlaceholdersRegex.test('${foo|bar|baz}')) // Multiple choices
  t.true(templatePlaceholdersRegex.test('${1:foo bar}')) // Spaces in default
  t.true(templatePlaceholdersRegex.test('${foo-bar}')) // Dashes in names
  t.true(templatePlaceholdersRegex.test('${1:foo:bar}')) // Colons in default value

  // Invalid patterns
  t.false(templatePlaceholdersRegex.test('$'))
  t.false(templatePlaceholdersRegex.test('${'))
  t.false(templatePlaceholdersRegex.test('${}'))
  t.false(templatePlaceholdersRegex.test('${|}'))
  t.false(templatePlaceholdersRegex.test('$foo'))
  t.false(templatePlaceholdersRegex.test('${nested{}}'))
  t.false(templatePlaceholdersRegex.test('${foo|}')) // Empty last choice
  t.false(templatePlaceholdersRegex.test('${|foo}')) // Empty first choice
  t.false(templatePlaceholdersRegex.test('${foo||bar}')) // Double pipe
  t.false(templatePlaceholdersRegex.test('${foo|bar|}')) // Trailing pipe
})
</file>

<file path="test-sdk/main.test.js">
import ava from 'ava';
import slugify from 'slugify';
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

<file path="src/api/kit.ts">
import path from 'node:path'
import { existsSync, lstatSync } from 'node:fs'
import { readJson } from '../globals/fs-extra.js'
import { readFile } from '../globals/fs.js'
import * as os from 'node:os'
import { pathToFileURL } from 'node:url'
import * as JSONSafe from 'safe-stable-stringify'
import { QuickScore, quickScore, createConfig, type Options, type ConfigOptions } from 'quick-score'
import { formatDistanceToNow } from '../utils/date.js'
import type {
  Action,
  Choice,
  FlagsObject,
  FlagsWithKeys,
  PromptConfig,
  ScoredChoice,
  Script,
  Scriptlet,
  Shortcut
} from '../types/core'
import { Channel, PROMPT } from '../core/enum.js'

import {
  kitPath,
  kenvPath,
  resolveScriptToCommand,
  run,
  home,
  isFile,
  getKenvs,
  groupChoices,
  formatChoices,
  parseScript,
  processInBatches,
  highlight,
  md as mdUtil,
  tagger
} from '../core/utils.js'
import { getScripts, getScriptFromString, getUserJson, getTimestamps, type Stamp, setUserJson } from '../core/db.js'

import { default as stripAnsi } from 'strip-ansi'

import type { CallToolResult, Kenv } from '../types/kit'
import type { Fields as TraceFields } from 'chrome-trace-event'
import dotenv from 'dotenv'
import type { kenvEnv } from '../types/env'
import { getRecentLimit } from './recent.js'

global.__kitActionsMap = new Map<string, Action | Shortcut>()

export async function initTrace() {
  if (process.env.KIT_TRACE || (process.env.KIT_TRACE_DATA && !global?.trace?.enabled)) {
    let timestamp = Date.now()
    let { default: Trace } = await import('chrome-trace-event')
    let tracer = new Trace.Tracer({
      noStream: true
    })

    await ensureDir(kitPath('trace'))

    let writeStream = createWriteStream(kitPath('trace', `trace-${timestamp}.json`))

    tracer.pipe(writeStream)

    const tidCache = new Map()

    function updateFields(channel) {
      let tid
      if (channel) {
        let cachedTid = tidCache.get(channel)
        if (cachedTid === undefined) {
          cachedTid = Object.entries(Channel).findIndex(([, value]) => value === channel)
          tidCache.set(channel, cachedTid)
        }
        tid = cachedTid
      }
      return tid
    }

    function createTraceFunction(eventType: 'B' | 'E' | 'I') {
      return function (fields: TraceFields) {
        fields.tid = updateFields(fields?.channel) || 1
        if (!process.env.KIT_TRACE_DATA) {
          fields.args = undefined
        }
        return tracer.mkEventFunc(eventType)(fields)
      }
    }

    global.trace = {
      begin: createTraceFunction('B'),
      end: createTraceFunction('E'),
      instant: createTraceFunction('I'),
      flush: () => {
        tracer.flush()
      },
      enabled: true
    }

    global.trace.instant({
      name: 'Init Trace',
      args: {
        timestamp
      }
    })
  }
}

global.trace ||= {
  begin: () => { },
  end: () => { },
  instant: () => { },
  flush: () => { },
  enabled: false
}

global.isWin = os.platform().startsWith('win')
global.isMac = os.platform().startsWith('darwin')
global.isLinux = os.platform().startsWith('linux')
global.cmd = global.isMac ? 'cmd' : 'ctrl'

let isErrored = false
export let errorPrompt = async (error: Error) => {
  if (isErrored) {
    return
  }
  isErrored = true
  if (global.__kitAbandoned) {
    let { name } = path.parse(global.kitScript)
    let errorLog = path.resolve(path.dirname(path.dirname(global.kitScript)), 'logs', `${name}.log`)

    await appendFile(errorLog, `\nAbandonned. Exiting...`)
    exit()
  }
  if (process.env.KIT_CONTEXT === 'app') {
    global.warn(`☠️ ERROR PROMPT SHOULD SHOW ☠️`)
    
    // Use the new formatter for better error handling
    const { SourcemapErrorFormatter } = await import('../core/sourcemap-formatter.js')
    const formattedError = SourcemapErrorFormatter.formatError(error)
    
    global.warn(formattedError.stack)

    let errorFile = global.kitScript
    let line = 1
    let col = 1

    // Extract location using the formatter
    const errorLocation = SourcemapErrorFormatter.extractErrorLocation(error)
    if (errorLocation) {
      errorFile = errorLocation.file
      line = errorLocation.line
      col = errorLocation.column
    }

    let script = global.kitScript.replace(/.*\//, '')
    let errorToCopy = formattedError.stack
    let dashedDate = () => new Date().toISOString().replace('T', '-').replace(/:/g, '-').split('.')[0]
    let errorJsonPath = global.tmp(`error-${dashedDate()}.txt`)
    await global.writeFile(errorJsonPath, errorToCopy)

    try {
      if (global?.args.length > 0) {
        log({ args })
        args = []
      }
      global.warn(`Running error action because of`, {
        script,
        error: formattedError.message
      })
      await run(kitPath('cli', 'error-action.js'), script, errorJsonPath, errorFile, String(line), String(col))
    } catch (error) {
      global.warn(error)
    }
  } else {
    global.console.log(error)
  }
}

export let outputTmpFile = async (fileName: string, contents: string) => {
  let outputPath = path.resolve(os.tmpdir(), 'kit', fileName)
  await outputFile(outputPath, contents)
  return outputPath
}

export let copyTmpFile = async (fromFile: string, fileName: string) =>
  await outputTmpFile(fileName, await global.readFile(fromFile, 'utf-8'))

export let buildWidget = async (scriptPath, outPath = '') => {
  let outfile = outPath || scriptPath

  let templateContent = await readFile(kenvPath('templates', 'widget.html'), 'utf8')

  let REACT_PATH = kitPath('node_modules', 'react', 'index.js')
  let REACT_DOM_PATH = kitPath('node_modules', 'react-dom', 'index.js')

  let REACT_CONTENT = `
  let { default: React } = await import(
    kitPath("node_modules", "react", "umd", "react.development.js")
  )
  let { default: ReactDOM } = await import(
    kitPath("node_modules", "react-dom", "umd", "react-dom.deveolpment.js")
  )
  
  let __renderToString = (x, y, z)=> Server.renderToString(React.createElement(x, y, z))  
  `

  let templateCompiler = compile(templateContent)
  let result = templateCompiler({
    REACT_PATH,
    REACT_DOM_PATH,
    REACT_CONTENT
  })

  let contents = await readFile(outfile, 'utf8')

  await writeFile(outfile, result)
}

let getMissingPackages = (e: string): string[] => {
  let missingPackage = []
  if (e.includes('Cannot find package')) {
    missingPackage = e.match(/(?<=Cannot find package ['"]).*(?=['"])/g)
  } else if (e.includes('Could not resolve')) {
    missingPackage = e.match(/(?<=Could not resolve ['"]).*(?=['"])/g)
  } else if (e.includes('Cannot find module')) {
    missingPackage = e.match(/(?<=Cannot find module ['"]).*(?=['"])/g)
  }

  return (missingPackage || []).map((s) => s.trim()).filter(Boolean)
}

global.attemptImport = async (scriptPath, ..._args) => {
  let cachedArgs = args.slice(0)
  let importResult = undefined
  try {
    global.updateArgs(_args)

    let href = pathToFileURL(scriptPath).href
    let kitImport = `${href}?now=${Date.now()}.kit`
    importResult = await import(kitImport)
  } catch (error) {
    let e = error.toString()
    global.warn(e)
    if (process.env.KIT_CONTEXT === 'app') {
      await errorPrompt(error)
    } else {
      throw error
    }
  }

  return importResult
}

global.silentAttemptImport = async (scriptPath, ..._args) => {
  let cachedArgs = args.slice(0)
  let importResult = undefined
  try {
    global.updateArgs(_args)

    let href = pathToFileURL(scriptPath).href
    let kitImport = `${href}?now=${Date.now()}.kit`
    importResult = await import(kitImport)
  } catch (error) { }

  return importResult
}

global.__kitAbandoned = false
global.send = (channel: Channel, value?: any) => {
  if (global.__kitAbandoned) return null
  if (process?.send) {
    try {
      let payload = {
        pid: process.pid,
        promptId: global.__kitPromptId,
        kitScript: global.kitScript,
        channel,
        value
      }

      global.trace.instant({
        name: `Send ${channel}`,
        channel,
        args: payload
      })

      process.send(payload)
    } catch (e) {
      global.warn(e)
    }
  } else {
    // console.log(from, ...args)
  }
}

global.sendResponse = (body: any, headers: Record<string, string> = {}) => {
  let statusCode = 200
  if (headers['Status-Code']) {
    statusCode = Number.parseInt(headers['Status-Code'], 10)
    headers['Status-Code'] = undefined
  }

  const responseHeaders = { ...headers }
  if (!responseHeaders['Content-Type']) {
    responseHeaders['Content-Type'] = 'application/json'
  }

  const response = {
    body,
    statusCode,
    headers: responseHeaders
  }

  return global.sendWait(Channel.RESPONSE, response)
}

// Import sendResult implementation
import { sendResult as sendResultImpl } from './send-result.js'

// Assign to global with the implementation
global.sendResult = sendResultImpl

// Import and export params function
import { params } from './params.js'
global.params = params

let _consoleLog = global.console.log.bind(global.console)
let _consoleWarn = global.console.warn.bind(global.console)
let _consoleClear = global.console.clear.bind(global.console)
let _consoleError = global.console.error.bind(global.console)
let _consoleInfo = global.console.info.bind(global.console)

global.log = (...args) => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_LOG, args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' '))
  } else {
    _consoleLog(...args)
  }
}
global.warn = (...args) => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_WARN, args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' '))
  } else {
    _consoleWarn(...args)
  }
}
global.clear = () => {
  if (process?.send && process.env.KIT_CONTEXT === 'app') {
    global.send(Channel.KIT_CLEAR)
  } else {
    _consoleClear()
  }
}

if (process?.send && process.env.KIT_CONTEXT === 'app') {
  global.console.log = (...args) => {
    let log = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    global.send(Channel.CONSOLE_LOG, log)
  }

  global.console.warn = (...args) => {
    let warn = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_WARN, warn)
    } else {
      _consoleWarn(...args)
    }
  }

  global.console.clear = () => {
    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_CLEAR)
    } else {
      _consoleClear()
    }
  }

  global.console.error = (...args) => {
    let error = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_ERROR, error)
    } else {
      _consoleError(...args)
    }
  }

  global.console.info = (...args) => {
    let info = args.map((a) => (typeof a !== 'string' ? JSONSafe.stringify(a) : a)).join(' ')

    if (process?.send && process.env.KIT_CONTEXT === 'app') {
      global.send(Channel.CONSOLE_INFO, info)
    } else {
      _consoleInfo(...args)
    }
  }
}

global.dev = async (data) => {
  await global.sendWait(Channel.DEV_TOOLS, data)
}
global.devTools = global.dev

global.showImage = async (html, options) => {
  await global.widget(
    md(`## \`showImage\` is Deprecated

Please use the new \`widget\` function instead.

[https://github.com/johnlindquist/kit/discussions/745](https://github.com/johnlindquist/kit/discussions/745)
`)
  )
  // global.send(Channel.SHOW, { options, html })
}

global.setPlaceholder = async (text) => {
  await global.sendWait(Channel.SET_PLACEHOLDER, stripAnsi(text))
}

global.setEnter = async (text) => {
  await global.sendWait(Channel.SET_ENTER, text)
}

global.main = async (scriptPath: string, ..._args) => {
  let kitScriptPath = kitPath('main', scriptPath) + '.js'
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.lib = async (lib: string, ..._args) => {
  let libScriptPath = path.resolve(global.kitScript, '..', '..', 'lib', lib) + '.js'
  return await global.attemptImport(libScriptPath, ..._args)
}

global.cli = async (cliPath, ..._args) => {
  let cliScriptPath = kitPath('cli', cliPath) + '.js'

  return await global.attemptImport(cliScriptPath, ..._args)
}

global.setup = async (setupPath, ..._args) => {
  global.setPlaceholder(`>_ setup: ${setupPath}...`)
  let setupScriptPath = kitPath('setup', setupPath) + '.js'
  return await global.attemptImport(setupScriptPath, ..._args)
}

global.kenvTmpPath = (...parts) => {
  let command = resolveScriptToCommand(global.kitScript)
  let scriptTmpDir = kenvPath('tmp', command, ...parts)

  mkdir('-p', path.dirname(scriptTmpDir))
  return scriptTmpDir
}

export let tmpPath = (...parts: string[]) => {
  let command = global?.kitScript ? resolveScriptToCommand(global.kitScript) : ''

  let tmpCommandDir = path.resolve(os.tmpdir(), 'kit', command)

  let scriptTmpDir = path.resolve(tmpCommandDir, ...parts)

  let kenvTmpCommandPath = kenvPath('tmp', command)

  global.ensureDirSync(tmpCommandDir)
  // symlink to kenvPath("command")
  // Check if tmpCommandDir exists and is not a symlink before creating the symlink
  if (!existsSync(kenvTmpCommandPath) || lstatSync(kenvTmpCommandPath).isSymbolicLink()) {
    global.ensureSymlinkSync(tmpCommandDir, kenvTmpCommandPath)
  }

  return scriptTmpDir
}

global.tmpPath = tmpPath
/**
 * @deprecated use `tmpPath` instead
 */
global.tmp = global.tmpPath
global.inspect = async (data, fileName) => {
  let dashedDate = () => new Date().toISOString().replace('T', '-').replace(/:/g, '-').split('.')[0]

  let formattedData = data
  let tmpFullPath = ''

  if (typeof data !== 'string') {
    formattedData = JSONSafe.stringify(data, null, '\t')
  }

  if (fileName) {
    tmpFullPath = tmpPath(fileName)
  } else if (typeof data === 'object') {
    tmpFullPath = tmpPath(`${dashedDate()}.json`)
  } else {
    tmpFullPath = tmpPath(`${dashedDate()}.txt`)
  }

  await global.writeFile(tmpFullPath, formattedData)

  await global.edit(tmpFullPath)
}

global.compileTemplate = async (template, vars) => {
  let templateContent = await global.readFile(kenvPath('templates', template), 'utf8')
  let templateCompiler = global.compile(templateContent)
  return templateCompiler(vars)
}

global.currentOnTab = null
global.onTabs = []
global.onTabIndex = 0
global.onTab = (name, tabFunction) => {
  let fn = async (...args) => {
    await tabFunction(...args)
  }
  global.onTabs.push({ name, fn })
  if (global.flag?.tab) {
    if (global.flag?.tab === name) {
      let tabIndex = global.onTabs.length - 1
      global.onTabIndex = tabIndex
      global.send(Channel.SET_TAB_INDEX, tabIndex)
      global.currentOnTab = fn()
    }
  } else if (global.onTabs.length === 1) {
    global.onTabIndex = 0
    global.send(Channel.SET_TAB_INDEX, 0)
    global.currentOnTab = fn()
  }
}

global.kitPrevChoices = []

global.groupChoices = groupChoices
global.formatChoices = formatChoices

global.addChoice = async (choice: string | Choice) => {
  if (typeof choice !== 'object') {
    choice = {
      name: String(choice),
      value: String(choice)
    }
  }

  choice.id ||= global.uuid()
  return await global.sendWait(Channel.ADD_CHOICE, choice)
}

global.appendChoices = async (choices: string[] | Choice[]) => {
  return await global.sendWait(Channel.APPEND_CHOICES, choices)
}

// TODO: Add an option to avoid sorting
global.createChoiceSearch = async (
  choices: Choice[],
  config: Partial<Omit<Options, 'keys'> & ConfigOptions & { keys: string[] }> = {
    minimumScore: 0.3,
    maxIterations: 3,
    keys: ['name']
  }
) => {
  if (!config?.minimumScore) config.minimumScore = 0.3
  if (!config?.maxIterations) config.maxIterations = 3
  if (config?.keys && Array.isArray(config.keys)) {
    config.keys = config.keys.map((key) => {
      if (key === 'name') return 'slicedName'
      if (key === 'description') return 'slicedDescription'
      return key
    })
  }

  let formattedChoices = await global.___kitFormatChoices(choices)
  function scorer(string: string, query: string, matches: number[][]) {
    return quickScore(string, query, matches as any, undefined, undefined, createConfig(config))
  }

  const keys = (config?.keys || ['slicedName']).map((name) => ({
    name,
    scorer
  }))

  let qs = new QuickScore<Choice>(formattedChoices, {
    keys,
    ...config
  })

  return (query: string) => {
    let result = qs.search(query) as ScoredChoice[]
    if (result.find((c) => c?.item?.group)) {
      let createScoredChoice = (item: Choice): ScoredChoice => {
        return {
          item,
          score: 0,
          matches: {},
          _: ''
        }
      }
      const groups: Set<string> = new Set()
      const keepGroups: Set<string> = new Set()
      const filteredBySearch: ScoredChoice[] = []

      // Build a map for constant time access
      const resultMap = new Map(result.map((r) => [r.item.id, r]))

      for (const choice of formattedChoices) {
        if (choice?.skip) {
          const scoredSkip = createScoredChoice(choice)
          filteredBySearch.push(scoredSkip)
          if (choice?.group) groups.add(choice.group)
        } else {
          const scored = resultMap.get(choice?.id)
          if (scored) {
            filteredBySearch.push(scored)
            if (choice?.group && groups.has(choice.group)) {
              keepGroups.add(choice.group)
            }
          }
        }
      }

      result = filteredBySearch.filter((sc) => {
        if (sc?.item?.skip) {
          if (!keepGroups.has(sc?.item?.group)) return false
        }

        return true
      })
    }

    return result
  }
}

global.setScoredChoices = async (choices: ScoredChoice[]) => {
  return await global.sendWait(Channel.SET_SCORED_CHOICES, choices)
}

global.___kitFormatChoices = async (choices, className = '') => {
  if (!Array.isArray(choices)) {
    return choices
  }
  let formattedChoices = formatChoices(choices, className)
  let { __currentPromptConfig } = global as any
  let { shortcuts: globalShortcuts } = __currentPromptConfig || {}

  if (globalShortcuts && choices?.[0]) {
    let shortcuts = globalShortcuts.filter((shortcut) => {
      if (shortcut?.condition) {
        return shortcut.condition(choices?.[0])
      }
      return true
    })

    global.send(Channel.SET_SHORTCUTS, shortcuts)
  }
  global.kitPrevChoices = formattedChoices

  global.setLoading(false)
  return formattedChoices
}

global.setChoices = async (choices, config) => {
  let formattedChoices = await global.___kitFormatChoices(choices, config?.className || '')
  global.send(Channel.SET_CHOICES, {
    choices: formattedChoices,
    skipInitialSearch: config?.skipInitialSearch,
    inputRegex: config?.inputRegex || '',
    generated: Boolean(config?.generated)
  })

  performance.measure('SET_CHOICES', 'run')
}

global.flag ||= {}
global.prepFlags = (flagsOptions: FlagsObject): FlagsObject => {
  for (let key of Object.keys(global?.flag)) {
    delete global?.flag?.[key]
  }

  if (!flagsOptions || Object.entries(flagsOptions)?.length === 0) {
    return false
  }

  let validFlags = {
    sortChoicesKey: (flagsOptions as FlagsWithKeys)?.sortChoicesKey || [],
    order: (flagsOptions as FlagsWithKeys)?.order || []
  }
  let currentFlags = Object.entries(flagsOptions)
  for (let [key, value] of currentFlags) {
    if (key === 'order') continue
    if (key === 'sortChoicesKey') continue

    // Strip non-serializable functions before sending to avoid IPC serialization issues
    const { onAction, condition, preview, ...rest } = value ?? {}
    let validFlag = {
      ...rest,
      name: value?.name || key,
      shortcut: value?.shortcut || '',
      description: value?.description || '',
      value: key,
      bar: value?.bar || '',
      preview: typeof preview === 'string' ? preview : '',
      hasAction: Boolean(onAction)
    }
    validFlags[key] = validFlag

    if (value?.group) {
      validFlags[key].group = value.group
    }
  }

  for (const [key, value] of currentFlags) {
    if (key === 'order') continue
    if (key === 'sortChoicesKey') continue
    const choice = {
      id: key,
      name: value?.name || key,
      value: key,
      description: value?.description || '',
      preview: value?.preview || '<div></div>',
      shortcut: value?.shortcut || '',
      onAction: value?.onAction || null
    } as Choice

    if (value?.group) {
      choice.group = value.group
    }

    // Use the flag key (not the display name) as the map key, since that's what the UI sends back
    global.__kitActionsMap.set(key, choice)
    // console.log(`[SDK] Storing action in map with key: ${key}`, {
    //   name: choice.name,
    //   onAction: typeof value?.onAction,
    //   shortcut: choice.shortcut
    // })
  }

  return validFlags
}

global.setFlags = async (flags: FlagsObject, options = {}) => {
  let flagsMessage = {
    flags: global.prepFlags(flags),
    options: {
      name: options?.name || '',
      placeholder: options?.placeholder || '',
      active: options?.active || 'Actions'
    }
  }
  // TODO: Move props from FlagsObject like "order", "sortChoicesKey" to the options
  // console.log(`[SDK] Sending flags to app:`, {
  //   flagKeys: Object.keys(flagsMessage.flags),
  //   flagsWithHasAction: Object.entries(flagsMessage.flags).map(([k, v]) => ({
  //     key: k,
  //     name: (v as any).name,
  //     hasAction: (v as any).hasAction,
  //     shortcut: (v as any).shortcut
  //   }))
  // })
  await global.sendWait(Channel.SET_FLAGS, flagsMessage)
}

function sortArrayByIndex(arr) {
  const sortedArr = []
  const indexedItems = []

  // Separate indexed items from non-indexed items
  arr.forEach((item, i) => {
    if (item.hasOwnProperty('index')) {
      indexedItems.push({ item, index: item.index })
    } else {
      sortedArr.push(item)
    }
  })

  // Sort indexed items based on their index
  indexedItems.sort((a, b) => a.index - b.index)

  // Insert indexed items into the sorted array at their respective positions
  for (const { item, index } of indexedItems) {
    sortedArr.splice(index, 0, item)
  }

  return sortedArr
}

export let getFlagsFromActions = (actions: PromptConfig['actions']) => {
  let flags: FlagsObject = {}
  let indices = new Set()
  for (let a of actions as Action[]) {
    if (a?.index) {
      indices.add(a.index)
    }
  }
  let groups = new Set()
  if (Array.isArray(actions)) {
    const sortedActions = sortArrayByIndex(actions)
    for (let i = 0; i < sortedActions.length; i++) {
      let action = sortedActions[i]
      if (typeof action === 'string') {
        action = {
          name: action,
          flag: action
        }
      }
      if (action?.group) {
        groups.add(action.group)
      }

      let flagAction = {
        flag: action.flag || action.name,
        index: i,
        close: true,
        ...action,
        hasAction: !!action?.onAction,
        bar: action?.visible ? 'right' : ''
      } as Action
      flags[action.flag || action.name] = flagAction
    }
  }

  flags.sortChoicesKey = Array.from(groups).map((g) => 'index')

  return flags
}

global.setActions = async (actions: Action[], options = {}) => {
  let flags = getFlagsFromActions(actions)
  await setFlags(flags, options)
}

global.openActions = async () => {
  await sendWait(Channel.OPEN_ACTIONS)
}

global.closeActions = async () => {
  await sendWait(Channel.CLOSE_ACTIONS)
}

global.setFlagValue = (value: any) => {
  return global.sendWait(Channel.SET_FLAG_VALUE, value)
}

global.hide = async (hideOptions = {}) => {
  await global.sendWait(Channel.HIDE_APP, hideOptions)
  if (process.env.KIT_HIDE_DELAY) {
    await wait(-process.env.KIT_HIDE_DELAY)
  }
}

global.show = async () => {
  await global.sendWait(Channel.SHOW_APP)
}

global.blur = async () => {
  await global.sendWait(Channel.BLUR_APP, {})
}

global.run = run

let wrapCode = (html: string, containerClass: string, codeStyles = '') => {
  return `<pre class="${containerClass}">
  <style type="text/css">
      code{
        font-size: 0.9rem !important;
        width: 100%;
        ${codeStyles}
      }
      pre{
        display: flex;
      }
      p{
        margin-bottom: 1rem;
      }
  </style>
  <code>
${html.trim()}
  </code>
</pre>`
}

let getLanguage = (language: string) => {
  if (language.includes('python')) return 'python'
  if (language.includes('ruby')) return 'ruby'
  if (language.includes('php')) return 'php'
  if (language.includes('perl')) return 'perl'

  switch (language) {
    case 'node':
      language = 'javascript'
      break

    case 'sh':
    case 'zsh':
      language = 'bash'
      break

    case 'irb':
      language = 'ruby'
      break

    case 'raku':
    case 'perl6':
      language = 'perl'
      break

    case 'ps1':
    case 'pwsh':
      language = 'powershell'
      break

    case 'tclsh':
      language = 'tcl'
      break

    case 'erl':
    case 'escript':
      language = 'erlang'
      break

    case 'iex':
      language = 'elixir'
      break

    case 'rscript':
    case 'r':
      language = 'r'
      break

    case 'ghci':
    case 'hugs':
      language = 'haskell'
      break

    default:
      // If the language is not recognized or already has the correct syntax, leave it as is.
      break
  }

  return language
}

export let highlightJavaScript = async (filePath: string, shebang = ''): Promise<string> => {
  let isPathAFile = await isFile(filePath)
  let contents = ``
  if (isPathAFile) {
    contents = await readFile(filePath, 'utf8')
  } else {
    contents = filePath.trim()
  }

  let { default: highlight } = global.__kitHighlight || (await import('highlight.js'))
  if (!global.__kitHighlight) global.__kitHighlight = { default: highlight }
  let highlightedContents = ``
  if (shebang) {
    // split shebang into command and args
    let [command, ...shebangArgs] = shebang.split(' ')

    let language = command.endsWith('env') ? shebangArgs?.[0] : command.split('/').pop() || 'bash'

    language = getLanguage(language)
    highlightedContents = highlight.highlight(contents, {
      language
    }).value
  } else {
    highlightedContents = highlight.highlight(contents, {
      language: 'javascript'
    }).value
  }

  let wrapped = wrapCode(highlightedContents, 'px-5')
  return wrapped
}

let order = [
  'Script Actions',
  'New',
  'Copy',
  'Debug',
  'Kenv',
  'Git',
  'Share',
  'Export',
  // "DB",
  'Run'
]

export let actions: Action[] = [
  // {
  //   name: "New Menu",
  //   key: `${cmd}+shift+n`,
  //   onPress: async () => {
  //     await run(kitPath("cli", "new-menu.js"))
  //   },
  // },
  {
    name: 'New Script',
    description: 'Create a new script',
    shortcut: `${cmd}+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new.js'))
    },
    group: 'New'
  },
  {
    name: 'Generate Script with AI',
    description: 'Generate a new script with AI',
    shortcut: `${cmd}+g`,
    onAction: async () => {
      await run(kitPath('cli', 'generate.js'))
    },
    group: 'New'
  },
  {
    name: 'New Scriptlet',
    description: 'Create a new scriptlet',
    shortcut: `${cmd}+shift+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new-scriptlet.js'))
    },
    group: 'New'
  },
  {
    name: 'New Snippet',
    description: 'Create a new snippet',
    shortcut: `${cmd}+opt+n`,
    onAction: async () => {
      await run(kitPath('cli', 'new-snippet.js'))
    },
    group: 'New'
  },
  {
    name: 'New Theme',
    description: 'Create a new theme',
    onAction: async () => {
      await run(kitPath('cli', 'new-theme.js'))
    },
    group: 'New'
  },
  {
    name: 'Sign In',
    description: 'Log in to GitHub to Script Kit',
    flag: 'sign-in-to-script-kit',
    shortcut: `${cmd}+shift+opt+s`,
    onAction: async () => {
      await run(kitPath('main', 'account-v2.js'))
    },
    group: 'Settings'
  },
  {
    name: 'List Processes',
    description: 'List running processes',
    shortcut: `${cmd}+p`,
    onAction: async () => {
      let processes = await getProcesses()
      if (processes.filter((p) => p?.scriptPath)?.length > 1) {
        await run(kitPath('cli', 'processes.js'))
      } else {
        toast('No running processes found...')
      }
    },
    group: 'Debug'
  },
  {
    name: 'Find Script',
    description: 'Search for a script by contents',
    shortcut: `${cmd}+f`,
    onAction: async () => {
      // Don't clear all flags - preserve existing action flags
      // global.setFlags({})  
      await run(kitPath('cli', 'find.js'))
    },
    group: 'Script Actions'
  },
  {
    name: 'Reset Prompt',
    shortcut: `${cmd}+0`,
    onAction: async () => {
      await run(kitPath('cli', 'kit-clear-prompt.js'))
    },
    group: 'Script Actions'
  },
  // TODO: Figure out why setFlags is being called twice and overridden here
  // {
  //   name: "Share",
  //   description: "Share {{name}}",
  //   shortcut: `${cmd}+s`,
  //   condition: c => !c.needsDebugger,
  //   onAction: async (input, { focused }) => {
  //     let shareFlags = {}
  //     for (let [k, v] of Object.entries(scriptFlags)) {
  //       if (k.startsWith("share")) {
  //         shareFlags[k] = v
  //         delete shareFlags[k].group
  //       }
  //     }
  //     await setFlags(shareFlags)
  //     await setFlagValue(focused?.value)
  //   },
  //   group: "Script Actions",
  // },
  {
    name: 'Debug',
    shortcut: `${cmd}+enter`,
    condition: (c) => c.needsDebugger,
    onAction: async (input, { focused }) => {
      flag.cmd = true
      submit(focused)
    },
    group: 'Debug'
  },
  {
    name: 'Support',
    shortcut: `${cmd}+i`,
    close: false,
    onAction: async () => {
      let userJson = await getUserJson()
      let loggedIn = userJson?.login
      let helpActions: Action[] = [
        ...(loggedIn
          ? [
            {
              name: 'Sign Out',
              description: 'Sign out of Script Kit',
              onAction: async () => {
                await deauthenticate()
              }
            }
          ]
          : [
            {
              name: 'Sign In',
              description: 'Sign in to Script Kit',
              onAction: async () => {
                await run(kitPath('main', 'account-v2.js'))
              }
            }
          ]),
        {
          name: 'Read Docs',
          description: 'Read the docs',
          onAction: async () => {
            await open('https://scriptkit.com/docs')
            exit()
          }
        },
        {
          name: 'Ask a Question',
          description: 'Open GitHub Discussions',
          onAction: async () => {
            await open(`https://github.com/johnlindquist/kit/discussions`)
            exit()
          }
        },
        {
          name: 'Report a Bug',
          description: 'Open GitHub Issues',
          onAction: async () => {
            await open(`https://github.com/johnlindquist/kit/issues`)
            exit()
          }
        },
        {
          name: 'Join Discord Server',
          description: 'Hang out on Discord',
          onAction: async () => {
            let response = await get('https://scriptkit.com/api/discord-invite')
            await open(response.data)
            exit()
          }
        }
      ]
      await setActions(helpActions, {
        name: `Script Kit ${process.env.KIT_APP_VERSION}`,
        placeholder: 'Support',
        active: 'Script Kit Support'
      })
      openActions()
    },
    group: 'Support'
  }
]

export let modifiers = {
  cmd: 'cmd',
  shift: 'shift',
  opt: 'opt',
  ctrl: 'ctrl'
}

export let scriptFlags: FlagsObject = {
  order,
  sortChoicesKey: order.map((o) => ''),
  // open: {
  //   name: "Script Actions",
  //   description: "Open {{name}} in your editor",
  //   shortcut: `${cmd}+o`,
  //   action: "right",
  // },
  // ["new-menu"]: {
  //   name: "New",
  //   description: "Create a new script",
  //   shortcut: `${cmd}+n`,
  //   action: "left",
  // },
  ['edit-script']: {
    name: 'Edit',
    shortcut: `${cmd}+o`,
    group: 'Script Actions',
    description: 'Open {{name}} in your editor',
    preview: async (input, state) => {
      let flaggedFilePath = state?.flaggedValue?.filePath
      if (!flaggedFilePath) return

      // Get last modified time
      let { size, mtime, mtimeMs } = await stat(flaggedFilePath)
      let lastModified = new Date(mtimeMs)

      let stamps = await getTimestamps()
      let stamp = stamps.stamps.find((s) => s.filePath === flaggedFilePath)

      let composeBlock = (...lines) => lines.filter(Boolean).join('\n')

      let compileMessage = stamp?.compileMessage?.trim() || ''
      let compileStamp = stamp?.compileStamp
        ? `Last compiled: ${formatDistanceToNow(new Date(stamp?.compileStamp), {
          addSuffix: false
        })} ago`
        : ''
      let executionTime = stamp?.executionTime ? `Last run duration: ${stamp?.executionTime}ms` : ''
      let runCount = stamp?.runCount ? `Run count: ${stamp?.runCount}` : ''

      let compileBlock = composeBlock(compileMessage && `* ${compileMessage}`, compileStamp && `* ${compileStamp}`)

      if (compileBlock) {
        compileBlock = `### Compile Info\n${compileBlock}`.trim()
      }

      let executionBlock = composeBlock(runCount && `* ${runCount}`, executionTime && `* ${executionTime}`)

      if (executionBlock) {
        executionBlock = `### Execution Info\n${executionBlock}`.trim()
      }

      let lastRunBlock = ''
      if (stamp) {
        let lastRunDate = new Date(stamp.timestamp)
        lastRunBlock = `### Last Run
  - ${lastRunDate.toLocaleString()}
  - ${formatDistanceToNow(lastRunDate, { addSuffix: false })} ago
  `.trim()
      }

      let modifiedBlock = `### Last Modified 
- ${lastModified.toLocaleString()}      
- ${formatDistanceToNow(lastModified, { addSuffix: false })} ago`

      let info = md(
        `# Stats

#### ${flaggedFilePath}

${compileBlock}
  
${executionBlock}
  
${modifiedBlock}
  
${lastRunBlock}
  
`.trim()
      )
      return info
    }
  },
  [cmd]: {
    group: 'Debug',
    name: 'Debug Script',
    description: 'Open inspector. Pause on debugger statements.',
    shortcut: `${cmd}+enter`,
    flag: cmd
  },
  [modifiers.opt]: {
    group: 'Debug',
    name: 'Open Log Window',
    description: 'Open a log window for {{name}}',
    shortcut: 'alt+enter',
    flag: modifiers.opt
  },
  'push-script': {
    group: 'Git',
    name: 'Push to Git Repo',
    description: 'Push {{name}} to a git repo'
  },
  'pull-script': {
    group: 'Git',
    name: 'Pull from Git Repo',
    description: 'Pull {{name}} from a git repo'
  },

  'edit-doc': {
    group: 'Script Actions',
    name: 'Create/Edit Doc',
    shortcut: `${cmd}+.`,
    description: "Open {{name}}'s markdown in your editor"
  },
  'share-script-to-scriptkit': {
    group: 'Share',
    name: 'Share to ScriptKit.com',
    description: 'Share {{name}} to the community script library',
    shortcut: `${cmd}+s`
  },
  'share-script-as-discussion': {
    group: 'Share',
    name: 'Post to Community Scripts',
    description: 'Share {{name}} on GitHub Discussions',
    shortcut: `${cmd}+opt+s`
  },
  'share-script-as-link': {
    group: 'Share',
    name: 'Create Install URL',
    description: 'Create a link which will install the script',
    shortcut: `${cmd}+shift+s`
  },
  'share-script-as-kit-link': {
    group: 'Share',
    name: 'Share as private kit:// link',
    description: 'Create a private link which will install the script'
  },
  'share-script': {
    group: 'Share',
    name: 'Share as Gist',
    description: 'Share {{name}} as a gist'
  },
  'share-script-as-markdown': {
    group: 'Share',
    name: 'Share as Markdown',
    description: 'Copies script contents in fenced JS Markdown'
  },
  'share-copy': {
    group: 'Copy',
    name: 'Copy script contents to clipboard',
    description: 'Copy script contents to clipboard',
    shortcut: `${cmd}+c`
  },
  'copy-path': {
    group: 'Copy',
    name: 'Copy Path',
    description: 'Copy full path of script to clipboard'
  },
  'paste-as-markdown': {
    group: 'Copy',
    name: 'Paste as Markdown',
    description: 'Paste the contents of the script as Markdown',
    shortcut: `${cmd}+shift+p`
  },
  duplicate: {
    group: 'Script Actions',
    name: 'Duplicate',
    description: 'Duplicate {{name}}',
    shortcut: `${cmd}+d`
  },
  rename: {
    group: 'Script Actions',
    name: 'Rename',
    description: 'Rename {{name}}',
    shortcut: `${cmd}+shift+r`
  },
  remove: {
    group: 'Script Actions',
    name: 'Remove',
    description: 'Delete {{name}}',
    shortcut: `${cmd}+shift+backspace`
  },
  'remove-from-recent': {
    group: 'Script Actions',
    name: 'Remove from Recent',
    description: 'Remove {{name}} from the recent list'
  },
  'clear-recent': {
    group: 'Script Actions',
    name: 'Clear Recent',
    description: 'Clear the recent list of scripts'
  },
  // ["open-script-database"]: {
  //   group: "DB",
  //   name: "Open Database",
  //   description: "Open the db file for {{name}}",
  //   shortcut: `${cmd}+b`,
  // },
  // ["clear-script-database"]: {
  //   group: "DB",
  //   name: "Delete Database",
  //   description:
  //     "Delete the db file for {{name}}",
  // },
  'reveal-script': {
    group: 'Script Actions',
    name: 'Reveal',
    description: `Reveal {{name}} in ${isMac ? 'Finder' : 'Explorer'}`,
    shortcut: `${cmd}+shift+f`
  },
  'kenv-term': {
    group: 'Kenv',
    name: 'Open Script Kenv in a  Terminal',
    description: "Open {{name}}'s kenv in a terminal"
  },
  'kenv-trust': {
    group: 'Kenv',
    name: 'Trust Script Kenv',
    description: "Trust {{name}}'s kenv"
  },
  'kenv-view': {
    group: 'Kenv',
    name: 'View Script Kenv',
    description: "View {{name}}'s kenv"
  },
  'kenv-visit': {
    group: 'Kenv',
    name: 'Open Script Repo',
    description: "Visit {{name}}'s kenv in your browser"
  },
  // ["share"]: {
  //   name: "Share",
  //   description: "Share {{name}}",
  //   shortcut: `${cmd}+s`,
  //   bar: "right",
  // },
  // ["share-script"]: {
  //   name: "Share as Gist",
  //   description: "Share {{name}} as a gist",
  //   shortcut: `${cmd}+g`,
  // },
  // ["share-script-as-kit-link"]: {
  //   name: "Share as kit:// link",
  //   description:
  //     "Create a link which will install the script",
  //   shortcut: "option+s",
  // },
  // ["share-script-as-link"]: {
  //   name: "Share as URL",
  //   description:
  //     "Create a URL which will install the script",
  //   shortcut: `${cmd}+u`,
  // },
  // ["share-script-as-discussion"]: {
  //   name: "Share as GitHub Discussion",
  //   description:
  //     "Copies shareable info to clipboard and opens GitHub Discussions",
  // },
  // ["share-script-as-markdown"]: {
  //   name: "Share as Markdown",
  //   description:
  //     "Copies script contents in fenced JS Markdown",
  //   shortcut: `${cmd}+m`,
  // },
  'change-shortcut': {
    group: 'Script Actions',
    name: 'Change Shortcut',
    description: 'Prompts to pick a new shortcut for the script'
  },
  move: {
    group: 'Kenv',
    name: 'Move Script to Kenv',
    description: 'Move the script between Kit Environments'
  },
  'stream-deck': {
    group: 'Export',
    name: 'Prepare Script for Stream Deck',
    description: 'Create a .sh file around the script for Stream Decks'
  },
  'open-script-log': {
    group: 'Debug',
    name: 'Open Log File',
    description: 'Open the log file for {{name}}',
    shortcut: `${cmd}+l`
  },
  [modifiers.shift]: {
    group: 'Run',
    name: 'Run script w/ shift flag',
    shortcut: 'shift+enter',
    flag: 'shift'
  },
  [modifiers.ctrl]: {
    group: 'Run',
    name: 'Run script w/ ctrl flag',
    shortcut: 'ctrl+enter',
    flag: 'ctrl'
  },
  settings: {
    group: 'Settings',
    name: 'Settings',
    description: 'Open the settings menu',
    shortcut: `${cmd}+,`
  }
}

export function buildScriptConfig(message: string | PromptConfig): PromptConfig {
  let scriptsConfig = typeof message === 'string' ? { placeholder: message } : message
  scriptsConfig.scripts = true
  scriptsConfig.resize = false
  scriptsConfig.enter ||= 'Select'
  scriptsConfig.preventCollapse = true
  return scriptsConfig
}

async function getScriptResult(script: Script | string, message: string | PromptConfig): Promise<Script> {
  if (typeof script === 'string' && (typeof message === 'string' || message?.strict === true)) {
    return await getScriptFromString(script)
  }
  return script as Script //hmm...
}

export let getApps = async () => {
  let { choices } = await readJson(kitPath('db', 'apps.json')).catch((error) => ({
    choices: []
  }))

  if (choices.length === 0) {
    return []
  }

  let groupedApps = choices.map((c) => {
    c.group = 'Apps'
    return c
  })

  return groupedApps
}

export let splitEnvVarIntoArray = (envVar: string | undefined, fallback: string[]) => {
  return envVar
    ? envVar
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : fallback
}

let groupScripts = (scripts) => {
  let excludeGroups = global?.env?.KIT_EXCLUDE_KENVS?.split(',').map((k) => k.trim()) || []

  return groupChoices(scripts, {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: splitEnvVarIntoArray(process?.env?.KIT_MAIN_ORDER, ['Favorite', 'Main', 'Scriptlets', 'Kit']),

    endOrder: splitEnvVarIntoArray(process?.env?.KIT_MAIN_END_ORDER, ['Apps', 'Pass']),
    recentKey: 'timestamp',
    excludeGroups,
    recentLimit: getRecentLimit(),
    hideWithoutInput: splitEnvVarIntoArray(process?.env?.KIT_HIDE_WITHOUT_INPUT, []),
    tagger
  })
}

let processedScripts = []
export let getProcessedScripts = async (fromCache = true) => {
  if (fromCache && global.__kitScriptsFromCache && processedScripts.length) {
    return processedScripts
  }

  trace.begin({
    name: 'getScripts'
  })
  let scripts: Script[] = await getScripts(fromCache)
  trace.end({
    name: 'getScripts'
  })

  trace.begin({
    name: 'getTimestamps'
  })
  let timestampsDb = await getTimestamps()
  trace.end({
    name: 'getTimestamps'
  })

  global.__kitScriptsFromCache = true

  trace.begin({
    name: 'processedScripts = await Promise.all'
  })
  processedScripts = await processInBatches(scripts.map(processScript(timestampsDb.stamps)), 100)

  trace.end({
    name: 'processedScripts = await Promise.all'
  })

  return processedScripts
}

export let getGroupedScripts = async (fromCache = true) => {
  trace.begin({
    name: 'getProcessedScripts'
  })
  let processedscripts = await getProcessedScripts(fromCache)
  trace.end({
    name: 'getProcessedScripts'
  })

  let apps = (await getApps()).map((a) => {
    a.ignoreFlags = true
    return a
  })
  if (apps.length) {
    processedscripts = processedscripts.concat(apps)
  }

  let kitScripts = [
    // kitPath("cli", "new.js"),
    kitPath('cli', 'generate.js'),
    kitPath('cli', 'new-menu.js'),
    kitPath('cli', 'new-scriptlet.js'),
    kitPath('cli', 'new-snippet.js'),
    kitPath('cli', 'new-theme.js'),
    kitPath('cli', 'share.js'),
    kitPath('cli', 'find.js'),
    // kitPath('main', 'docs.js'),
    kitPath('main', 'kit.js'),
    kitPath('cli', 'processes.js'),
    kitPath('cli', 'kenv-manage.js'),
    kitPath('main', 'kit-windows.js'),
    kitPath('main', 'file-search.js')
    // kitPath("main", "google.js"),
  ]

  if (global?.env?.KIT_LOGIN) {
    kitScripts.push(kitPath('main', 'account-v2.js'))
  } else {
    kitScripts.push(kitPath('main', 'sign-in.js'))
  }

  if (global?.env?.KIT_PRO !== 'true') {
    kitScripts.push(kitPath('main', 'sponsor.js'))
  }

  kitScripts = kitScripts.concat([
    kitPath("main", "docs.js"),
    // kitPath("main", "api.js"),
    // kitPath("main", "guide.js"),
    // kitPath("main", "tips.js"),
    // kitPath("main", "suggest.js"),
    kitPath('main', 'datamuse.js'),
    kitPath('main', 'giphy.js'),
    kitPath('main', 'browse.js'),
    kitPath('main', 'app-launcher.js'),
    // kitPath("main", "account.js"),
    kitPath('main', 'dev.js'),
    // kitPath('main', 'hot.js'),
    kitPath('main', 'snippets.js'),
    kitPath('main', 'term.js'),
    kitPath('main', 'sticky.js'),
    kitPath('main', 'spell.js'),
    kitPath('main', 'define.js'),
    kitPath('main', 'rhyme.js'),
    kitPath('cli', 'manage-npm.js'),
    kitPath('main', 'clipboard-history.js'),
    kitPath('main', 'emoji.js'),

    kitPath('pro', 'theme-selector.js')
  ])

  if (isMac) {
    kitScripts.push(kitPath('main', 'system-commands.js'))
    kitScripts.push(kitPath('main', 'focus-window.js'))

    if (!Boolean(global?.env?.KIT_ACCESSIBILITY)) {
      kitScripts.push(kitPath('main', 'accessibility.js'))
    }
  }

  if (process.env.KIT_HIDE_KIT_SCRIPTS) {
    kitScripts = []
  }

  trace.begin({
    name: 'parsedKitScripts'
  })
  let parsedKitScripts = await processInBatches(
    kitScripts.map(async (scriptPath) => {
      let script = await parseScript(scriptPath)

      script.group = 'Kit'
      script.ignoreFlags = true
      script.preview = `<div></div>`

      processPreviewPath(script)

      return script
    }),
    5
  )

  trace.end({
    name: 'parsedKitScripts'
  })

  processedscripts = processedscripts.concat(parsedKitScripts)

  // let getHot = async () => {
  //   let hotPath = kitPath("data", "hot.json")
  //   if (await isFile(hotPath)) {
  //     return await readJson(hotPath)
  //   }

  //   return []
  // }

  // let loadHotChoices = async () => {
  //   try {
  //     let hot = await getHot()

  //     return hot.map(choice => {
  //       choice.preview = async () => {
  //         if (choice?.body) {
  //           return await highlight(choice?.body)
  //         }

  //         return ""
  //       }

  //       choice.group = "Community"
  //       choice.enter = "View Discussion"
  //       choice.lastGroup = true

  //       return choice
  //     })
  //   } catch (error) {
  //     return [error.message]
  //   }
  // }

  // let communityScripts = await loadHotChoices()

  // processedscripts = processedscripts.concat(
  //   communityScripts
  // )

  // let scraps = await parseScraps()
  // processedscripts = processedscripts.concat(scraps)

  trace.begin({
    name: 'groupScripts'
  })
  let groupedScripts = groupScripts(processedscripts)
  trace.end({
    name: 'groupScripts'
  })

  groupedScripts = groupedScripts.map((s) => {
    if (s.group === 'Pass') {
      s.ignoreFlags = true
    }

    return s
  })

  return groupedScripts
}

export let mainMenu = async (message: string | PromptConfig = 'Select a script'): Promise<Script | string> => {
  // if (global.trace) {
  //   global.trace.addBegin({
  //     name: "buildScriptConfig",
  //     tid: 0,
  //     args: `Build main menu`,
  //   })
  // }

  trace.begin({
    name: 'buildScriptConfig'
  })

  let scriptsConfig = buildScriptConfig(message)

  trace.end({
    name: 'buildScriptConfig'
  })

  scriptsConfig.keepPreview = true

  // We preload from an in-memory cache, then replace with the actual scripts
  global.__kitScriptsFromCache = false

  trace.begin({
    name: 'getGroupedScripts'
  })
  let groupedScripts = await getGroupedScripts()
  trace.end({
    name: 'getGroupedScripts'
  })

  process.send({
    channel: Channel.MAIN_MENU_READY,
    scripts: groupedScripts.length
  })
  let script = await global.arg(scriptsConfig, groupedScripts)
  return await getScriptResult(script, message)
}

export let selectScript = async (
  message: string | PromptConfig = 'Select a script',
  fromCache = true,
  xf = (x: Script[]) => x,
  ignoreKenvPattern = /^ignore$/
): Promise<Script> => {
  let scripts: Script[] = xf(await getScripts(fromCache, ignoreKenvPattern))
  let scriptsConfig = buildScriptConfig(message)

  if (process.env.KIT_CONTEXT === 'terminal') {
    let script = await global.arg(scriptsConfig, scripts)
    return await getScriptResult(script, message)
  }
  let groupedScripts = groupScripts(scripts)

  scriptsConfig.keepPreview = true

  let script = await global.arg(scriptsConfig, groupedScripts)
  return await getScriptResult(script, message)
}

export let processPreviewPath = (s: Script) => {
  if (s.previewPath) {
    s.preview = async () => {
      let previewPath = getPreviewPath(s)

      let preview = `<div></div>`

      if (await isFile(previewPath)) {
        preview = md(await readFile(previewPath, 'utf8'))
      }

      return preview
    }
  }
}

export let processScriptPreview =
  (script: Script, infoBlock = '') =>
    async () => {
      if ((script as Scriptlet)?.scriptlet) {
        return script.preview
      }
      let previewPath = getPreviewPath(script)
      let preview = ``

      if (await isFile(previewPath)) {
        preview = await processWithPreviewFile(script, previewPath, infoBlock)
      } else if (typeof script?.preview === 'string') {
        preview = await processWithStringPreview(script, infoBlock)
      } else {
        preview = await processWithNoPreview(script, infoBlock)
      }

      return preview
    }

// TODO: The logic around scripts + stats/timestamps is confusing. Clean it up.
export let processScript =
  (timestamps: Stamp[] = []) =>
    async (s: Script): Promise<Script> => {
      let stamp = timestamps.find((t) => t.filePath === s.filePath)

      let infoBlock = ``
      if (stamp) {
        s.compileStamp = stamp.compileStamp
        s.compileMessage = stamp.compileMessage
        s.timestamp = stamp.timestamp

        if (stamp.compileMessage && stamp.compileStamp) {
          infoBlock = `~~~
⚠️ Last compiled ${formatDistanceToNow(new Date(stamp.compileStamp), {
            addSuffix: false
          })} ago`
        }
      }
      if (!(s as Scriptlet)?.scriptlet) {
        s.preview = processScriptPreview(s, infoBlock) as () => Promise<string>
      }

      return s
    }

export let getPreviewPath = (s: Script): string => {
  if (s?.previewPath) {
    return path.normalize(s.previewPath.replace('~', home()).replace('$KIT', kitPath()))
  }
  return path.resolve(path.dirname(path.dirname(s.filePath)), 'docs', path.parse(s.filePath).name + '.md')
}

export let processWithPreviewFile = async (s: Script, previewPath: string, infoBlock: string): Promise<string> => {
  let processedPreview = ``
  try {
    let preview = await readFile(previewPath, 'utf8')
    let content = await highlightJavaScript(s.filePath, s.shebang)
    processedPreview = md(infoBlock + preview) + content
  } catch (error) {
    processedPreview = md(`Could not find doc file ${previewPath} for ${s.name}`)
    warn(`Could not find doc file ${previewPath} for ${s.name}`)
  }

  return processedPreview
}

export let processWithStringPreview = async (s: Script, infoBlock: string) => {
  let processedPreview = ``
  if (s?.preview === 'false') {
    processedPreview = `<div/>`
  } else {
    try {
      let content = await readFile(path.resolve(path.dirname(s.filePath), s?.preview as string), 'utf-8')
      processedPreview = infoBlock ? md(infoBlock) : `` + md(content)
    } catch (error) {
      processedPreview = `Error: ${error.message}`
    }
  }

  return processedPreview
}

export let processWithNoPreview = async (s: Script, infoBlock: string): Promise<string> => {
  let processedPreview = ``
  let preview = await readFile(s.filePath, 'utf8')

  if (preview.startsWith('/*') && preview.includes('*/')) {
    let index = preview.indexOf('*/')
    let content = preview.slice(2, index).trim()
    let markdown = md(infoBlock + content)
    let js = await highlightJavaScript(preview.slice(index + 2).trim())
    return markdown + js
  }

  let markdown = md(`# ${s.name}

~~~
${path.basename(s?.filePath)}
~~~

<div class="pb-2.5"></div>

${s?.description ? s.description : ''}
${s?.note ? `> ${s.note}` : ''}
`)

  let content = await highlightJavaScript(preview, s?.shebang || '')

  processedPreview = markdown + (infoBlock ? md(infoBlock) : `` + content)
  return processedPreview
}

global.selectScript = selectScript

export let selectKenv = async (
  config = {
    placeholder: 'Select a Kenv',
    enter: 'Select Kenv'
  } as PromptConfig,
  // ignorePattern ignores examples and sponsors
  ignorePattern = /^(examples|sponsors)$/
) => {
  let homeKenv = {
    name: 'main',
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: 'main',
      dirPath: kenvPath()
    }
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs(ignorePattern)
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map((p) => {
        let name = path.basename(p)
        return {
          name,
          description: p,
          value: {
            name,
            dirPath: p
          }
        }
      })
    ]

    selectedKenv = await global.arg(config, kenvChoices)

    if (typeof selectedKenv === 'string') {
      return kenvChoices.find(
        (c) => c.value.name === selectedKenv || path.resolve(c.value.dirPath) === path.resolve(selectedKenv as string)
      ).value
    }
  }
  return selectedKenv as Kenv
}

global.selectKenv = selectKenv

global.highlight = highlight

global.setTab = async (tabName: string) => {
  let i = global.onTabs.findIndex(({ name }) => name === tabName)
  await global.sendWait(Channel.SET_TAB_INDEX, i)
  global.onTabs[i].fn()
}

global.execLog = (command: string, logger = global.log) => {
  let writeableStream = new Writable()
  writeableStream._write = (chunk, encoding, next) => {
    logger(chunk.toString().trim())
    next()
  }

  let child = exec(command, {
    all: true,
    shell: process?.env?.KIT_SHELL || (process.platform === 'win32' ? 'cmd.exe' : 'zsh')
  })

  child.all.pipe(writeableStream)

  return child
}

// global.projectPath = (...args) => {
//   throw new Error(
//     `Script not loaded. Can't use projectPath() until a script is imported`
//   )
// }

global.clearTabs = () => {
  global.send(Channel.CLEAR_TABS)
}

global.md = mdUtil

export let isAuthenticated = async () => {
  let envPath = kenvPath('.kenv')
  let envContents = await readFile(envPath, 'utf8')
  // check if the .env file has a GITHUB_SCRIPTKIT_TOKEN
  return envContents.match(/^GITHUB_SCRIPTKIT_TOKEN=.*/g)
}

export let setEnvVar = async (key: string, value: string) => {
  await global.cli('set-env-var', key, value)
}

export let getEnvVar = async (key: string, fallback = '') => {
  let kenvEnv = dotenv.parse(await readFile(kenvPath('.env'), 'utf8')) as kenvEnv
  return kenvEnv?.[key] || fallback
}

export let toggleEnvVar = async (key: keyof kenvEnv, defaultValue = 'true') => {
  let kenvEnv = dotenv.parse(await readFile(kenvPath('.env'), 'utf8')) as kenvEnv
  // Check if the environment variable `key` exists and if its value is equal to the `defaultState`
  // If it is, toggle the value between "true" and "false"
  // If it isn't, set it to the `defaultState`
  await setEnvVar(
    key,
    kenvEnv?.[key] === defaultValue
      ? defaultValue === 'true'
        ? 'false'
        : 'true' // Toggle the value
      : defaultValue // Set to defaultState if not already set
  )
}

//@ts-ignore
export let authenticate = async (): Promise<Octokit> => {
  // @ts-ignore
  let { Octokit } = await import('../share/auth-scriptkit.js')
  let octokit = new Octokit({
    request: {
      fetch: global.fetch
    },
    auth: {
      scopes: ['gist'],
      env: 'GITHUB_SCRIPTKIT_TOKEN'
    }
  })

  let user = await octokit.rest.users.getAuthenticated()

  let userJson = await getUserJson()
  await setUserJson({
    ...userJson,
    ...user.data
  })

  return octokit
}

export let deauthenticate = async () => {
  await setUserJson({})
  await replace({
    files: kenvPath('.env'),
    from: /GITHUB_SCRIPTKIT_TOKEN=.*/g,
    to: '',
    disableGlobs: true
  })
  process.env.GITHUB_SCRIPTKIT_TOKEN = env.GITHUB_SCRIPTKIT_TOKEN = ``

  await mainScript()
}

global.createGist = async (
  content: string,
  { fileName = 'file.txt', description = 'Gist Created in Script Kit', isPublic = false } = {}
) => {
  let octokit = await authenticate()
  let response = await octokit.rest.gists.create({
    description,
    public: isPublic,
    files: {
      [fileName]: {
        content
      }
    }
  })

  return response.data
}

global.browse = (url: string) => {
  return (global as any).open(url)
}

global.PROMPT = PROMPT

global.preload = (scriptPath?: string) => {
  if (process.send) {
    send(Channel.PRELOAD, scriptPath || global.kitScript)
  }
}

global.metadata = {}
global.headers = {}
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
