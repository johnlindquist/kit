// Description: Process List
// Log: false

import { Channel } from "../core/enum.js"
import {
  backToMainShortcut,
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
    shortcuts: [backToMainShortcut, viewLogShortcut],
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

send(Channel.TERMINATE_PROCESS, pid)
if ((await formatProcesses())?.length === 0) {
  await mainScript()
} else {
  await run(kitPath("cli", "processes.js"))
}
