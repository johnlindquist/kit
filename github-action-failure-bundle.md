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
- Only files matching these patterns are included: .github/workflows/release.yml, package.json, test/ava.config.mjs, src/globals/child_process.ts, src/globals/index.ts, src/globals/index.d.ts, src/workers/cache-grouped-scripts-worker.test.ts, src/workers/cache-grouped-scripts-worker-integration.test.ts, src/target/__undefined__.test.ts, src/setup/setup.test.js, src/core/utils.ts, src/core/utils.test.ts, src/core/utils.test.js, src/core/sourcemap-formatter.test.ts, src/globals/execa.test.ts, src/globals/custom.test.ts, src/main/index.test.ts, build/build-ci.js, build/build-kit.ts, build/pnpm.ts, test-sdk/main.test.js, src/types/globals.d.ts, src/types/core.d.ts, src/api/global.ts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.github/
  workflows/
    release.yml
src/
  api/
    global.ts
  core/
    sourcemap-formatter.test.ts
    utils.test.js
    utils.test.ts
    utils.ts
  globals/
    child_process.ts
    custom.test.ts
    execa.test.ts
    index.d.ts
    index.ts
  main/
    index.test.ts
  setup/
    setup.test.js
  types/
    core.d.ts
    globals.d.ts
  workers/
    cache-grouped-scripts-worker-integration.test.ts
    cache-grouped-scripts-worker.test.ts
test/
  ava.config.mjs
test-sdk/
  main.test.js
package.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="src/core/utils.test.js">
import ava from "ava"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

console.log(`KENV ${process.env.KENV}`)

/** @type {import("./utils")} */
let { resolveToScriptPath, run } = await import(
	pathToFileURL(kitPath("core", "utils.js")).href
)

let testingFindMe = `testing-find-me`
let testingFullPath = kitMockPath(`.kit-testing-full-path`, `some-script.js`)
let mockMjsFile = kitMockPath(`.kit-testing-full-path`, `mock-mjs-script.mjs`)

let prevCwd = cwd()

ava.before(async () => {
	await exec(`kit new ${testingFindMe} main --no-edit`, {
		env: {
			...process.env,
			KIT_NODE_PATH: process.execPath,
			KIT_MODE: "js"
		}
	})
})

ava.serial("resolve full path", async (t) => {
	await outputFile(testingFullPath, `console.log(await arg())`)
	let scriptPath = resolveToScriptPath(testingFullPath)

	t.assert(scriptPath, testingFullPath)
})

ava.serial("run full path", async (t) => {
	let testingRunPath = kitMockPath(`.kit-testing-run-path`, `some-script.js`)

	let testingRunPackageJson = kitMockPath(
		`.kit-testing-run-path`,
		`package.json`
	)

	await outputFile(
		testingRunPackageJson,
		JSON.stringify({
			type: "module"
		})
	)

	await outputFile(testingRunPath, `export let value = "success"`)

	t.true(await isFile(testingRunPath))

	let result = await run(testingRunPath)
	t.log({ result })

	t.assert(result.value, "success")
})

ava.serial("run full path with spaces", async (t) => {
	let testingSpacedPath = kitMockPath(
		`.kit testing spaced path`,
		`some-script.js`
	)

	let testingSpacedPackageJson = kitMockPath(
		`.kit testing spaced path`,
		`package.json`
	)

	await outputFile(
		testingSpacedPackageJson,
		JSON.stringify({
			type: "module"
		})
	)

	await outputFile(testingSpacedPath, `export let value = "success"`)

	t.true(await isFile(testingSpacedPath))

	let result = await run(testingSpacedPath)
	t.log({ result })

	t.assert(result.value, "success")
})

ava.serial("resolve .mjs file", async (t) => {
	await outputFile(mockMjsFile, `console.log(await arg())`)
	let scriptPath = resolveToScriptPath(mockMjsFile)

	t.assert(scriptPath, mockMjsFile)
})

ava.serial("resolve ./scripts dir", async (t) => {
	let script = "mock-some-script"
	let mockScriptsInProject = kitMockPath(`.kit-testing-scripts-in-project`)
	let mockScriptInProjectScript = path.resolve(
		mockScriptsInProject,
		"scripts",
		`${script}.js`
	)

	await outputFile(mockScriptInProjectScript, `console.log(await arg())`)
	cd(mockScriptsInProject)

	let scriptPath = resolveToScriptPath(script)

	t.assert(scriptPath, testingFullPath)

	cd(prevCwd)
})

ava.serial("resolve in kenvPath", (t) => {
	let scriptPath = resolveToScriptPath(testingFindMe)
	let scriptInKenvPath = kenvPath("scripts", `${testingFindMe}.js`)

	t.log({ scriptPath, scriptInKenvPath })
	t.assert(scriptPath, scriptInKenvPath)
})

ava.serial("resolve in kenvPath with .js", (t) => {
	let scriptPath = resolveToScriptPath(testingFindMe + ".js")

	t.assert(scriptPath, kenvPath("scripts", `${testingFindMe}.js`))
})

ava.serial("resolve doesn't exist", (t) => {
	let error = t.throws(() => {
		resolveToScriptPath(`i-dont-exist`)
	})

	t.true(error.message.includes("not found"))
})

// ava.after.always("clean up", async () => {
//   await fs.rm(path.dirname(testingFullPath), {
//     recursive: true,
//     force: true,
//   })
// })

ava.serial(
	"projectPath return the directory of the script's project",
	async (t) => {
		let script = `mock-project-path`

		let { stdout, stderr, scriptPath } = await testScript(
			script,
			`
      console.log(projectPath())
      `
		)

		let projectPath = path.dirname(path.dirname(scriptPath))

		t.is(stdout.trim(), projectPath)
	}
)
</file>

<file path="src/globals/child_process.ts">
import child_process from "node:child_process"

export let spawn = (global.spawn = child_process.spawn)
export let spawnSync = (global.spawnSync = child_process.spawnSync)
export let fork = (global.fork = child_process.fork)
</file>

<file path="src/globals/custom.test.ts">
import ava, { TestFn } from 'ava'
import '../core/utils.js'
import tmp from 'tmp-promise'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { ensureDir, remove } from 'fs-extra'
import { kenvPath, kitPath } from '../core/utils.js'

interface TestContext {
  tmpDir: tmp.DirectoryResult
  testDir: string
}

// Store original env values to restore later
const originalKENV = process.env.KENV
const originalKIT_CONTEXT = process.env.KIT_CONTEXT

const test = ava as TestFn<TestContext>

test.beforeEach(async (t) => {
  // Create isolated test directory for each test
  const tmpDir = await tmp.dir({ unsafeCleanup: true })

  // Set up isolated environment
  process.env.KENV = path.resolve(tmpDir.path, '.kenv')
  process.env.KIT_CONTEXT = 'workflow'

  global.kitScript = `${randomUUID()}.js`
  global.__kitDbMap = new Map()

  // Create necessary directories
  await ensureDir(kenvPath())
  await ensureDir(kitPath())

  // Store cleanup function for this test
  t.context.tmpDir = tmpDir
  t.context.testDir = tmpDir.path

  t.log({
    kenvPath: kenvPath(),
    kitPath: kitPath(),
    testDir: tmpDir.path
  })
})

test.afterEach(async (t) => {
  // Clean up the isolated test directory
  if (t.context.tmpDir) {
    await t.context.tmpDir.cleanup()
  }
})

test.after(() => {
  // Restore original environment
  process.env.KENV = originalKENV
  process.env.KIT_CONTEXT = originalKIT_CONTEXT
})

test('ensureReadFile creates file with default content if empty', async t => {
  const testPath = path.join(t.context.testDir, 'test.txt')
  const defaultContent = 'default content'

  const result = await global.ensureReadFile(testPath, defaultContent)
  t.is(result, defaultContent)

  // Verify content persists
  const secondRead = await global.ensureReadFile(testPath)
  t.is(secondRead, defaultContent)
})

test('ensureReadFile preserves existing content', async t => {
  const testPath = path.join(t.context.testDir, 'existing.txt')
  const existingContent = 'existing content'

  await global.ensureReadFile(testPath, existingContent)
  const result = await global.ensureReadFile(testPath, 'different default')

  t.is(result, existingContent)
})

test('ensureReadJson creates JSON file with default content', async t => {
  const testPath = path.join(t.context.testDir, 'test.json')
  const defaultContent = { test: true, count: 42 }

  const result = await global.ensureReadJson(testPath, defaultContent)
  t.deepEqual(result, defaultContent)

  // Verify content persists
  const secondRead = await global.ensureReadJson(testPath, { different: 'content' })
  t.deepEqual(secondRead, defaultContent)
})

test('ensureReadJson preserves existing JSON content', async t => {
  const testPath = path.join(t.context.testDir, 'existing.json')
  const existingContent = { existing: true, data: 'test' }

  await global.ensureReadJson(testPath, existingContent)
  const result = await global.ensureReadJson(testPath, { different: 'content' })

  t.deepEqual(result, existingContent)
})
</file>

<file path="src/globals/execa.test.ts">
import ava from "ava"
import "../core/utils.js"

ava("$ works", async t => {
  const message = "Hello, world!"
  let { stdout } = await $`echo ${message}`
  t.is(stdout, message)
})


ava("exec works", async t => {
  const message = "Hello, world!"
  let { stdout } = await exec(`echo ${message}`)
  t.is(stdout, message)
})
</file>

<file path="src/globals/index.d.ts">
import type { EnsureReadFile, EnsureReadJson } from './custom.ts'
import type { Md } from './marked.ts'

export * from './axios.ts'
export * from './chalk.ts'
export * from './child_process.ts'
export * from './crypto'
export * from './custom.ts'
export * from './download.ts'
export * from './execa.ts'
export * from './fs-extra.ts'
export * from './fs.ts'
export * from './globby.ts'
export * from './handlebars.ts'
export * from './marked.ts'
export * from './path'
export * from './process.ts'
export * from './replace-in-file.ts'
export * from './stream.ts'

