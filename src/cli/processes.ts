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
    hint: "Select to view log or terminate",
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

setDescription(`${pid}: ${scriptPath}`)
let action = await arg("Select action", [
  {
    name: `View Process Log`,
    value: "logs",
  },
  {
    name: `Terminate Process`,
    value: "terminate",
  },
])

if (action === "logs") {
  let { dir, name } = path.parse(scriptPath)
  let logPath = path.resolve(
    dir,
    "..",
    "logs",
    name + ".log"
  )
  await edit(logPath)
}

if (action === "terminate") {
  send(Channel.TERMINATE_PROCESS, pid)
  await run(kitPath("cli", "processes.js"))
}
