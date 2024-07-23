import ava from "ava"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

console.log(`KENV ${process.env.KENV}`)

/** @type {import("./utils")} */
let { resolveToScriptPath, run } = await import(
  pathToFileURL(kitPath("core", "utils.js")).href
)

let testingFindMe = `testing-find-me`
let testingFullPath = kitMockPath(
  `.kit-testing-full-path`,
  `some-script.js`
)
let mockMjsFile = kitMockPath(
  `.kit-testing-full-path`,
  `mock-mjs-script.mjs`
)

let prevCwd = cwd()

ava.before(async () => {
  await exec(`kit new ${testingFindMe} main --no-edit`, {
    env: {
      ...process.env,
      KIT_MODE: "js"
    }
  })
})

ava.serial("resolve full path", async t => {
  await outputFile(
    testingFullPath,
    `console.log(await arg())`
  )
  let scriptPath = resolveToScriptPath(testingFullPath)

  t.assert(scriptPath, testingFullPath)
})

ava.serial("run full path", async t => {
  let testingRunPath = kitMockPath(
    `.kit-testing-run-path`,
    `some-script.js`
  )

  let testingRunPackageJson = kitMockPath(
    `.kit-testing-run-path`,
    `package.json`
  )

  await outputFile(
    testingRunPackageJson,
    JSON.stringify({
      type: "module",
    })
  )

  await outputFile(
    testingRunPath,
    `export let value = "success"`
  )

  t.true(await isFile(testingRunPath))

  let result = await run(testingRunPath)
  t.log({ result })

  t.assert(result.value, "success")
})

ava.serial("run full path with spaces", async t => {
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
      type: "module",
    })
  )

  await outputFile(
    testingSpacedPath,
    `export let value = "success"`
  )

  t.true(await isFile(testingSpacedPath))

  let result = await run(testingSpacedPath)
  t.log({ result })

  t.assert(result.value, "success")
})

ava.serial("resolve .mjs file", async t => {
  await outputFile(mockMjsFile, `console.log(await arg())`)
  let scriptPath = resolveToScriptPath(mockMjsFile)

  t.assert(scriptPath, mockMjsFile)
})

ava.serial("resolve ./scripts dir", async t => {
  let script = "mock-some-script"
  let mockScriptsInProject = kitMockPath(
    `.kit-testing-scripts-in-project`
  )
  let mockScriptInProjectScript = path.resolve(
    mockScriptsInProject,
    "scripts",
    `${script}.js`
  )

  await outputFile(
    mockScriptInProjectScript,
    `console.log(await arg())`
  )
  cd(mockScriptsInProject)

  let scriptPath = resolveToScriptPath(script)

  t.assert(scriptPath, testingFullPath)

  cd(prevCwd)
})

ava.serial("resolve in kenvPath", t => {
  let scriptPath = resolveToScriptPath(testingFindMe)
  let scriptInKenvPath = kenvPath(
    "scripts",
    `${testingFindMe}.js`
  )

  t.log({ scriptPath, scriptInKenvPath })
  t.assert(scriptPath, scriptInKenvPath)
})

ava.serial("resolve in kenvPath with .js", t => {
  let scriptPath = resolveToScriptPath(
    testingFindMe + ".js"
  )

  t.assert(
    scriptPath,
    kenvPath("scripts", `${testingFindMe}.js`)
  )
})

ava.serial("resolve doesn't exist", t => {
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
  async t => {
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
