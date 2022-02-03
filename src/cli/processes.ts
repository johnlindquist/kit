// Description: Terminate a Script Kit Process

import { Channel } from "../core/enum.js"

let formatProcesses = async () => {
  let processes = await getProcesses()
  return processes
    .filter(p => p?.scriptPath)
    .map(p => {
      return {
        name: p?.scriptPath,
        description: `${p.pid}`,
        value: p.pid,
      }
    })
}

let argPromise = arg(
  "Terminate Script Kit Process",
  await formatProcesses()
)

let id = setInterval(async () => {
  setChoices(await formatProcesses())
}, 1000)

let pid = await argPromise
clearInterval(id)

send(Channel.TERMINATE_PROCESS, pid)

await run(kitPath("cli", "processes.js"))

export {}
