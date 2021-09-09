import ava from "ava"
import path from "path"
import os from "os"
import { fork } from "child_process"

process.env.KIT =
  process.env.KIT || path.resolve(os.homedir(), ".kit")

await import(path.resolve(`${process.env.KIT}`, "run.js"))

/** @type {import("../src/core/util.js")} */
let { KIT_MAC_APP, KIT_MAC_APP_PROMPT, PROCESS_PATH } =
  await import(
    path.resolve(`${process.env.KIT}`, "core", "util.js")
  )
/** @type {import("../src/core/enum.js")} */
let { Channel } = await import(
  path.resolve(`${process.env.KIT}`, "core", "enum.js")
)

process.env.PATH = PROCESS_PATH
let options = {
  env: {
    PATH: PROCESS_PATH,
  },
}

ava.serial(
  "kit set-env-var KIT_TEMPLATE default",
  async t => {
    exec(`which kit`, options)

    let envPath = kenvPath(".env")
    await $`kit set-env-var KIT_TEMPLATE default --no-edit`
    let fileCreated = test("-f", envPath)

    t.true(fileCreated, process.env.KENV_DEV)
  }
)

let command = `kit-terminal-testing-new-ava`
let scriptPath = kenvPath("scripts", `${command}.js`)
let binPath = kenvPath("bin", `${command}`)

ava.serial("kit new", async t => {
  await $`kit new ${command} --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", scriptPath)

  t.true(scriptCreated)
  t.true(binCreated)
})

ava.serial("kit rm", async t => {
  let { stdout, stderr } =
    await $`kit rm ${command} --confirm`

  console.log({ stdout, stderr })
  let fileRmed = !test("-f", scriptPath)
  let binRmed = !test("-f", binPath)

  t.true(fileRmed)
  t.true(binRmed)
})

ava.serial("kit hook", async t => {
  let message = "hello"
  let { value } = await kit(`script-with-export ${message}`)
  t.is(value, message)
})

ava.serial("kit mac-app-prompt.js", async t => {
  /** @type {import("./scripts/script-with-arg.js")} */
  let script = kenvPath("scripts", "script-with-arg.js")
  let child = fork(KIT_MAC_APP_PROMPT, {
    env: {
      KIT: home(".kit"),
      KENV: kenvPath(),
      KIT_CONTEXT: "app",
    },
  })

  let messages = []

  return new Promise((resolve, reject) => {
    child.on("message", data => {
      messages.push(data)
      if (data?.channel === Channel.SET_PROMPT_DATA) {
        let { placeholder, kitScript } = data
        t.deepEqual(
          {
            placeholder,
            script: kitScript,
          },
          {
            placeholder: "hello",
            script,
          }
        )

        resolve(data?.placeholder)
      }
    })

    setTimeout(() => {
      child.send({
        channel: Channel.VALUE_SUBMITTED,
        value: {
          script,
          args: [],
        },
      })
    }, 1000)
  })
})

ava.serial("clean .env", async t => {
  await trash(kenvPath(".env"))
  let fileRmed = !test("-f", kenvPath(".env"))

  t.true(fileRmed)
})
