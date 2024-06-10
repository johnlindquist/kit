import ava from "ava"
import os from "os"
import fs from "fs-extra"
import "../../test/config.js"
import dotenv from "dotenv"

/** @type {import("./utils")} */
let { resolveToScriptPath } = await import(
  kitPath("core", "utils.js")
)

ava.serial(`testing "run" is global`, async t => {
  let otherScript = `mock-other-script`
  let mainScript = `mock-main-run-script`

  await $`KIT_MODE=js kit new ${otherScript} main --no-edit`
  await $`KIT_MODE=js kit new ${mainScript} main --no-edit`

  await appendFile(
    kenvPath("scripts", `${mainScript}.js`),
    `
    await run("${otherScript}")
    `
  )

  let { stdout, stderr } = await $`${kenvPath(
    "bin",
    mainScript
  )}`

  t.is(stderr, "")
})

ava.serial(`tmpPath generates a tmp path`, async t => {
  let script = `mock-tmp-path`
  let file = "taco.txt"

  let { stdout, stderr } = await testScript(
    script,
    `
    console.log(tmpPath("${file}"))    
    `
  )

  t.true(await pathExists(kenvPath("tmp", script)))
  t.is(
    stdout.trim(),
    path.resolve(os.tmpdir(), "kit", script, file)
  )
  t.is(stderr, "")
})

ava.serial(
  "setEnvVar sets an environment variable",
  async t => {
    const key = "KIT_TEST_ENV_VAR"
    const value = "hello"
    const { setEnvVar } = await import(
      kitPath("api", "kit.js")
    )
    await setEnvVar(key, value)

    let kenvEnvPath = kenvPath(".env")
    let kenvEnv = dotenv.parse(
      await readFile(kenvEnvPath, "utf8")
    )

    t.is(kenvEnv[key], value)
  }
)

ava.serial(
  "getEnvVar gets an environment variable",
  async t => {
    let key = "KIT_TEST_ENV_VAR"
    let fallback = "default"
    let expectedValue = "hello"

    // Assuming setEnvVar works as expected, we set an environment variable first
    let { setEnvVar, getEnvVar } = await import(
      kitPath("api", "kit.js")
    )
    await setEnvVar(key, expectedValue)

    // Now we retrieve the environment variable
    let value = await getEnvVar(key, fallback)

    // Check if the retrieved value matches the expected value
    t.is(value, expectedValue)
  }
)

ava.serial(
  "getEnvVar returns fallback if environment variable does not exist",
  async t => {
    let key = "NON_EXISTENT_ENV_VAR"
    let fallback = "default"

    // We attempt to retrieve a non-existent environment variable
    let { getEnvVar } = await import(
      kitPath("api", "kit.js")
    )
    let value = await getEnvVar(key, fallback)

    // Check if the fallback value is returned
    t.is(value, fallback)
  }
)

ava.serial(
  "toggleEnvVar toggles an environment variable",
  async t => {
    let key = "KIT_TEST_TOGGLE_VAR"
    let defaultValue = "true"

    // Import the methods

    /** @type {import("./kit.js")} */
    let { setEnvVar, toggleEnvVar, getEnvVar } =
      await import(kitPath("api", "kit.js"))

    // Set the environment variable to the default value
    await setEnvVar(key, defaultValue)

    let toggledValue = await getEnvVar(key, "")

    t.is(toggledValue, "true")

    // Toggle the environment variable
    await toggleEnvVar(key)

    // Retrieve the toggled value
    toggledValue = await getEnvVar(key, "")

    // Check if the value has been toggled from "true" to "false"
    t.is(toggledValue, "false")

    // Toggle again
    await toggleEnvVar(key)

    // Retrieve the value again
    toggledValue = await getEnvVar(key, "")

    // Check if the value has been toggled back to "true"
    t.is(toggledValue, "true")
  }
)
