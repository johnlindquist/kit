let { default: kill } = await need("tree-kill")
let { default: cleanup } = await need("node-cleanup")

await trash([
  path.join(env.SIMPLE_SCRIPTS_PATH, "testing-tutorial.js"),
  path.join(env.SIMPLE_BIN_PATH, "testing-tutorial"),
  path.join(env.SIMPLE_SCRIPTS_PATH, "new-default.js"),
  path.join(env.SIMPLE_BIN_PATH, "new-default"),
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
await run("cli/set-env-var", "SIMPLE_TEMPLATE", "tutorial")
await run(
  "cli/set-env-var",
  "TUTORIAL_CONTENT_PATH",
  TUTORIAL_CONTENT_PATH
)

let testingTutorial = "testing-tutorial"
await run(
  `cli/tutorial`,
  testingTutorial,
  "--trust",
  "--no-edit"
)

let testingTutorialFilePath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
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
await run(
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

let testFile = "test.txt"
await writeFile(testFile, "testing")

exec(
  `new share-file --url https://simplescripts.dev/scripts/johnlindquist/share-file.js`
)

console.log(`--- AFTER EXEC ---`)
console.log("PATH: ", env.PATH)
console.log(ls(simplePath("bin")).toString())
console.log(ls(simplePath("scripts")).toString())

let shareFileChild = spawn(
  `share-file`,
  [testFile, "--trust"],
  {
    stdio: "inherit",
  }
)

await new Promise((res, rej) => {
  setTimeout(res, 2000)
})
trash(testFile)
kill(shareFileChild.pid)
echo(`"share-file" passed`)

exec(
  `new pad --url https://simplescripts.dev/scripts/johnlindquist/pad.js`
)

let padChild = spawn(
  `pad`,
  [testFile, "--trust", "--no-edit"],
  {
    stdio: "inherit",
  }
)

kill(padChild.pid)
echo(`"pad" passed`)

cleanup(async () => {
  await trash([
    path.join(
      env.SIMPLE_SCRIPTS_PATH,
      "testing-tutorial.js"
    ),
    path.join(env.SIMPLE_BIN_PATH, "testing-tutorial"),
    path.join(env.SIMPLE_SCRIPTS_PATH, "new-default.js"),
    path.join(env.SIMPLE_BIN_PATH, "new-default"),
  ])
})
