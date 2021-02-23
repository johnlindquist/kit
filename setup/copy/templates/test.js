let { default: kill } = await npm("tree-kill")
let { default: cleanup } = await npm("node-cleanup")

await trash([
  simplePath("scripts", "testing-tutorial.js"),
  simplePath("bin", "testing-tutorial"),
  simplePath("scripts", "new-default.js"),
  simplePath("bin", "new-default"),
])

let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working!")

if (response.data.name != "simplescripts") {
  exit()
}
echo(`

---"new" passed---

---starting "tutorial"---

`)

//----------------------

let TUTORIAL_CONTENT_PATH = simplePath("tmp")
await sdk("cli/set-env-var", "SIMPLE_TEMPLATE", "tutorial")
await sdk(
  "cli/set-env-var",
  "TUTORIAL_CONTENT_PATH",
  TUTORIAL_CONTENT_PATH
)

let testingTutorial = "testing-tutorial"
await sdk(
  `cli/tutorial`,
  testingTutorial,
  "--trust",
  "--no-edit"
)

let testingTutorialFilePath = path.join(
  simplePath("scripts"),
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
  simplePath("templates", "tutorial.js")
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
await simple(
  "cli/set-env-var",
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

console.log("bin:", ls(simplePath("bin")).toString())
console.log("PATH:", env.PATH)

let newDefault = "new-default"
let newChild = spawnSync(
  `new`,
  [newDefault, "--trust", "--no-edit"],
  {
    stdio: "inherit",
    env: {
      PATH: simplePath("bin") + ":" + env.PATH,
    },
  }
)

console.log(
  "scripts:",
  ls(simplePath("scripts")).toString()
)
console.log("new:", which("new"))

let newDefaultContentPath = simplePath(
  "scripts",
  newDefault + ".js"
)
let newDefaultBuffer = await readFile(newDefaultContentPath)

let defaultTemplateBuffer = await readFile(
  simplePath("templates", "default.js")
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
