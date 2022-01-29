// Description: > Run Command

let commandHandlerPathJS = kenvPath(
  "scripts",
  "command-handler.js"
)
let commandHandlerPathTS = kenvPath(
  "scripts",
  "command-handler.ts"
)

let isCommandHandlerJS = await isFile(commandHandlerPathJS)
let isCommandHandlerTS = await isFile(commandHandlerPathTS)

setDescription(`Select Working Directory`)
let workingDir = await path()
cd(workingDir)

setDescription(`> Run Command in ${workingDir}`)
if (isCommandHandlerJS) {
  await run(commandHandlerPathJS)
} else if (isCommandHandlerTS) {
  await run(commandHandlerPathTS)
} else {
  let c = await arg("Enter command:", null)
  let { stdout, stderr, command } = await exec(c)

  setDescription(`> ${command} Results`)
  await editor(
    `
## directory: ${workingDir}
## command: ${command}

## stdout: 
${stdout}
  
## stderr: 
${stderr}`.trim()
  )
}

export {}
