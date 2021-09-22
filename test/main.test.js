import ava from "ava"
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

ava.serial("kit new, run, and rm", async t => {
  let command = `mock-script-for-new-run-rm`
  let scriptContents = `
  let value = await arg()
  console.log(\`${command} \${value} 🎉!\`)
`

  let { stdout, stderr } =
    await $`kit new ${command} home --no-edit`
  t.log({ stdout, stderr })

  let scriptPath = kenvPath("scripts", `${command}.js`)
  let binPath = kenvPath("bin", `${command}`)

  t.true(stderr === "", `kit new errored out`)
  t.true(test("-f", scriptPath), `script created`)
  await writeFile(scriptPath, scriptContents)

  t.true(test("-f", binPath), `bin created`)

  let message = "success"

  ;({ stdout, stderr } = await $`${kenvPath(
    "bin",
    command
  )} ${message}`)

  t.true(
    stdout.includes(message),
    `stdout includes ${message}`
  )

  await $`kit rm ${command} --confirm`

  let fileRmed = !test("-f", scriptPath)
  let binRmed = !test("-f", binPath)

  t.true(fileRmed)
  t.true(binRmed)
})

ava.serial("kit hook", async t => {
  let script = `mock-script-with-export`
  let contents = `
  export let value = await arg()
  `
  await $`kit new ${script} home --no-edit`
  await writeFile(
    kenvPath("scripts", `${script}.js`),
    contents
  )

  let message = "hello"
  let result = await kit(`${script} ${message}`)
  t.is(result.value, message)
})

ava.serial("kit script-output-hello", async t => {
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

ava.serial("kit script in random dir", async t => {
  let someRandomDir = kitMockPath(`.kit-some-random-dir`)
  let script = `mock-some-random-script`
  let contents = `console.log(await arg())`
  let scriptPath = path.resolve(
    someRandomDir,
    `${script}.js`
  )
  await outputFile(scriptPath, contents)

  let { stdout, stderr } =
    await $`kit ${scriptPath} "hello"`
  // t.log({ stdout, stderr, scriptPath })

  t.true(stdout.includes("hello"))
})

ava.serial("app-prompt.js", async t => {
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

  await new Promise(resolve => {
    child.on("spawn", resolve)
  })

  await new Promise((resolve, reject) => {
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

    setInterval(() => {
      child.send({
        channel: Channel.VALUE_SUBMITTED,
        value: {
          script,
          args: [],
        },
      })
    }, 100)
  })
})