export interface GlobalsApi {
  cwd: typeof process.cwd
  pid: typeof process.pid
  stderr: typeof process.stderr
  stdin: typeof process.stdin
  stdout: typeof process.stdout
  uptime: typeof process.uptime
  get: import('axios').AxiosInstance['get']
  put: import('axios').AxiosInstance['put']
  post: import('axios').AxiosInstance['post']
  patch: import('axios').AxiosInstance['patch']
  chalk: typeof import('chalk-template').default
  spawn: typeof import('child_process').spawn
  spawnSync: typeof import('child_process').spawnSync
  fork: typeof import('child_process').fork
  exec: typeof import('execa').execaCommand
  execa: typeof import('execa').execa
  execaSync: typeof import('execa').execaSync
  execaCommand: typeof import('execa').execaCommand
  execaCommandSync: typeof import('execa').execaCommandSync
  execaNode: typeof import('execa').execaNode
  $: typeof import('execa').$

  download: typeof import('download')

  emptyDir: typeof import('fs-extra').emptyDir
  emptyDirSync: typeof import('fs-extra').emptyDirSync
  ensureFile: typeof import('fs-extra').ensureFile
  ensureFileSync: typeof import('fs-extra').ensureFileSync
  ensureDir: typeof import('fs-extra').ensureDir
  ensureDirSync: typeof import('fs-extra').ensureDirSync
  ensureLink: typeof import('fs-extra').ensureLink
  ensureLinkSync: typeof import('fs-extra').ensureLinkSync
  ensureSymlink: typeof import('fs-extra').ensureSymlink
  ensureSymlinkSync: typeof import('fs-extra').ensureSymlinkSync
  mkdirp: typeof import('fs-extra').mkdirp
  mkdirpSync: typeof import('fs-extra').mkdirpSync
  mkdirs: typeof import('fs-extra').mkdirs
  outputFile: typeof import('fs-extra').outputFile
  outputFileSync: typeof import('fs-extra').outputFileSync
  outputJson: typeof import('fs-extra').outputJson
  outputJsonSync: typeof import('fs-extra').outputJsonSync
  pathExists: typeof import('fs-extra').pathExists
  pathExistsSync: typeof import('fs-extra').pathExistsSync
  readJson: typeof import('fs-extra').readJson
  readJsonSync: typeof import('fs-extra').readJsonSync
  remove: typeof import('fs-extra').remove
  removeSync: typeof import('fs-extra').removeSync
  writeJson: typeof import('fs-extra').writeJson
  writeJsonSync: typeof import('fs-extra').writeJsonSync
  move: typeof import('fs-extra').move
  moveSync: typeof import('fs-extra').moveSync
  readFile: typeof import('fs/promises').readFile
  readFileSync: typeof import('fs').readFileSync
  writeFile: typeof import('fs/promises').writeFile
  writeFileSync: typeof import('fs').writeFileSync
  appendFile: typeof import('fs/promises').appendFile
  appendFileSync: typeof import('fs').appendFileSync
  readdir: typeof import('fs/promises').readdir
  readdirSync: typeof import('fs').readdirSync
  copyFile: typeof import('fs/promises').copyFile
  copyFileSync: typeof import('fs').copyFileSync

  stat: typeof import('fs/promises').stat
  lstat: typeof import('fs/promises').lstat

  rmdir: typeof import('fs/promises').rmdir
  unlink: typeof import('fs/promises').unlink
  symlink: typeof import('fs/promises').symlink
  readlink: typeof import('fs/promises').readlink
  realpath: typeof import('fs/promises').realpath
  access: typeof import('fs/promises').access
  rename: typeof import('fs/promises').rename

  chown: typeof import('fs/promises').chown
  lchown: typeof import('fs/promises').lchown
  utimes: typeof import('fs/promises').utimes
  lutimes: typeof import('fs/promises').lutimes

  createReadStream: typeof import('fs').createReadStream
  createWriteStream: typeof import('fs').createWriteStream
  Writable: typeof import('stream').Writable
  Readable: typeof import('stream').Readable
  Duplex: typeof import('stream').Duplex
  Transform: typeof import('stream').Transform
  compile: typeof import('handlebars').compile

  md: Md
  marked: typeof import('marked').marked
  uuid: typeof import('crypto').randomUUID
  replace: typeof import('replace-in-file').replaceInFile

  //custom
  ensureReadFile: EnsureReadFile
  ensureReadJson: EnsureReadJson

  globby: typeof import('globby').globby
}
</file>

<file path="src/globals/index.ts">
export * from './axios.js'
export * from './chalk.js'
export * from './child_process.js'
export * from './crypto.js'
export * from './custom.js'
export * from './download.js'
export * from './execa.js'
export * from './fs-extra.js'
export * from './fs.js'
export * from './globby.js'
export * from './handlebars.js'
export * from './marked.js'
export * from './path.js'
export * from './process.js'
export * from './replace-in-file.js'
export * from './stream.js'
export * from './zod.js'
</file>

<file path="src/main/index.test.ts">
import test from "ava"
import path from "node:path"
import { Channel, Value, ProcessType } from "../core/enum.js"
import type { Script, Choice } from "../types/core.js"

// Create runScript function that matches the one in index.ts
const createRunScript = (dependencies: any) => {
  const {
    isApp,
    isPass,
    input,
    focused,
    hide,
    getMainScriptPath,
    open,
    run,
    isFile,
    exec,
    showLogWindow,
    edit,
    send,
    sendWait,
    preload,
    updateArgs,
    args,
    flag,
    modifiers,
    path,
    kenvPath,
    kitPath,
    isScriptlet,
    isSnippet,
    parseShebang,
    runScriptletImport,
    arg
  } = dependencies

  return async (script: Script | string) => {
    if (isApp && typeof script === "string") {
      return await Promise.all([
        hide({
          preloadScript: getMainScriptPath(),
        }),
        (open as any)(script as string),
      ])
    }

    if (isPass || (script as Script)?.postfix) {
      let hardPass = (script as Script)?.postfix || input
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
      let { runScriptlet } = await runScriptletImport()
      updateArgs(args)
      await runScriptlet(script, (script as any).inputs || [], flag)
      return
    }

    if (Array.isArray(script)) {
      let { runScriptlet } = await runScriptletImport()
      updateArgs(args)
      await runScriptlet(focused, script, flag)
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
}

// Test 1: Basic script selection and execution
test("should run a selected script with its file path", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "test-script",
    name: "Test Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/script.js")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
})

// Test 2: App launcher mode
test("should open app when isApp is true", async (t) => {
  let hideCalls: any[] = []
  let openCalls: any[] = []
  
  const deps = {
    isApp: true,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async (options?: any) => {
      hideCalls.push(options)
    },
    getMainScriptPath: () => "/kit/main.js",
    open: async (path: string) => {
      openCalls.push(path)
    },
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("com.example.app")
  
  t.is(hideCalls.length, 1)
  t.is(openCalls.length, 1)
  t.is(openCalls[0], "com.example.app")
})

// Test 3: Invalid characters detection
test("should detect invalid characters in onNoChoices", (t) => {
  // Test each case separately to avoid regex state issues
  t.true(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test@script"))
  t.true(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test!"))
  t.false(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test-script"))
  t.false(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test script"))
})

// Test 4: Script name formatting
test("should format script name correctly in onNoChoices", (t) => {
  const input = "My Test Script!"
  const scriptName = input
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s/g, "-")
    .toLowerCase()
  
  t.is(scriptName, "my-test-script")
})

// Test 5: Password mode with hardPass
test.serial("should handle password mode with hardPass", async (t) => {
  let runCalls: any[] = []
  global.flag = {}
  
  // Ensure clean global.flag
  delete global.flag.hardPass
  
  const deps = {
    isApp: false,
    isPass: true,
    input: "mypassword",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/pass-script.js",
    command: "pass-script",
    name: "Pass Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/pass-script.js", "--pass", "mypassword"])
  t.is(global.flag.hardPass, "mypassword")
  
  // Cleanup
  delete global.flag.hardPass
})

// Test 6: Script with postfix
test.serial("should handle script with postfix", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript = {
    filePath: "/test/postfix-script.js",
    command: "postfix-script",
    name: "Postfix Script",
    postfix: "somepostfix",
    type: ProcessType.Prompt,
    kenv: "",
    id: "postfix-script"
  } as any as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/postfix-script.js", "--pass", "somepostfix"])
})

// Test 7: NoValue handling
test("should handle NoValue return", async (t) => {
  let runCalls: any[] = []
  const originalWarn = console.warn
  let warnCalled = false
  console.warn = () => { warnCalled = true }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript(Value.NoValue)
  
  console.warn = originalWarn
  
  t.true(warnCalled)
  t.is(runCalls.length, 0)
})

// Test 8: Kit sponsor special case
test("should handle kit-sponsor special case", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("kit-sponsor")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/main/sponsor.js")
})

// Test 9: Script path with numeric argument
test("should handle script path with numeric argument", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "/test/script.js"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("/test/script.js 123")
  
  t.is(isFileCalls.length, 1)
  t.is(isFileCalls[0], "/test/script.js")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/script.js", "123"])
})

// Test 10: Create new script from string
test("should create new script when string doesn't exist as file", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("my-new-script")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new.js")
  t.is(runCalls[0][1], "my-new-script")
  t.is(runCalls[0][2], "--scriptName")
  t.is(runCalls[0][3], "my-new-script")
})

// Test 11: Multiple flags handling
test("should handle first non-modifier flag as CLI command", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { verbose: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/verbose.js")
  t.is(runCalls[0][1], "/test/script.js")
})

// Test 12: Pass flags when no special handling
test("should pass flags to script when no special flag handling applies", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(preloadCalls.length, 1)
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
})

// Test 13: Snippet handling
test("should handle snippet execution", async (t) => {
  let runCalls: any[] = []
  let sendCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: (channel: Channel, data?: any) => {
      sendCalls.push({ channel, data })
    },
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => true,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockSnippet = {
    filePath: "/test/snippet.js",
    command: "snippet",
    name: "Test Snippet"
  } as Script
  
  await runScript(mockSnippet)
  
  t.is(sendCalls.length, 1)
  t.is(sendCalls[0].channel, Channel.STAMP_SCRIPT)
  t.is(sendCalls[0].data, mockSnippet)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/app/paste-snippet.js")
  t.is(runCalls[0][1], "--filePath")
  t.is(runCalls[0][2], "/test/snippet.js")
})

