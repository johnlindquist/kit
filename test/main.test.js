import ava from "ava"
import { KIT_APP_PROMPT, Channel } from "./config.js"

process.env.NODE_NO_WARNINGS = 1

process.env.KIT =
  process.env.KIT || path.resolve(os.homedir(), ".kit")

ava("kit setup", async t => {
  let envPath = kenvPath(".env")
  let fileCreated = test("-f", envPath)

  t.true(fileCreated)

  let contents = await readFile(envPath, "utf-8")
  t.true(contents.includes(`KIT_TEMPLATE=default`))
})

ava.serial(`New supports TypeScript`, async t => {
  let tsScript = `mock-typescript-script`
  await $`kit set-env-var KIT_MODE ts`
  await $`kit new ${tsScript} home --no-edit`

  let tsScriptPath = kenvPath("scripts", `${tsScript}.ts`)

  t.true(
    await pathExists(tsScriptPath),
    `Should create ${tsScript}.ts`
  )

  t.is(
    await readFile(tsScriptPath, "utf-8"),
    await readFile(
      kenvPath("templates", "default.ts"),
      "utf-8"
    ),
    `Generated TypeScript file matches TypeScript template`
  )

  await appendFile(
    tsScriptPath,
    `
console.log(await arg())`
  )

  let message = "success"
  let { stdout, stderr } =
    await $`kit ${tsScript} ${message}`

  t.is(stderr, "")

  t.regex(
    stdout,
    new RegExp(`${message}`),
    `TypeScript script worked`
  )

  let JSofTSExists = await pathExists(
    tsScriptPath.replace(/\.ts$/, ".js")
  )

  t.log(await readdir(kenvPath(".scripts")))

  t.false(JSofTSExists, `Should remove generated JS file`)

  let script = `mock-javascript-script`
  await $`kit set-env-var KIT_MODE js`
  await $`kit new ${script} home --no-edit`

  let scriptPath = kenvPath("scripts", `${script}.js`)

  t.true(await pathExists(scriptPath))

  t.assert(
    await readFile(scriptPath, "utf-8"),
    await readFile(
      kenvPath("templates", "default.js"),
      "utf-8"
    ),
    `Generated JavaScript file matches JavaScript template`
  )
})

ava.serial("kit new, run, and rm", async t => {
  let command = `mock-script-for-new-run-rm`
  let scriptContents = `
  let value = await arg()
  console.log(\`${command} \${value} 🎉!\`)
`

  let { stdout, stderr } =
    await $`KIT_MODE=js kit new ${command} home --no-edit`

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

ava("kit hook", async t => {
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

ava("kit script-output-hello", async t => {
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

ava("kit script in random dir", async t => {
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

ava("app-prompt.js", async t => {
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

  await new Promise((resolve, reject) => {
    child.on("message", data => {
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
      child.send(
        {
          channel: Channel.VALUE_SUBMITTED,
          value: {
            script,
            args: [],
          },
        },
        error => {}
      )
    }, 100)
  })
})

ava(`Run kit from package.json`, async t => {
  let command = `mock-pkg-json-script`
  let scriptPath = kenvPath("scripts", `${command}.js`)
  await $`KIT_MODE=js kit new ${command} home --no-edit`

  await appendFile(
    scriptPath,
    `
let value = await arg()  
console.log(value)
`
  )

  let pkgPath = kenvPath("package.json")
  let pkgJson = await readJson(pkgPath)
  let npmScript = "run-kit"

  let message = `success`

  pkgJson.scripts = {
    [npmScript]: `kit ${command} ${message}`,
  }

  await writeJson(pkgPath, pkgJson)

  pkgJson = await readJson(pkgPath)
  t.log(pkgJson)

  cd(kenvPath())
  let { stdout, stderr } = await $`npm run ${npmScript}`

  t.is(stderr, "")
  t.regex(stdout, new RegExp(`${message}`))
})
