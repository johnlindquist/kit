setChoices([])
setDescription(`> Run command`)

let terminalHandlerPathJS = kenvPath(
  "scripts",
  "terminal-handler.js"
)
let terminalHandlerPathTS = kenvPath(
  "scripts",
  "terminal-handler.ts"
)

let isTerminalHandlerJS = await isFile(
  terminalHandlerPathJS
)
let isTerminalHandlerTS = await isFile(
  terminalHandlerPathTS
)

if (isTerminalHandlerJS) {
  await run(terminalHandlerPathJS)
} else if (isTerminalHandlerTS) {
  await run(terminalHandlerPathTS)
} else {
  let command = await arg("Enter command:")
  await exec(command)
}

export {}
