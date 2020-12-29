//Description: The fastest way to play with JavaScript.
let { setEnv } = await import("./simple/utils.js")

let fileName = "scratch.js"
let fileWrapper = "scratch-wrapper.js"

let filePath = path.join(env.SIMPLE_TMP_PATH, fileName)
let fileWrapperPath = path.join(
  env.SIMPLE_TMP_PATH,
  fileWrapper
)

let cleanupCallback = async () => {
  await setEnv("SIMPLE_PAD_PID", -1)
  trash(filePath)
  trash(fileWrapperPath)
}

if (env?.SIMPLE_PAD_PID > 0) {
  await cleanupCallback()
  process.kill(env?.SIMPLE_PAD_PID)
  exit()
}

let { watch } = await need("chokidar")
let { default: cleanup } = await need("node-cleanup")

await setEnv("SIMPLE_PAD_PID", process.pid)

await writeFile(filePath, "")
edit(filePath)

let execString = `
NODE_PATH=${env.SIMPLE_PATH}/node_modules \
DOTENV_CONFIG_PATH=${env.SIMPLE_PATH}/.env \
${env.SIMPLE_NODE} \
--require dotenv-with-expand/config \
--require "${env.SIMPLE_PATH}/lib/dangerously_edit.cjs" \
${fileWrapperPath} \
"$@"
`.trim()

let padBreak = `//pad----------`

let watcher
let change = async (event, path, details) => {
  await watcher.unwatch(filePath)
  let fileContents = await readFile(filePath, "utf8")
  let lines = fileContents
    .split("\n")
    .map(line => line.trim())
  let padBreakLocation = lines.indexOf(padBreak)

  let top = lines.slice(0, padBreakLocation).join("\n")

  let linesToRun = lines.slice(0, padBreakLocation)
  for (let i = linesToRun.length - 1; i > -1; i--) {
    let line = linesToRun[i]
    if (
      line &&
      !line.startsWith(" ") &&
      !line.startsWith("//")
    ) {
      if (line.startsWith(";")) line = line.slice(1)
      linesToRun.push("console.log(" + line + ")")
      break
    }
  }

  linesToRun = linesToRun.join("\n")
  linesToRun = `try{${linesToRun}}catch(error){console.log(error)}`.trim()

  await writeFile(fileWrapperPath, linesToRun)

  let result = exec(execString, { silent: false })
  result = result.toString()
  if (result.startsWith("[") || result.startsWith("("))
    result = ";" + result
  let newContent = `
${top}
${padBreak}
${result}
`.trim()

  await writeFile(filePath, newContent)

  setTimeout(() => {
    watcher.add(filePath)
  }, 100)
}

watcher = watch(filePath)
watcher.on("raw", change)

cleanup(cleanupCallback)
