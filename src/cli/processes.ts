// Description: Process List
// Log: false

import { Channel } from "../core/enum.js"
import {
  escapeShortcut,
  cmd,
  viewLogShortcut,
} from "../core/utils.js"
let formatProcesses = async () => {
  let processes = await getProcesses()
  return processes
    .filter(p => p?.scriptPath)
    .filter(p => !p?.scriptPath?.endsWith("processes.js"))
    .map(p => {
      return {
        id: String(p.pid),
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
    enter: "Terminate",
    shortcuts: [escapeShortcut, viewLogShortcut],
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

await sendWait(Channel.TERMINATE_PROCESS, pid)
let processes = await formatProcesses()

if (processes?.length === 0) {
  await mainScript()
} else {
  await run(kitPath("cli", "processes.js"))
}
