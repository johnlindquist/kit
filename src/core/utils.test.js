import ava from "ava"
import "../../test/config.js"

console.log(`KENV ${process.env.KENV}`)

/** @type {import("./utils")} */
let { resolveToScriptPath, run } = await import(
  kitPath("core", "utils.js")
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
  await $`KIT_MODE=js kit new ${testingFindMe} main --no-edit`
})

ava("resolve full path", async t => {
  await outputFile(
    testingFullPath,
    `console.log(await arg())`
  )
  let scriptPath = resolveToScriptPath(testingFullPath)

  t.assert(scriptPath, testingFullPath)
})

ava("run full path", async t => {
  let testingRunPath = kitMockPath(
    `.kit-testing-run-path`,
    `some-script.js`
  )

  await outputFile(
    testingRunPath,
    `export let value = "success"`
  )
  let result = await run(testingRunPath)
  t.log({ result })

  t.assert(result.value, "success")
})

ava("run full path with spaces", async t => {
  let testingSpacedPath = kitMockPath(
    `.kit-testing-spaced-path`,
    `some spaced script.js`
  )
  await outputFile(
    testingSpacedPath,
    `export let value = "success"`
  )
  let result = await run(testingSpacedPath)
  t.log({ result })

  t.assert(result.value, "success")
})

ava("resolve .mjs file", async t => {
  await outputFile(mockMjsFile, `console.log(await arg())`)
  let scriptPath = resolveToScriptPath(mockMjsFile)

  t.assert(scriptPath, mockMjsFile)
})

ava("resolve ./scripts dir", async t => {
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

ava("resolve in kenvPath", t => {
  let scriptPath = resolveToScriptPath(testingFindMe)
  let scriptInKenvPath = kenvPath(
    "scripts",
    `${testingFindMe}.js`
  )

  t.log({ scriptPath, scriptInKenvPath })
  t.assert(scriptPath, scriptInKenvPath)
})

ava("resolve in kenvPath with .js", t => {
  let scriptPath = resolveToScriptPath(
    testingFindMe + ".js"
  )

  t.assert(
    scriptPath,
    kenvPath("scripts", `${testingFindMe}.js`)
  )
})

ava("resolve doesn't exist", t => {
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

ava(
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
