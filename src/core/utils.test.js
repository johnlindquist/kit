import ava from "ava"
import "../../test/config.js"

/** @type {import("./utils")} */
let { resolveToScriptPath } = await import(
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
  await $`KIT_MODE=js kit new ${testingFindMe} home --no-edit`
})

ava("resolve full path", async t => {
  await outputFile(
    testingFullPath,
    `console.log(await arg())`
  )
  let scriptPath = resolveToScriptPath(testingFullPath)

  t.assert(scriptPath, testingFullPath)
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

  t.assert(
    scriptPath,
    kenvPath("scripts", `${testingFindMe}.js`)
  )
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