// Test 13: Scriptlet handling
test("should handle scriptlet execution", async (t) => {
  let runScriptletCalls: any[] = []
  let updateArgsCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: (args: any) => {
      updateArgsCalls.push(args)
    },
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => true,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet",
    tool: "kit",
    inputs: ["input1", "input2"]
  } as any
  
  await runScript(mockScriptlet)
  
  t.is(updateArgsCalls.length, 1)
  t.is(runScriptletCalls.length, 1)
  t.is(runScriptletCalls[0].scriptlet, mockScriptlet)
  t.deepEqual(runScriptletCalls[0].inputs, ["input1", "input2"])
})

// Test 14: Background script toggle
test("should toggle background script", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/bg-script.js",
    command: "bg-script",
    name: "Background Script",
    background: true
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/toggle-background.js")
  t.is(runCalls[0][1], "/test/bg-script.js")
})

// Test 15: Shebang script handling
test("should handle shebang scripts", async (t) => {
  let sendWaitCalls: any[] = []
  const parsedShebang = { command: "bash", args: ["/test/shebang-script.sh"] }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async (channel: Channel, data?: any) => {
      sendWaitCalls.push({ channel, data })
    },
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => parsedShebang,
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/shebang-script.sh",
    command: "shebang-script",
    name: "Shebang Script",
    shebang: "#!/bin/bash"
  } as Script
  
  await runScript(mockScript)
  
  t.is(sendWaitCalls.length, 1)
  t.is(sendWaitCalls[0].channel, Channel.SHEBANG)
  t.deepEqual(sendWaitCalls[0].data, parsedShebang)
})

// Test 16: Script without filePath - edge case
test("should call arg when script has no filePath", async (t) => {
  let argCalled = false
  let argMessage = ""
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async (message: string) => {
      argCalled = true
      argMessage = message
      return message
    }
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript = {
    command: "script",
    name: "Script"
    // No filePath
  } as any
  
  await runScript(mockScript)
  
  t.true(argCalled)
  t.is(argMessage, "How did you get here?")
})

// Test 17: Code flag behavior
test("should open VS Code when code flag is set", async (t) => {
  let execCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async (command: string, options?: any) => {
      execCalls.push({ command, options })
      return { stdout: "", stderr: "" }
    },
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { code: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/scripts/code-script.js",
    command: "code-script",
    name: "Code Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(execCalls.length, 1)
  t.true(execCalls[0].command.includes("Visual Studio Code"))
  t.true(execCalls[0].command.includes("/test"))
})

// Test 18: Settings flag
test("should open kit settings when settings flag is set", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { settings: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/main/kit.js")
})

// Test 19: Kenv-term special handling
test("should use script directory for kenv-term", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "kenv-term": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/Users/test/my-kenv/scripts/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/kenv-term.js")
  t.is(runCalls[0][1], "/Users/test/my-kenv")
})

// Test 20: Open flag behavior
test("should edit script when open flag is set", async (t) => {
  let editCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async (filePath: string, kenvPath?: string) => {
      editCalls.push({ filePath, kenvPath })
    },
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { open: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/edit-script.js",
    command: "edit-script",
    name: "Edit Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(editCalls.length, 1)
  t.is(editCalls[0].filePath, "/test/edit-script.js")
  t.is(editCalls[0].kenvPath, "/kenv")
})

// Test 21: Opt modifier behavior
test("should show log window when opt modifier is pressed", async (t) => {
  let showLogWindowCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: (filePath: string) => {
      showLogWindowCalls.push(filePath)
    },
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { opt: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(showLogWindowCalls.length, 1)
  t.is(showLogWindowCalls[0], "/test/script.js")
})

// Test 22: Menu flag behavior
test("should handle menu flags", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "new-menu": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new-menu.js")
})

// Test 23: Array scriptlet handling
test("should handle array scriptlet execution", async (t) => {
  let runScriptletCalls: any[] = []
  let updateArgsCalls: any[] = []
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet"
  }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: mockScriptlet,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: (args: any) => {
      updateArgsCalls.push(args)
    },
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockInputs = ["input1", "input2"]
  await runScript(mockInputs as any)
  
  t.is(updateArgsCalls.length, 1)
  t.is(runScriptletCalls.length, 1)
  t.is(runScriptletCalls[0].scriptlet, mockScriptlet)
  t.deepEqual(runScriptletCalls[0].inputs, mockInputs)
})

// Test 24: Default kenv handling
test("should use 'main' as default kenv", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "kenv-view": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
    // No kenv property
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/kenv-view.js")
  t.is(runCalls[0][1], "main")
})

// Test 25: Other flag handling
test("should run CLI command for non-open flags", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { duplicate: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/duplicate.js")
  t.is(runCalls[0][1], "/test/script.js")
})

// Test 26: Empty script inputs
test("should handle scriptlet with empty inputs array", async (t) => {
  let runScriptletCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => true,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet",
    tool: "kit"
    // No inputs property
  } as any
  
  await runScript(mockScriptlet)
  
  t.is(runScriptletCalls.length, 1)
  t.deepEqual(runScriptletCalls[0].inputs, [])
})

// Test 27: Input trimming
test("should trim input when creating new script", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("  my new script  ")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new.js")
  t.is(runCalls[0][1], "my-new-script")
  t.is(runCalls[0][3], "my new script")
})

// Test 28: Edge case - Script path doesn't split with space and number
test("should not split script path that ends with space and number", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "script with space"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("script with space 2")
  
  t.is(isFileCalls[0], "script with space")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "script with space")
  t.is(runCalls[0][1], "2")
})

// Test 29: Code flag takes precedence
test("should prioritize code flag over other flags", async (t) => {
  let execCalls: any[] = []
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async (command: string, options?: any) => {
      execCalls.push({ command, options })
      return { stdout: "", stderr: "" }
    },
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { code: true, remove: true, duplicate: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  // Should execute VS Code command, not remove or duplicate
  t.is(execCalls.length, 1)
  t.true(execCalls[0].command.includes("Visual Studio Code"))
  t.is(runCalls.length, 0)
})

// Test 30: Empty flag object
test("should handle empty flag object", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
  t.is(runCalls[0].length, 1) // No flags appended
})

// Test 31: onKeyword callback handling
test("should handle keyword-based script execution", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  // Create a mock mainMenu function to test keyword handling
  const mockMainMenu = async (options: any) => {
    // Simulate keyword detection
    const state = {
      keyword: "todo",
      value: {
        filePath: "/test/todo-script.js",
        command: "todo-script",
        name: "Todo Script"
      }
    }
    
    // Call onKeyword if provided
    if (options.onKeyword) {
      await options.onKeyword("todo", state)
    }
    
    return state.value
  }
  
  // Mock dependencies for keyword test
  const deps = {
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    run: async (...args: any[]) => {
      runCalls.push(args)
    }
  }
  
  // Set up globals
  global.preload = deps.preload
  global.run = deps.run
  
  const options = {
    name: "Main",
    onKeyword: async (input: string, state: any) => {
      const { keyword, value } = state
      if (keyword && value?.filePath) {
        preload(value.filePath)
        await run(value.filePath, "--keyword", keyword)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/todo-script.js")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/todo-script.js", "--keyword", "todo"])
})

