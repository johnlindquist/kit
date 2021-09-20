import ava from "ava"
import fs from "fs-extra"
import { KIT_APP_PROMPT, Channel } from "./config.js"

process.env.NODE_NO_WARNINGS = 1

ava.serial(
  "kit set-env-var KIT_TEMPLATE default",
  async t => {
    let envPath = kenvPath(".env")
    let KIT_TEMPLATE = "KIT_TEMPLATE"
    let kitTemplate = "default"
    await $`kit set-env-var ${KIT_TEMPLATE} ${kitTemplate} --no-edit`
    let fileCreated = test("-f", envPath)

    t.true(fileCreated)

    let contents = await readFile(envPath, "utf-8")
    t.true(
      contents.includes(`${KIT_TEMPLATE}=${kitTemplate}`)
    )
  }
)

let command = `mock-new-script-from-scripts`
let scriptPath = kenvPath("scripts", `${command}.js`)
let binPath = kenvPath("bin", `${command}`)
let scriptContents = `console.log("${command} success 🎉!")`

ava("kit new", async t => {
  await $`kit new ${command} home --no-edit`
  let scriptCreated = test("-f", scriptPath)
  let binCreated = test("-f", binPath)
  await writeFile(scriptPath, scriptContents)

  t.true(scriptCreated)
  t.true(binCreated)
})

ava("kenv bin on path", async t => {
  let runCommand = `mock-run-${command}`
  await $`kit new ${runCommand} home --no-edit`

  let contents = `
  await $\`${command}\`
  `

  await outputFile(
    kenvPath("scripts", `${runCommand}.js`),
    contents
  )

  let { stdout } = await $`${kenvPath("bin", runCommand)}`

  t.true(stdout.includes("success"))
})

ava("kit rm", async t => {
  await $`kit rm ${command} --confirm`

  let fileRmed = !test("-f", scriptPath)
  let binRmed = !test("-f", binPath)

  t.true(fileRmed)
  t.true(binRmed)
})

ava("kit hook", async t => {
  let script = `mock-script-with-export`
  let contents = `
  export default {value: await arg()}
  `
  await $`kit new ${script} home --no-edit`
  await writeFile(
    kenvPath("scripts", `${script}.js`),
    contents
  )

  let message = "hello"
  let { value } = await kit(`${script} ${message}`)
  t.is(value, message)
})

ava("k script-output-hello", async t => {
  let script = `mock-script-output-hello`
  let contents = `console.log(await arg())`
  await $`kit new ${script} home --no-edit`
  await writeFile(
    kenvPath("scripts", `${script}.js`),
    contents
  )

  let { stdout } = await $`kit ${script} "hello"`

  t.true(stdout.includes("hello"))
})

let someRandomDir = kitMockPath(`.kit-some-random-dir`)
ava("kit script in random dir", async t => {
  let script = `mock-some-random-script`
  let contents = `console.log(await arg())`
  let scriptPath = path.resolve(
    someRandomDir,
    `${script}.js`
  )
  await outputFile(scriptPath, contents)

  let { stdout, stderr } =
    await $`kit ${scriptPath} "hello"`
  t.log({ stdout, stderr, scriptPath })

  t.true(stdout.includes("hello"))
})

ava("kit app-prompt.js", async t => {
  let script = `mock-script-with-arg`
  let scriptPath = kenvPath("scripts", `${script}.js`)
  let placeholder = "hello"
  let contents = `
  await arg("${placeholder}")
  `
  await $`kit new ${script} home --no-edit`
  await writeFile(scriptPath, contents)

  let child = fork(KIT_APP_PROMPT, {
    env: {
      NODE_NO_WARNINGS: "1",
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
        let { placeholder: dataPlaceholder, kitScript } =
          data
        t.deepEqual(
          {
            placeholder: dataPlaceholder,
            script: kitScript,
          },
          {
            placeholder,
            script: scriptPath,
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

ava.after.always("cleanup", async () => {
  await fs.rm(someRandomDir, {
    recursive: true,
    force: true,
  })
})
