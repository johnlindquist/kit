let { default: kill } = await npm("tree-kill")
let { default: cleanup } = await npm("node-cleanup")

await trash([
  kenvPath("scripts", "testing-tutorial.js"),
  kenvPath("bin", "testing-tutorial"),
  kenvPath("scripts", "new-default.js"),
  kenvPath("bin", "new-default"),
])

let response = await get(
  `https://api.github.com/repos/johnlindquist/kit`
)
echo(response.data.name + " is working!")

if (response.data.name != "kit") {
  exit()
}
echo(`

---"new" passed---

---starting "tutorial"---

`)

//----------------------

let TUTORIAL_CONTENT_PATH = kenvPath("tmp")
await cli("set-env-var", "KIT_TEMPLATE", "tutorial")
await cli(
  "set-env-var",
  "TUTORIAL_CONTENT_PATH",
  TUTORIAL_CONTENT_PATH
)

let testingTutorial = "testing-tutorial"
await cli("new", testingTutorial, "--trust", "--no-edit")

let testingTutorialFilePath = path.join(
  kenvPath("scripts"),
  testingTutorial + ".js"
)
let tutorialContent = await readFile(
  testingTutorialFilePath,
  "utf8"
)

let tutorialContentBuffer = await readFile(
  testingTutorialFilePath
)
let tutorialTemplateBuffer = await readFile(
  kenvPath("templates", "tutorial.js")
)

if (
  Buffer.compare(
    tutorialContentBuffer,
    tutorialTemplateBuffer
  )
) {
  echo(`successfully used tutorial template`)
} else {
  echo(`tutorial content and template don't match...`)
  echo(tutorialContent)
  echo("-------------------")
  echo(tutorialTemplateContent)
  exit()
}

tutorialContent = tutorialContent.replaceAll(/^\/\//gm, "")
await cli(
  "set-env-var",
  "TUTORIAL_CONTENT_PATH",
  TUTORIAL_CONTENT_PATH
)

await writeFile(testingTutorialFilePath, tutorialContent)
let testingTutorialChild = spawnSync(
  testingTutorial,
  ["johnlindquist", "--trust", "--no-edit"],
  {
    stdio: "inherit",
    env: {
      TUTORIAL_CONTENT_PATH,
      ...env,
    },
  }
)

echo(`"tutorial" passed`)

//---------------------

console.log("bin:", ls(kenvPath("bin")).toString())
console.log("PATH:", env.PATH)

let newDefault = "new-default"
let newChild = spawnSync(
  `new`,
  [newDefault, "--trust", "--no-edit"],
  {
    stdio: "inherit",
    env: {
      PATH: kenvPath("bin") + ":" + env.PATH,
    },
  }
)

console.log("scripts:", ls(kenvPath("scripts")).toString())
console.log("new:", which("new"))

let newDefaultContentPath = kenvPath(
  "scripts",
  newDefault + ".js"
)
let newDefaultBuffer = await readFile(newDefaultContentPath)

let defaultTemplateBuffer = await readFile(
  kenvPath("templates", "default.js")
)

if (
  Buffer.compare(newDefaultBuffer, defaultTemplateBuffer)
) {
  echo(
    `"new" passed (used default template after tutorial)`
  )
} else {
  echo(await readFile(newDefaultContentPath, "utf8"))
  exit()
}