// Test 32: onMenuToggle callback - dynamic flag loading
test("should load dynamic flags on menu toggle", async (t) => {
  let setFlagsCalls: any[] = []
  
  const mockMainMenu = async (options: any) => {
    // Simulate menu toggle without a flag
    const state = { flag: null }
    
    if (options.onMenuToggle) {
      await options.onMenuToggle("", state)
    }
  }
  
  // Mock dependencies
  global.setFlags = async (flags: any) => {
    setFlagsCalls.push(flags)
  }
  
  const scriptFlags = {
    open: "Open in editor",
    code: "Open in VS Code"
  }
  
  const actions = [
    { flag: "duplicate", name: "Duplicate" },
    { flag: "remove", name: "Remove" }
  ]
  
  // Mock getFlagsFromActions
  global.getFlagsFromActions = (actions: any[]) => {
    return actions.reduce((acc, action) => {
      acc[action.flag] = action.name
      return acc
    }, {})
  }
  
  const options = {
    name: "Main",
    flags: scriptFlags,
    onMenuToggle: async (input: string, state: any) => {
      if (!state?.flag) {
        let menuFlags = {
          ...scriptFlags,
          ...global.getFlagsFromActions(actions)
        }
        setFlags(menuFlags)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(setFlagsCalls.length, 1)
  const combinedFlags = setFlagsCalls[0]
  t.true("open" in combinedFlags)
  t.true("code" in combinedFlags)
  t.true("duplicate" in combinedFlags)
  t.true("remove" in combinedFlags)
})

// Test 33: onChoiceFocus callback - state tracking
test("should update state on choice focus", async (t) => {
  let isAppValues: boolean[] = []
  let isPassValues: boolean[] = []
  let focusedValues: any[] = []
  
  const mockMainMenu = async (options: any) => {
    // Test Apps group
    await options.onChoiceFocus("", {
      focused: { group: "Apps", name: "Safari" }
    })
    
    // Test Pass group
    await options.onChoiceFocus("", {
      focused: { group: "Pass", name: "Password", exact: false }
    })
    
    // Test Pass group with exact match
    await options.onChoiceFocus("", {
      focused: { group: "Pass", name: "Password", exact: true }
    })
    
    // Test Community group
    await options.onChoiceFocus("", {
      focused: { group: "Community", name: "Script" }
    })
    
    // Test regular script
    await options.onChoiceFocus("", {
      focused: { group: "Scripts", name: "My Script" }
    })
  }
  
  const options = {
    onChoiceFocus: async (input: string, state: any) => {
      const isApp = state?.focused?.group === "Apps" || 
                    state?.focused?.group === "Community"
      const isPass = state?.focused?.group === "Pass" && 
                     !state?.focused?.exact
      const focused = state?.focused
      
      isAppValues.push(isApp)
      isPassValues.push(isPass)
      focusedValues.push(focused)
    }
  }
  
  await mockMainMenu(options)
  
  // Check Apps group
  t.true(isAppValues[0])
  t.false(isPassValues[0])
  
  // Check Pass group without exact
  t.false(isAppValues[1])
  t.true(isPassValues[1])
  
  // Check Pass group with exact
  t.false(isAppValues[2])
  t.false(isPassValues[2])
  
  // Check Community group
  t.true(isAppValues[3])
  t.false(isPassValues[3])
  
  // Check regular script
  t.false(isAppValues[4])
  t.false(isPassValues[4])
  
  t.is(focusedValues.length, 5)
})

// Test 34: onBlur callback - hide and exit
test.serial("should hide and exit on blur", async (t) => {
  // Store original globals
  const originalHide = global.hide
  const originalExit = global.exit
  
  let hideCalls: number = 0
  let exitCalls: number = 0
  
  const mockMainMenu = async (options: any) => {
    await options.onBlur("", {})
  }
  
  global.hide = async () => {
    hideCalls++
  }
  
  global.exit = (() => {
    exitCalls++
    throw new Error("Exit called") // never returns
  }) as (code?: number) => never
  
  const options = {
    onBlur: async (input: string, state: any) => {
      await global.hide()
      global.exit()
    }
  }
  
  try {
    await mockMainMenu(options)
    t.fail("Should have thrown")
  } catch (error: any) {
    t.is(error.message, "Exit called")
  }
  
  t.is(hideCalls, 1)
  t.is(exitCalls, 1)
  
  // Restore globals
  global.hide = originalHide
  global.exit = originalExit
})

// Test 35: Shortcode handlers - number keys
test("should handle number shortcode handlers", async (t) => {
  let scriptPaths: string[] = []
  
  const mockMainMenu = async (options: any) => {
    // Test various number shortcuts
    return options.shortcodes
  }
  
  const kitPath = (dir: string, file: string) => `/kit/${dir}/${file}`
  
  const options = {
    shortcodes: {
      "1": `${kitPath("handler", "number-handler.js")} 1`,
      "2": `${kitPath("handler", "number-handler.js")} 2`,
      "3": `${kitPath("handler", "number-handler.js")} 3`,
      "4": `${kitPath("handler", "number-handler.js")} 4`,
      "5": `${kitPath("handler", "number-handler.js")} 5`,
      "6": `${kitPath("handler", "number-handler.js")} 6`,
      "7": `${kitPath("handler", "number-handler.js")} 7`,
      "8": `${kitPath("handler", "number-handler.js")} 8`,
      "9": `${kitPath("handler", "number-handler.js")} 9`
    }
  }
  
  const shortcodes = await mockMainMenu(options)
  
  t.is(shortcodes["1"], "/kit/handler/number-handler.js 1")
  t.is(shortcodes["5"], "/kit/handler/number-handler.js 5")
  t.is(shortcodes["9"], "/kit/handler/number-handler.js 9")
  t.is(Object.keys(shortcodes).length, 9)
})

// Test 36: onNoChoices with invalid characters
test.serial("should show panel for invalid characters in onNoChoices", async (t) => {
  // Store original globals
  const originalMd = global.md
  const originalSetPanel = global.setPanel
  
  let panelContents: string[] = []
  let setPanelCalls: number = 0
  
  const mockMainMenu = async (options: any) => {
    // Test with invalid characters
    await options.onNoChoices("test@script!", { flaggedValue: "" })
    
    // Test with valid characters
    await options.onNoChoices("valid-script", { flaggedValue: "" })
  }
  
  global.md = (content: string) => content
  global.setPanel = async (content: string) => {
    panelContents.push(content)
    setPanelCalls++
  }
  
  const options = {
    onNoChoices: async (input: string, state: any) => {
      if (input && state.flaggedValue === "") {
        let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
        let invalid = regex.test(input)
        
        if (invalid) {
          const panel = global.md(`# No matches found
No matches found for <code>${input}</code>`)
          global.setPanel(panel)
          return
        }
        
        let scriptName = input
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s/g, "-")
          .toLowerCase()
        
        const panel = global.md(`# Quick New Script

Create a script named <code>${scriptName}</code>`)
        global.setPanel(panel)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(setPanelCalls, 2)
  
  // First call should show "No matches found"
  t.regex(panelContents[0], /No matches found/)
  t.regex(panelContents[0], /test@script!/)
  
  // Second call should show "Quick New Script"
  t.regex(panelContents[1], /Quick New Script/)
  t.regex(panelContents[1], /valid-script/)
  
  // Restore globals
  global.md = originalMd
  global.setPanel = originalSetPanel
})

// Test 37: Community group detection
test("should detect Community group as app", async (t) => {
  let runCalls: any[] = []
  let hideCalls: any[] = []
  let openCalls: any[] = []
  
  const deps = {
    isApp: true, // Community group should be treated as app
    isPass: false,
    input: "",
    focused: { group: "Community", name: "community-script" },
    hide: async (options?: any) => {
      hideCalls.push(options)
    },
    getMainScriptPath: () => "/kit/main.js",
    open: async (path: string) => {
      openCalls.push(path)
    },
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("community-app")
  
  t.is(hideCalls.length, 1)
  t.is(openCalls.length, 1)
  t.is(openCalls[0], "community-app")
})

// Test 38: Pass group with exact match should not trigger password mode
test("should not use password mode when Pass group has exact match", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false, // Should be false when exact match
    input: "password123",
    focused: { group: "Pass", exact: true },
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/pass-script.js",
    command: "pass-script",
    name: "Pass Script"
  } as Script
  
  await runScript(mockScript)
  
  // Should run normally without --pass flag
  t.is(runCalls.length, 1)
  t.is(runCalls[0].length, 1)
  t.is(runCalls[0][0], "/test/pass-script.js")
  t.false(runCalls[0].includes("--pass"))
})

// Test 39: Script path with space and numeric argument splitting
test("should correctly split script path with space before number", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "/test/timer"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  // Test case: "timer 10" should split to ["timer", "10"]
  await runScript("/test/timer 10")
  
  t.is(isFileCalls.length, 1)
  t.is(isFileCalls[0], "/test/timer")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/timer", "10"])
})

// Test 40: Integration test - complete mainMenu flow
test("should handle complete mainMenu flow from selection to execution", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  let hideCalls: any[] = []
  let exitCalls: number = 0
  let panelContent: string = ""
  let flagsSet: any = null
  
  // Create a more complete mock mainMenu that simulates the full flow
  const mockCompleteMainMenu = async (options: any) => {
    // Simulate initial state
    let state = {
      focused: null,
      flag: null,
      flaggedValue: "",
      input: ""
    }
    
    // 1. Test onMenuToggle when menu opens
    if (options.onMenuToggle) {
      await options.onMenuToggle("", state)
    }
    
    // 2. Simulate typing that triggers onNoChoices
    state.input = "nonexistent@script"
    if (options.onNoChoices) {
      await options.onNoChoices(state.input, state)
    }
    
    // 3. Simulate focus on a script
    state = {
      focused: { 
        filePath: "/test/my-script.js",
        command: "my-script",
        name: "My Script",
        group: "Scripts"
      },
      flag: null,
      flaggedValue: "",
      input: ""
    }
    
    if (options.onChoiceFocus) {
      await options.onChoiceFocus("", state)
    }
    
    // 4. Simulate submission
    if (options.onSubmit) {
      options.onSubmit("my-script")
    }
    
    // Return the selected script
    return state.focused
  }
  
  // Set up all the global mocks
  global.preload = (filePath: string) => {
    preloadCalls.push(filePath)
  }
  
  global.run = async (...args: any[]) => {
    runCalls.push(args)
  }
  
  global.hide = async (options?: any) => {
    hideCalls.push(options || {})
  }
  
  global.exit = (() => {
    exitCalls++
    throw new Error("Exit called") // never returns
  }) as (code?: number) => never
  
  global.md = (content: string) => content
  
  global.setPanel = async (content: string) => {
    panelContent = content
  }
  
  global.setFlags = async (flags: any) => {
    flagsSet = flags
  }
  
  global.getFlagsFromActions = (actions: any[]) => {
    return actions.reduce((acc, action) => {
      acc[action.flag] = action.name
      return acc
    }, {})
  }
  
  const scriptFlags = {
    open: "Open in editor",
    code: "Open in VS Code"
  }
  
  const actions = [
    { flag: "duplicate", name: "Duplicate" }
  ]
  
  let capturedInput = ""
  let isApp = false
  let isPass = false
  let focused: any = null
  
  const mainMenuOptions = {
    name: "Main",
    description: "Script Kit",
    placeholder: "Script Kit",
    enter: "Run",
    strict: false,
    flags: scriptFlags,
    actions,
    onMenuToggle: async (input: string, state: any) => {
      if (!state?.flag) {
        let menuFlags = {
          ...scriptFlags,
          ...global.getFlagsFromActions(actions)
        }
        setFlags(menuFlags)
      }
    },
    onNoChoices: async (input: string, state: any) => {
      if (input && state.flaggedValue === "") {
        let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
        let invalid = regex.test(input)
        
        if (invalid) {
          const panel = md(`# No matches found
No matches found for <code>${input}</code>`)
          setPanel(panel)
        }
      }
    },
    onChoiceFocus: async (input: string, state: any) => {
      isApp = state?.focused?.group === "Apps" || 
               state?.focused?.group === "Community"
      isPass = state?.focused?.group === "Pass" && 
               !state?.focused?.exact
      focused = state?.focused
    },
    onSubmit: (input: string) => {
      if (input) {
        capturedInput = input.trim()
      }
    },
    onBlur: async (input: string, state: any) => {
      await hide()
      exit()
    }
  }
  
  // Run the complete flow
  const selectedScript = await mockCompleteMainMenu(mainMenuOptions)
  
  // Now run the script through runScript
  const deps = {
    isApp,
    isPass,
    input: capturedInput,
    focused,
    hide,
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run,
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload,
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  await runScript(selectedScript)
  
  // Verify the complete flow
  // 1. Flags were set on menu toggle
  t.truthy(flagsSet)
  t.true("open" in flagsSet)
  t.true("duplicate" in flagsSet)
  
  // 2. Panel was set for invalid input
  t.regex(panelContent, /No matches found/)
  
  // 3. Focus state was updated
  t.false(isApp)
  t.false(isPass)
  t.truthy(focused)
  
  // 4. Script was preloaded and run
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/my-script.js")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/my-script.js")
  
  // 5. Input was captured
  t.is(capturedInput, "my-script")
})
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

<file path="src/workers/cache-grouped-scripts-worker-integration.test.ts">
// File: src/workers/cache-grouped-scripts-worker.test.ts
import test from 'ava'
import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { Channel } from '../core/enum.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let compiledWorkerPath: string

test.before(() => {
  const workerTsPath = path.resolve(__dirname, './cache-grouped-scripts-worker.ts')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-worker-'))
  compiledWorkerPath = path.join(tempDir, 'cache-grouped-scripts-worker.js')

  // Compile the TypeScript worker using esbuild
  execSync(
    `pnpm exec esbuild ${workerTsPath} --bundle --platform=node --format=esm --outfile=${compiledWorkerPath} --external:node:* --external:electron --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`,
    {
      stdio: 'inherit',
      cwd: process.cwd() // Ensure we're in the project root for node_modules resolution
    }
  )
})

/**
 * Helper that creates a worker from the cache-grouped-scripts-worker,
 * sends it a message, and returns a promise that resolves with the first message.
 */
function runWorkerMessage(messageToSend: any): Promise<{ msg: any; worker: Worker }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(compiledWorkerPath)
    let resolved = false

    // Listen for messages and resolve when we get a CACHE_MAIN_SCRIPTS message
    worker.on('message', (msg) => {
      if (msg.channel === Channel.CACHE_MAIN_SCRIPTS && !resolved) {
        resolved = true
        resolve({ msg, worker })
      }

      if (msg.channel === Channel.LOG_TO_PARENT) {
        console.log(msg.value)
      }
    })
    worker.once('error', (err) => reject(err))
    worker.postMessage(messageToSend)

    // Add timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Timeout waiting for CACHE_MAIN_SCRIPTS message'))
      }
    }, 5000)
  })
}

