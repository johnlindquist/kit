let { default: kill } = await npm("tree-kill")
let { default: cleanup } = await npm("node-cleanup")

await trash([
  projectPath("scripts", "testing-tutorial.js"),
  projectPath("bin", "testing-tutorial"),
  projectPath("scripts", "new-default.js"),
  projectPath("bin", "new-default"),
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

let TUTORIAL_CONTENT_PATH = projectPath("tmp")
await cli("set-env-var", "KIT_TEMPLATE", "tutorial")
await cli(
  "set-env-var",
  "TUTORIAL_CONTENT_PATH",
  TUTORIAL_CONTENT_PATH
)

let testingTutorial = "testing-tutorial"
await cli(
  `tutorial`,
  testingTutorial,
  "--trust",
  "--no-edit"
)

let testingTutorialFilePath = path.join(
  projectPath("scripts"),
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
  projectPath("templates", "tutorial.js")
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

console.log("bin:", ls(projectPath("bin")).toString())
console.log("PATH:", env.PATH)

let newDefault = "new-default"
let newChild = spawnSync(
  `new`,
  [newDefault, "--trust", "--no-edit"],
  {
    stdio: "inherit",
    env: {
      PATH: projectPath("bin") + ":" + env.PATH,
    },
  }
)

console.log(
  "scripts:",
  ls(projectPath("scripts")).toString()
)
console.log("new:", which("new"))

let newDefaultContentPath = projectPath(
  "scripts",
  newDefault + ".js"
)
let newDefaultBuffer = await readFile(newDefaultContentPath)

let defaultTemplateBuffer = await readFile(
  projectPath("templates", "default.js")
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
  `new share-file --url https://scriptkit.app/scripts/johnlindquist/share-file.js --no-edit`,
  {
    stdio: "inherit",
    env: {
      PATH: projectPath("bin") + ":" + env.PATH,
    },
  }
)

console.log(`--- AFTER EXEC ---`)
console.log("PATH: ", env.PATH)
console.log(ls(projectPath("bin")).toString())
console.log(ls(projectPath("scripts")).toString())

let shareFileChild = spawn(
  `share-file`,
  [testFile, "--trust"],
  {
    stdio: "inherit",
    env: {
      PATH: projectPath("bin") + ":" + env.PATH,
    },
  }
)

await new Promise((res, rej) => {
  setTimeout(res, 2000)
})
trash(testFile)
kill(shareFileChild.pid)
echo(`"share-file" passed`)

exec(
  `new hello-world --url https://scriptkit.app/scripts/johnlindquist/hello-world.js --no-edit`,
  {
    stdio: "inherit",
    env: {
      PATH: projectPath("bin") + ":" + env.PATH,
    },
  }
)
