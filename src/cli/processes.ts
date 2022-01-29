// Description: Terminate a Script Kit Process

import { Channel } from "../core/enum.js"

let processes = await getProcesses()

let pid = await arg(
  "Terminate Script Kit Process",
  processes
    .filter(p => p?.scriptPath)
    .map(p => {
      return {
        name: p?.scriptPath,
        description: `${p.pid}`,
        value: p.pid,
      }
    })
)

send(Channel.TERMINATE_PROCESS, pid)

await run(kitPath("cli", "processes.js"))

export {}