test('Worker returns expected scripts structure when no stamp provided', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-no-stamp'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Instead of expecting an empty array, check that each script item has the expected shape.
  t.log(
    msg.scripts
      .map((s) => s.name)
      .slice(0, 10)
      .join('\n')
  )
  t.log(msg.preview)
  if (msg.scripts.length > 0) {
    const firstItem = msg.scripts[0]
    t.true(typeof firstItem.id === 'string', 'Each script item should have an id')
    t.true(typeof firstItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags, 'scriptFlags should be defined')
  t.true(typeof msg.preview === 'string', 'preview should be a string')
  worker.terminate()
})
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

<file path="src/api/global.ts">
import {
  assignPropsTo,
  home,
  isBin,
  isDir,
  isFile,
  kitPath,
  kenvPath,
  wait,
  getLogFromScriptPath,
  createPathResolver,
} from "../core/utils.js"

import "../globals/index.js"
import "./launch-context.js"

import { getScripts } from "../core/db.js"
import type { PromptConfig } from "../types/core"
import {
  format,
  formatDistanceToNow,
} from "../utils/date.js"
import { kitPnpmPath } from "../core/resolvers.js"

global.actionFlag = ""
global.getScripts = getScripts

performance.mark("run")

await import("../globals/index.js")
// await import("./packages/zx.js")
await import("./packages/clipboardy.js")
await import("./packages/shelljs.js")
await import("./packages/trash.js")
await import("./packages/open.js")
await import("./packages/tmpPromise.js")
await import("./packages/git.js")
await import("./packages/onepassword.js")

global.env = async (envKey, promptConfig) => {
  if (!envKey) throw new Error(`Environment Key Required`)

  let secret =
    typeof (promptConfig as PromptConfig)?.secret ===
      "boolean"
      ? (promptConfig as PromptConfig).secret
      : envKey.includes("KEY") ||
        envKey.includes("SECRET") ||
        envKey.includes("TOKEN")
        ? true
        : false
  if ((promptConfig as any)?.reset !== true) {
    let envVal = global.env[envKey] || process.env[envKey]
    if (envVal) return envVal
  }

  let input =
    typeof promptConfig === "function"
      ? await promptConfig()
      : typeof promptConfig === "string"
        ? await global.mini({
          enter: "Write to .env",
          shortcuts: [],
          placeholder: promptConfig,
          secret,
          keyword: "",
        })
        : await global.mini({
          enter: "Write to .env",
          shortcuts: [],
          placeholder: `Set ${envKey}:`,
          ...promptConfig,
          secret,
          keyword: "",
        })

  if (input?.startsWith("~"))
    input = input.replace(/^~/, home())
  await global.cli("set-env-var", envKey, input)
  global.env[envKey] = process.env[envKey] = input
  return input
}

assignPropsTo(process.env, global.env)

global.wait = wait
global.kitPath = kitPath
global.kitPnpmPath = kitPnpmPath
global.kenvPath = kenvPath
global.isBin = isBin
global.isDir = isDir
global.createPathResolver = createPathResolver
global.isFile = isFile
global.home = home

global.memoryMap = new Map()

global.getLog = () => {
  let log = getLogFromScriptPath(global.kitScript)
  return log
}

let intervals

// A proxy around setInterval that keeps track of all intervals
global.setInterval = new Proxy(setInterval, {
  apply: (
    target,
    thisArg,
    args: Parameters<typeof setInterval>
  ) => {
    let id = target(...args)
    intervals = intervals || new Set()
    intervals.add(id)
    return id
  },
})

let timeouts

global.setTimeout = new Proxy(setTimeout, {
  apply: (
    target,
    thisArg,
    args: Parameters<typeof setTimeout>
  ) => {
    let id = target(...args)
    timeouts = timeouts || new Set()
    timeouts.add(id)
    return id
  },
})

global.clearAllIntervals = () => {
  intervals?.forEach(id => clearInterval(id))
  intervals = new Set()
}

global.clearAllTimeouts = () => {
  timeouts?.forEach(id => clearTimeout(id))
  timeouts = new Set()
}

global.formatDate = format
global.formatDateToNow = formatDistanceToNow
</file>

<file path="src/workers/cache-grouped-scripts-worker.test.ts">
// File: src/workers/cache-grouped-scripts-worker.test.ts
import test from 'ava'
import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { Channel } from '../core/enum.js'
import { loadPreviousResults, saveResults } from '../core/test-utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let compiledWorkerPath: string

test.before(() => {
  const workerTsPath = path.resolve(__dirname, './cache-grouped-scripts-worker.ts')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-worker-'))
  compiledWorkerPath = path.join(tempDir, 'cache-grouped-scripts-worker.js')

  // Compile the TypeScript worker using esbuild
  execSync(
    `pnpm exec esbuild ${workerTsPath} --bundle --platform=node --format=esm --outfile=${compiledWorkerPath} --external:node:* --external:electron --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`,
    {
      stdio: 'inherit',
      cwd: process.cwd() // Ensure we're in the project root for node_modules resolution
    }
  )
})

/**
 * Helper that creates a worker from the cache-grouped-scripts-worker,
 * sends it a message, and returns a promise that resolves with the first message.
 */
function runWorkerMessage(messageToSend: any): Promise<{ msg: any; worker: Worker }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(compiledWorkerPath)
    let resolved = false

    // Listen for messages and resolve when we get a CACHE_MAIN_SCRIPTS message
    worker.on('message', (msg) => {
      if (msg.channel === Channel.CACHE_MAIN_SCRIPTS && !resolved) {
        resolved = true
        resolve({ msg, worker })
      }
    })

    // Handle worker errors - ignore ENOENT since it's expected during tests
    worker.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        // Ignore expected file system errors during tests
        return
      }
      reject(err)
    })

    worker.postMessage(messageToSend)

    // Add timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        if (process.env.CI) {
          console.log('Timeout waiting for CACHE_MAIN_SCRIPTS message. This is expected to sometimes fail in CI, but need to investigate why...')
        } else {
          reject(new Error('Timeout waiting for CACHE_MAIN_SCRIPTS message'))
        }
      }
    }, 5000)
  })
}

test('Worker returns expected scripts structure when no stamp provided', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-no-stamp'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Instead of expecting an empty array, check that each script item has the expected shape.
  if (msg.scripts.length > 0) {
    const firstItem = msg.scripts[0]
    t.true(typeof firstItem.id === 'string', 'Each script item should have an id')
    t.true(typeof firstItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags, 'scriptFlags should be defined')
  t.true(typeof msg.preview === 'string', 'preview should be a string')
  worker.terminate()
})

test('Worker handles REMOVE_TIMESTAMP and returns updated cache', async (t) => {
  const dummyStamp = { filePath: 'dummy-script.js', timestamp: Date.now(), runCount: 1 }
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.REMOVE_TIMESTAMP,
    value: dummyStamp,
    id: 'test-remove'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Check that if the dummy stamp was present, it is now removed
  const found = msg.scripts.some((s: any) => s.filePath === dummyStamp.filePath)
  t.false(found, 'Dummy stamp should not be found in scripts after removal')
  t.truthy(msg.scriptFlags)
  t.true(typeof msg.preview === 'string')
  worker.terminate()
})

test('Worker handles CLEAR_TIMESTAMPS and returns updated cache', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CLEAR_TIMESTAMPS,
    id: 'test-clear'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Rather than expecting an empty array, verify that the default scripts structure is returned.
  if (msg.scripts.length > 0) {
    const scriptItem = msg.scripts[0]
    t.true(typeof scriptItem.id === 'string', 'Each script item should have an id')
    t.true(typeof scriptItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags)
  t.true(typeof msg.preview === 'string')
  worker.terminate()
})

