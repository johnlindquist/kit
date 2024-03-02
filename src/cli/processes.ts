// Name: Process List
// Description: Manage/Terminate Running Kit Processes
// Enter: View Running Processes
// Keyword: p
// Log: false

import {
  escapeShortcut,
  cmd,
  viewLogShortcut,
  terminateProcessShortcut,
} from "../core/utils.js"
let formatProcesses = async () => {
  let processes: any = await getProcesses()
  processes = processes
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

  processes.push({
    info: true,
    miss: true,
    name: "No running processes found...",
  })

  return processes
}
let id = setInterval(async () => {
  setChoices(await formatProcesses())
}, 1000)

let currentProcesses = await formatProcesses()

let argPromise = arg(
  {
    placeholder: "Focus Prompt",
    enter: "Focus",
    shortcuts: [
      escapeShortcut,
      viewLogShortcut,
      terminateProcessShortcut,
    ],
    onAbandon: async () => {
      clearTimeout(id)
      await mainScript()
    },
  },
  currentProcesses
)
let { pid, scriptPath }: any = await argPromise
clearInterval(id)

let prompts = await getPrompts()
const prompt = prompts.find(p => p.pid === pid)

await prompt.focus()
