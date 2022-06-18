// Description: Process List
// Log: false

import { Channel } from "../core/enum.js"
let formatProcesses = async () => {
  let processes = await getProcesses()
  return processes
    .filter(p => p?.scriptPath)
    .map(p => {
      return {
        name: p?.scriptPath,
        description: `${p.pid}`,
        value: p,
      }
    })
}
let id = setTimeout(async () => {
  setChoices(await formatProcesses())
}, 1000)

let argPromise = arg(
  {
    placeholder: "Select Process",
    footer: "Select to view process options",
    onEscape: async () => {
      clearTimeout(id)
      await mainScript()
    },
    onAbandon: async () => {
      clearTimeout(id)
      await mainScript()
    },
  },
  await formatProcesses()
)
let { pid, scriptPath } = await argPromise
clearInterval(id)

let { dir, name } = path.parse(scriptPath)
let logPath = path.resolve(dir, "..", "logs", name + ".log")
let hasLog = await isFile(logPath)

setDescription(`${pid}: ${scriptPath}`)

let actions = [
  {
    name: `Terminate`,
    description: `Terminate process ${pid}: ${path.basename(
      scriptPath
    )}`,
    value: "terminate",
  },
]

if (hasLog) {
  actions.unshift({
    name: `View Log`,
    description: logPath,
    value: "logs",
  })
}
let action = await arg("Select action", actions)

if (action === "logs") {
  await edit(logPath)
}

if (action === "terminate") {
  send(Channel.TERMINATE_PROCESS, pid)
  await run(kitPath("cli", "processes.js"))
}