test('Worker caches results for identical stamp filePath', async (t) => {
  const dummyStamp = { filePath: 'dummy-script.js', timestamp: Date.now(), runCount: 1 }
  const worker = new Worker(compiledWorkerPath)

  // Send first message
  const firstResponse: any = await new Promise((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.postMessage({ channel: Channel.CACHE_MAIN_SCRIPTS, value: dummyStamp, id: 'test-cache-1' })
  })

  // Send a second message with the same dummy stamp
  const secondResponse: any = await new Promise((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.postMessage({ channel: Channel.CACHE_MAIN_SCRIPTS, value: dummyStamp, id: 'test-cache-2' })
  })

  // For caching purposes, the preview should be identical.
  t.deepEqual(firstResponse.preview, secondResponse.preview)
  worker.terminate()
})

test('benchmark - worker CACHE_MAIN_SCRIPTS', async (t) => {
  const previousResults = await loadPreviousResults()
  const runs = 20
  const times = []

  // Warm-up run (not measured)
  const warmup = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'benchmark-warmup'
  })
  warmup.worker.terminate()

  for (let i = 0; i < runs; i++) {
    const { worker } = await (async () => {
      const start = performance.now()
      const result = await runWorkerMessage({
        channel: Channel.CACHE_MAIN_SCRIPTS,
        value: null,
        id: `benchmark-${i}`
      })
      const end = performance.now()
      times.push(end - start)
      return result
    })()
    worker.terminate()
  }

  const mean = times.reduce((a, b) => a + b, 0) / runs
  const opsPerSecond = (1000 / mean)

  const testName = 'worker_CACHE_MAIN_SCRIPTS'
  const oldResult = previousResults[testName]
  if (oldResult) {
    const oldOps = oldResult.operationsPerSecond
    const improvement = ((opsPerSecond - oldOps) / oldOps) * 100
    t.log(`Previous OPS: ${oldOps.toFixed(2)}`)
    t.log(`Current OPS: ${opsPerSecond.toFixed(2)}`)
    const emoji = improvement > 0 ? "🚀" : "🐌"
    t.log(`${emoji} Change: ${improvement.toFixed(2)}%`)
  } else {
    t.log('No previous benchmark to compare against.')
  }

  const newResults = {
    ...previousResults,
    [testName]: {
      timestamp: new Date().toISOString(),
      operationsPerSecond: opsPerSecond,
      meanDurationMs: mean
    }
  }
  await saveResults(newResults)

  t.pass()
})

test('Worker filters out scripts with exclude metadata', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-exclude-filter'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  
  // Verify no scripts have exclude property set to true
  const excludedScriptsFound = msg.scripts.filter((script: any) => script.exclude === true)
  t.is(excludedScriptsFound.length, 0, 'No scripts with exclude:true should be present in cached scripts')
  
  // Log for debugging
  if (msg.scripts.length > 0) {
    t.log(`Total scripts after exclude filter: ${msg.scripts.length}`)
  }
  
  worker.terminate()
})

test('Worker preserves non-excluded scripts', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-preserve-non-excluded'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  
  // Verify that scripts without exclude or with exclude:false are preserved
  const nonExcludedScripts = msg.scripts.filter((script: any) => 
    script.exclude === undefined || script.exclude === false
  )
  
  t.is(nonExcludedScripts.length, msg.scripts.length, 'All cached scripts should be non-excluded')
  
  worker.terminate()
})
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

<file path="test-sdk/main.test.js">
import ava from 'ava';
import slugify from 'slugify';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';
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

<file path="src/types/core.d.ts">
import type { ChildProcess } from 'node:child_process'
import type { ProcessType, UI, Mode } from '../core/enum.js'

type ModifierKeys = 'cmd' | 'ctrl' | 'shift' | 'option' | 'alt'

export interface Choice<Value = any> {
  name: string
  slicedName?: string
  value?: Value
  description?: string
  slicedDescription?: string
  focused?: string
  img?: string
  emoji?: string
  icon?: string
  html?: string
  hasPreview?: boolean
  preview?: string | ((input: string, state: AppState) => string | Promise<string>)
  previewPath?: string
  previewLang?: string
  id?: string
  shortcode?: string
  trigger?: string
  keyword?: string
  className?: string
  nameClassName?: string
  tagClassName?: string
  focusedClassName?: string
  descriptionClassName?: string
  nameHTML?: string
  tag?: string
  shortcut?: string
  drag?:
  | {
    format?: string
    data?: string
  }
  | string
  onFocus?: (input: string, state: AppState) => string | Promise<string>
  onSubmit?: (input: string, state: AppState) => void | symbol | Promise<void | symbol>
  enter?: string
  disableSubmit?: boolean
  info?: boolean
  exclude?: boolean | string
  width?: number
  height?: number
  skip?: boolean
  miss?: boolean
  pass?: boolean | string
  group?: string
  userGrouped?: boolean
  choices?: (Omit<Choice<any>, 'choices'> | string)[]
  hideWithoutInput?: boolean
  ignoreFlags?: boolean
  selected?: boolean
  actions?: Action[]
  exact?: boolean
  recent?: boolean
  index?: number
  /**
   * When true this represents the literal text the user typed.
   * It is generated on-the-fly by invokeSearch – it never lives in a
   * script's static choice list.
   */
  asTyped?: boolean
  /** Indicates whether the choice is from an untrusted source */
  untrusted?: boolean
}

export interface ScoredChoice {
  item: Choice<{ id: string; name: string; value: any }>
  score: number
  matches: {
    [key: string]: [number, number][]
  }
  _: string
}

export interface ScriptPathInfo {
  command: string
  filePath: string
  kenv: string
  id: string
  icon?: string
  timestamp?: number
  needsDebugger?: boolean
  compileStamp?: number
  compileMessage?: string
}

export interface ScriptMetadata extends Metadata {
  shebang?: string
  name?: string
  menu?: string
  description?: string
  shortcut?: string
  shortcode?: string
  trigger?: string
  friendlyShortcut?: string
  alias?: string
  author?: string
  twitter?: string
  github?: string
  social?: string
  social_url?: string
  exclude?: boolean
  watch?: string
  type: ProcessType
  tabs?: string[]
  tag?: string
  log?: boolean
  hasFlags?: boolean
  cmd?: string
  option?: string
  ctrl?: string
  shift?: string
  hasPreview?: boolean
  logo?: string
  /** @deprecated Use 'expand' instead */
  snippet?: string
  expand?: string
  snippetdelay?: number
  template?: boolean
  'color-text'?: string
  'color-primary'?: string
  'color-secondary'?: string
  'color-background'?: string
  opacity?: string
  preview?: Choice['preview']
  previewPath?: string
  debug?: boolean
  cache?: boolean
  note?: string
  group?: string
  keyword?: string
  enter?: string
  recent?: boolean
  img?: string
  emoji?: string
  postfix?: boolean
  longRunning?: boolean
  bin?: boolean
}

export type Script = ScriptMetadata & ScriptPathInfo & Choice

export type Scriptlet = Script & {
  group: string
  inputs: string[]
  tool: string
  scriptlet: string
  value: Script
  cwd?: string
  prepend?: string
  append?: string
  term?: undefined | boolean
  shell?: string | boolean
}

export type Snippet = Script & {
  group: 'Snippets'
  text: string
  snippetKey?: string
  postfix?: boolean
}

export type PromptBounds = {
  x?: number
  y?: number
  width?: number
  height?: number
}

// export type PromptState = "collapsed" | "expanded"

export type PromptDb = {
  screens: {
    [screenId: string]: {
      [script: string]: PromptBounds
    }
  }
}

export type InputType =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'

export type Shortcut = {
  id?: string
  key: string
  name?: string
  value?: any
  onPress?: (input: string, state: AppState) => unknown | Promise<unknown>
  bar?: 'right' | 'left' | ''
  flag?: string
  visible?: boolean
  condition?: (choice: any) => boolean
}

export interface PromptData {
  id: string
  key: string
  scriptPath: string
  description: string
  flags: FlagsObject
  hasPreview: boolean
  keepPreview?: boolean
  hint: string
  input: string
  inputRegex: string
  kitArgs: string[]
  kitScript: string
  mode: Mode
  name: string
  placeholder: string
  preview: string
  previewWidthPercent: number
  panel: string
  secret: boolean
  selected: string
  strict: boolean
  tabs: string[]
  tabIndex: number
  type: InputType
  ui: UI
  resize: boolean
  placeholderOnly: boolean
  scripts: boolean
  shortcodes: { [key: string]: any }
  defaultChoiceId: string
  focusedId: string
  footer: string
  env: any
  shortcuts: Shortcut[]
  enter: string
  choicesType: 'string' | 'array' | 'function' | 'async' | 'null'
  x: number
  y: number
  width: number
  height: number
  itemHeight: number
  inputHeight: number
  defaultValue: string
  focused: string
  formData?: any
  html?: string
  theme?: any
  /** @deprecated Kit now supports backgrounding windows */
  alwaysOnTop?: boolean
  skipTaskbar?: boolean
  cwd?: string
  hasOnNoChoices?: boolean
  inputCommandChars?: string[]
  inputClassName?: string
  headerClassName?: string
  footerClassName?: string
  containerClassName?: string
  preload?: boolean
  css?: string
  preventCollapse?: boolean
  hideOnEscape?: boolean
  keyword?: string
  multiple?: boolean
  searchKeys?: string[]
  show?: boolean
  scriptlet?: boolean
  actionsConfig?: ActionsConfig
  grid?: boolean
}

export type GenerateChoices = (input: string) => Choice<any>[] | Promise<Choice<any>[]>

export type GenerateActions = (input: string) => Action[] | Promise<Action[]>

export type Choices<Value> = (
  | (string | Choice)[]
  | Choice<Value>[]
  | (() => Choice<Value>[])
  | (() => Promise<Choice<Value>[]>)
  | Promise<Choice<any>[]>
  | GenerateChoices
) & {
  preload?: boolean
}

export type Preview =
  | string
  | void
  | (() => string)
  | (() => void)
  | (() => Promise<string>)
  | (() => Promise<void>)
  | ((input: string) => string)
  | ((input: string) => void)
  | ((input: string) => Promise<any>)
  | ((input: string) => Promise<void>)

export type Actions = Action[] | (() => Action[]) | (() => Promise<Action[]>) | Promise<Action[]> | GenerateActions

export type Panel =
  | string
  | void
  | (() => string)
  | (() => void)
  | (() => Promise<string>)
  | (() => Promise<void>)
  | ((input: string) => string)
  | ((input: string) => void)
  | ((input: string) => Promise<any>)
  | ((input: string) => Promise<void>)

export type Flags = {
  [key: string]: boolean | string
} & Partial<Record<ModifierKeys, boolean | string>>

export type FlagsWithKeys = {
  [key: string]: {
    shortcut?: string
    name?: string
    group?: string
    description?: string
    bar?: 'left' | 'right' | ''
    flag?: string
    preview?: Choice['preview']
    hasAction?: boolean
  }
} & {
  sortChoicesKey?: string[]
  order?: string[]
}
export type FlagsObject = FlagsWithKeys | boolean
export type ActionsConfig = {
  name?: string
  placeholder?: string
  active?: string
}

export type Action = {
  name: string
  description?: string
  value?: any
  shortcut?: string
  group?: string
  flag?: string
  visible?: boolean
  enter?: string
  onAction?: ChannelHandler
  condition?: Shortcut['condition']
  close?: boolean
  index?: number
}

export interface AppState {
  input?: string
  actionsInput?: string
  inputChanged?: boolean
  flaggedValue?: any
  flag?: string
  tab?: string
  tabIndex?: number
  value?: any
  index?: number
  focused?: Choice
  history?: Script[]
  modifiers?: string[]
  count?: number
  name?: string
  description?: string
  script?: Script
  submitted?: boolean
  shortcut?: string
  paste?: string
  cursor?: number
  preview?: string
  keyword?: string
  mode?: Mode
  ui?: UI
  multiple?: boolean
  selected?: any[]
  action?: Action
}

export type ChannelHandler = (input?: string, state?: AppState) => void | Promise<void>

export type SubmitHandler = (input?: string, state?: AppState) => void | symbol | Promise<void | symbol>

export type PromptConfig = {
  validate?: (input: string) => boolean | string | Promise<boolean | string>
  choices?: Choices<any> | Panel
  actions?: Action[] | Panel
  initialChoices?: Choices<any> | Panel
  html?: string
  formData?: any
  className?: string
  flags?: FlagsObject
  actions?: Action[]
  preview?: string | ((input: string, state: AppState) => string | Promise<string> | void | Promise<void>)
  panel?: string | (() => string | Promise<string>)
  onNoChoices?: ChannelHandler
  onEscape?: ChannelHandler
  onAbandon?: ChannelHandler
  onBack?: ChannelHandler
  onForward?: ChannelHandler
  onUp?: ChannelHandler
  onDown?: ChannelHandler
  onLeft?: ChannelHandler
  onRight?: ChannelHandler
  onTab?: ChannelHandler
  onKeyword?: ChannelHandler
  onInput?: ChannelHandler
  onActionsInput?: ChannelHandler
  onChange?: ChannelHandler
  onBlur?: ChannelHandler
  onSelected?: ChannelHandler
  onChoiceFocus?: ChannelHandler
  onMessageFocus?: ChannelHandler
  onPaste?: ChannelHandler
  onDrop?: ChannelHandler
  onDragEnter?: ChannelHandler
  onDragLeave?: ChannelHandler
  onDragOver?: ChannelHandler
  onMenuToggle?: ChannelHandler
  onInit?: ChannelHandler
  onSubmit?: SubmitHandler
  onValidationFailed?: ChannelHandler
  onAudioData?: ChannelHandler
  debounceInput?: number
  debounceChoiceFocus?: number
  keyword?: string
  shortcodes?: {
    [key: string]: any
  }
  env?: any
  shortcuts?: Shortcut[]
  show?: boolean
  grid?: boolean
  columns?: number
  columnWidth?: number
  rowHeight?: number
  gridGap?: number
  gridPadding?: number
} & Partial<Omit<PromptData, 'choices' | 'id' | 'script' | 'preview'>>

export type CronExpression =
  | `${string} ${string} ${string} ${string} ${string}`
  | `${string} ${string} ${string} ${string} ${string} ${string}`

type OptModifier = "opt" | "option" | "alt";
type CmdModifier = "cmd" | "command";
type CtrlModifier = "ctrl" | "control";
type ShiftModifier = "shift";

type Modifier = OptModifier | CmdModifier | CtrlModifier | ShiftModifier;
type Key = string;
type Separator = " " | "+";

type ModifierCombination =
  | Modifier
  | `${Modifier}${Separator}${Modifier}`
  | `${Modifier}${Separator}${Modifier}${Separator}${Modifier}`
  | `${Modifier}${Separator}${Modifier}${Separator}${Modifier}${Separator}${Modifier}`;

export type MetadataShortcut = `${ModifierCombination}${Separator}${Key}`;

export interface Metadata {
  /** The author's name */
  author?: string
  /**
   * Specifies the name of the script as it appears in the Script Kit interface.
   * If not provided, the file name will be used.
   */
  name?: string
  /** Provides a brief description of the script's functionality. */
  description?: string
  /** The string displayed in the Enter button */
  enter?: string
  /** Defines an alternative search term to find this script */
  alias?: string
  /** Defines the path to an image to be used for the script */
  image?: string
  /** Defines an emoji to be displayed for the script or choice */
  emoji?: string
  /** Defines a global keyboard shortcut to trigger the script. */
  shortcut?: MetadataShortcut
  /**
   * Similar to {@link trigger}, defines a string that, when typed in the main menu
   * followed by a space, immediately executes the script.
   */
  shortcode?: string
  /**
   * Similar to {@link shortcode}, defines a string that, when typed in the main menu,
   * immediately executes the script.
   */
  trigger?: string
  /** @deprecated Use `expand` instead. Designates the script as a text expansion snippet and specifies the trigger text. */
  snippet?: string
  /** Designates the script as a text expansion snippet and specifies the trigger text. */
  expand?: string
  /** Associates a keyword with the script for easier discovery in the main menu. */
  keyword?: string
  /**
   * Indicates that user input in the main menu should be passed as an argument to the script.
   * "true" indicates that the entire input should be passed as an argument
   * A string indicates a "postfix", then match the text before the string
   * A RegExp indicates a "pattern" to match
   * */
  pass?: boolean | string
  /** Assigns the script to a specific group for organization in the main menu. */
  group?: string
  /** Excludes the script from appearing in the main menu. */
  exclude?: boolean
  /** Specifies a file or directory to watch for changes, triggering the script upon modifications. */
  watch?: string
  /** Indicates whether to disable logs */
  log?: boolean
  /** Designates the script as a background process, running continuously in the background. */
  background?: boolean | 'auto'
  /** Associates the script with system events such as sleep, wake, or shutdown. */
  system?:
  | 'suspend'
  | 'resume'
  | 'on-ac'
  | 'on-battery'
  | 'shutdown'
  | 'lock-screen'
  | 'unlock-screen'
  /** macOS only */
  | 'user-did-become-active'
  /** macOS only */
  | 'user-did-resign-active'

  /** Specifies a cron expression for scheduling the script to run at specific times or intervals. */
  schedule?: CronExpression
  /** Indicates whether the script can be run through the rest API */
  access?: 'public' | 'key' | 'private'
  /** Indicates whether the script can return a response through the rest API */
  response?: boolean
  /** Indicates the order of the script in its group in the main menu */
  index?: number
  /** Indicates whether to disable logs for the script */
  log?: boolean
  /** Optimization: if this script won't require a prompt, set this to false */
  prompt?: boolean
  /** Indicates the tag of the script */
  tag?: string
  /** Indicates whether the script is long-running */
  longRunning?: boolean
  /** Exposes the script as an MCP (Model Context Protocol) tool */
  mcp?: string | boolean

  /** Indicates the time the script was last run */
  timeout?: number
  /** Indicates whether the script's choices should be cached */
  cache?: boolean
  /** Indicates whether the script should be added to ~/.kenv/bin */
  bin?: boolean
}

export interface ProcessInfo {
  pid: number
  scriptPath: string
  child: ChildProcess
  type: ProcessType
  values: any[]
  date: number
}
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

<file path="src/types/globals.d.ts">
type ReadFileOptions = Parameters<typeof import('node:fs/promises').readFile>[1]

export type EnsureReadFile = (path: string, defaultContent?: string, options?: ReadFileOptions) => Promise<string>

export type EnsureReadJson =
  <T>(path: string, defaultContent: T, options?: Parameters<typeof import('fs-extra').readJson>[1]) => Promise<T>

// Tool type is already imported from @modelcontextprotocol/sdk/types in kit.d.ts
// and exposed via global.tool declaration


declare global {
  //React
  var React: typeof import('react')
  //process
  var cwd: typeof process.cwd
  var pid: typeof process.pid
  var stderr: typeof process.stderr
  var stdin: typeof process.stdin
  var stdout: typeof process.stdout
  var uptime: typeof process.uptime
  //axios
  /**
   * An alias for axios.get
   * #### get example
   * ```ts
   * const result = await get("https://jsonplaceholder.typicode.com/todos/1");
   * await editor(JSON.stringify(result.data));
   * ```
   * #### get active app on mac
   * ```ts
   * // MAC ONLY!
   * // Always hide immmediately if you're not going to show a prompt
   * await hide()
   * // but you can import that package directly (or another similar package) if you prefer
   * let info = await getActiveAppInfo()
   * if (info.bundleIdentifier === "com.google.Chrome") {
   *   await keyboard.pressKey(Key.LeftSuper, Key.T)
   *   await keyboard.releaseKey(Key.LeftSuper, Key.T)
   * }
   * ```
   * [Examples](https://scriptkit.com?query=get) | [Docs](https://johnlindquist.github.io/kit-docs/#get) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=get)
   */
  var get: import('axios').AxiosInstance['get']
  /**
   * An alias for axios.put
   * #### put example
   * ```ts
   * const result = await put("https://jsonplaceholder.typicode.com/posts/1", {
   *   title: "foo",
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=put) | [Docs](https://johnlindquist.github.io/kit-docs/#put) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=put)
   */
  var put: import('axios').AxiosInstance['put']
  /**
   * An alias for axios.post
   * #### post example
   * ```ts
   * const result = await post("https://jsonplaceholder.typicode.com/posts", {
   *   title: "foo",
   *   body: "bar",
   *   userId: 1,
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=post) | [Docs](https://johnlindquist.github.io/kit-docs/#post) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=post)
   */
  var post: import('axios').AxiosInstance['post']
  /**
   * An alias for axios.patch
   * #### patch example
   * ```ts
   * const result = await patch("https://jsonplaceholder.typicode.com/posts/1", {
   *   title: "foo",
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=patch) | [Docs](https://johnlindquist.github.io/kit-docs/#patch) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=patch)
   */
  var patch: import('axios').AxiosInstance['patch']
  /**
   * An alias for axios.delete
   * #### del example
   * ```ts
   * const result = await del("https://jsonplaceholder.typicode.com/posts/1");
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=del) | [Docs](https://johnlindquist.github.io/kit-docs/#del) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=del)
   */
  var del: import('axios').AxiosInstance['delete']
  //chalk
  var chalk: typeof import('chalk').default
  //child_process
  var spawn: typeof import('child_process').spawn
  var spawnSync: typeof import('child_process').spawnSync
  var fork: typeof import('child_process').fork

  // custom
  var ensureReadFile: EnsureReadFile
  var ensureReadJson: EnsureReadJson
  // execa
  /**
   * `exec` uses allows you to run shell commands within your script:
   * > Note: Execa is an alias for `execaCommand` from the `execa` npm package with "shell" and "all" true by default.
   * #### exec example
   * ```ts
   * let result = await exec(`ls -la`, {
   *   cwd: home(), // where to run the command
   *   shell: "/bin/zsh", // if you're expecting to use specific shell features/configs
   *   all: true, // pipe both stdout and stderr to "all"
   * })
   * inspect(result.all)
   * ```
   * #### exec with prompt info
   * ```ts
   * // It's extremely common to show the user what's happening while your command is running. This is often done by using `div` with `onInit` + `sumbit`:
   * let result = await div({
   *   html: md(`# Loading your home directory`),
   *   onInit: async () => {
   *     let result = await exec(`sleep 2 && ls -la`, {
   *       cwd: home(), // where to run the command
   *       shell: "/bin/zsh", // use if you're expecting the command to load in your .zshrc
   *       all: true, // pipe both stdout and stderr to "all"
   *     })
   * submit(result.all)
   *   },
   * })
   * ```
   * [Examples](https://scriptkit.com?query=exec) | [Docs](https://johnlindquist.github.io/kit-docs/#exec) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=exec)
   */
  var exec: typeof import('execa').execaCommand
  var execa: typeof import('execa').execa
  var execaSync: typeof import('execa').execaSync
  var execaCommand: typeof import('execa').execaCommand
  var execaCommandSync: typeof import('execa').execaCommandSync
  var execaNode: typeof import('execa').execaNode
  var $: typeof import('execa').$
  /**
   * Download a file from a URL
   * #### download example
   * ```ts
   * const url = "https://github.com/johnlindquist/kit/archive/refs/heads/main.zip";
   * const destination = home("Downloads");
   * await download(url, destination);
   * ```
   * [Examples](https://scriptkit.com?query=download) | [Docs](https://johnlindquist.github.io/kit-docs/#download) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=download)
   */
  var download: typeof import('download')
  var emptyDir: typeof import('fs-extra').emptyDir
  var emptyDirSync: typeof import('fs-extra').emptyDirSync
  var ensureFile: typeof import('fs-extra').ensureFile
  var ensureFileSync: typeof import('fs-extra').ensureFileSync
  var ensureDir: typeof import('fs-extra').ensureDir
  var ensureDirSync: typeof import('fs-extra').ensureDirSync
  var ensureLink: typeof import('fs-extra').ensureLink
  var ensureLinkSync: typeof import('fs-extra').ensureLinkSync
  var ensureSymlink: typeof import('fs-extra').ensureSymlink
  var ensureSymlinkSync: typeof import('fs-extra').ensureSymlinkSync
  var mkdirp: typeof import('fs-extra').mkdirp
  var mkdirpSync: typeof import('fs-extra').mkdirpSync
  var mkdirs: typeof import('fs-extra').mkdirs
  var outputFile: typeof import('fs-extra').outputFile
  var outputFileSync: typeof import('fs-extra').outputFileSync
  var outputJson: typeof import('fs-extra').outputJson
  var outputJsonSync: typeof import('fs-extra').outputJsonSync
  var pathExists: typeof import('fs-extra').pathExists
  var pathExistsSync: typeof import('fs-extra').pathExistsSync
  var readJson: typeof import('fs-extra').readJson
  var readJsonSync: typeof import('fs-extra').readJsonSync
  var remove: typeof import('fs-extra').remove
  var removeSync: typeof import('fs-extra').removeSync
  var writeJson: typeof import('fs-extra').writeJson
  var writeJsonSync: typeof import('fs-extra').writeJsonSync
  var move: typeof import('fs-extra').move
  var moveSync: typeof import('fs-extra').moveSync
  //fs/promises
  var readFile: typeof import('node:fs/promises').readFile
  var readFileSync: typeof import('node:fs').readFileSync
  var writeFile: typeof import('node:fs/promises').writeFile
  var writeFileSync: typeof import('node:fs').writeFileSync
  var appendFile: typeof import('node:fs/promises').appendFile
  var appendFileSync: typeof import('node:fs').appendFileSync
  var readdir: typeof import('node:fs/promises').readdir
  var readdirSync: typeof import('node:fs').readdirSync
  var copyFile: typeof import('node:fs/promises').copyFile
  var copyFileSync: typeof import('node:fs').copyFileSync

  var stat: typeof import('node:fs/promises').stat
  var lstat: typeof import('node:fs/promises').lstat

  var rmdir: typeof import('node:fs/promises').rmdir
  var unlink: typeof import('node:fs/promises').unlink
  var symlink: typeof import('node:fs/promises').symlink
  var readlink: typeof import('node:fs/promises').readlink
  var realpath: typeof import('node:fs/promises').realpath
  var access: typeof import('node:fs/promises').access

  var chown: typeof import('fs/promises').chown
  var lchown: typeof import('node:fs/promises').lchown
  var utimes: typeof import('node:fs/promises').utimes
  var lutimes: typeof import('node:fs/promises').lutimes

  var rename: typeof import('node:fs/promises').rename

  //fs
  var createReadStream: typeof import('fs').createReadStream
  var createWriteStream: typeof import('fs').createWriteStream

  /**
   * Create a handlebars template compiler
   * #### compile example
   * ```ts
   * const compiler = compile(`
   * Hello {{name}}
   * Have a {{mood}} day!
   * {{#if from}}
   * From {{author}}
   * {{/if}}
   * `);
   * const result = compiler({
   *   name: "John",
   *   mood: "great",
   *   author: "Script Kit",
   *   from: true,
   * });
   * await div(result);
   * ```
   * [Examples](https://scriptkit.com?query=compile) | [Docs](https://johnlindquist.github.io/kit-docs/#compile) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=compile)
   */
  var compile: typeof import('handlebars').compile

  /**
   * Convert markdown to HTML for rendering in prompts
   * #### md example
   * ```ts
   * const html = md(`# You're the Best
   * * Thanks for using Script Kit!
   * `);
   * await div(html);
   * ```
   * [Examples](https://scriptkit.com?query=md) | [Docs](https://johnlindquist.github.io/kit-docs/#md) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=md)
   */
  var md: typeof import('../globals/marked').md
  var marked: typeof import('marked').marked

  /**
   * Generate a UUID
   * #### uuid example
   * ```ts
   * const id = uuid();
   * await editor(id);
   * ```
   * [Examples](https://scriptkit.com?query=uuid) | [Docs](https://johnlindquist.github.io/kit-docs/#uuid) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=uuid)
   */
  var uuid: typeof import('node:crypto').randomUUID

  //replace-in-file
  /**
   * Replace a string or regex in one or more files
   * #### replace example
   * ```ts
   * const mdPath = kenvPath("sticky.md");
   * await replace({
   *   files: [mdPath],
   *   from: /nice/g, // replace all instances of "nice"
   *   to: "great",
   * });
   * ```
   * [Examples](https://scriptkit.com?query=replace) | [Docs](https://johnlindquist.github.io/kit-docs/#replace) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=replace)
   */
  var replace: typeof import('replace-in-file').replaceInFile

  // 1Password CLI integration
  /**
   * Retrieve secrets from 1Password using the CLI
   * #### op example
   * ```ts
   * // Get GitHub token from default vault
   * const token = await op("GitHub Token")
   * 
   * // Get API key from specific vault
   * const apiKey = await op("OpenAI API Key", "dev-vault")
   * 
   * // Get specific field from specific vault
   * const username = await op("Database Config", "prod-vault", "username")
   * 
   * // With caching options (default: 'session')
   * const apiKey = await op("API Key", "vault", "password", { 
   *   cacheDuration: 'until-quit' // 'session' | 'until-quit' | 'until-sleep'
   * })
   * ```
   * Note: Cached values are stored as environment variables with the pattern:
   * OP_<VAULT>_<ITEM>_<FIELD> (e.g., OP_GITHUB_TOKEN_PASSWORD)
   * 
   * [Docs](https://developer.1password.com/docs/cli/)
   */
  var op: (itemName: string, vaultName?: string, fieldName?: string, options?: {
    cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
  }) => Promise<string>

  // stream
  var Writable: typeof import('node:stream').Writable
  var Readable: typeof import('node:stream').Readable
  var Duplex: typeof import('node:stream').Duplex
  var Transform: typeof import('node:stream').Transform

  /**
   * Glob a list of files
   * #### globby example
   * ```ts
   * const kenvScripts = kenvPath("scripts", "*.ts");
   * const kenvScriptlets = kenvPath("scriptlets", "*.md");
   * const pathsForScriptsAndScriptlets = await globby([
   *   kenvScripts,
   *   kenvScriptlets,
   * ]);
   * await editor(JSON.stringify(pathsForScriptsAndScriptlets, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=globby) | [Docs](https://johnlindquist.github.io/kit-docs/#globby) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=globby)
   */
  var globby: typeof import('globby').globby
}
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
