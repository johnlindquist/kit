// Name: System Events Scripts
// Description: Select a Script to Edit

import { getScripts } from "../core/db.js"
import { cliShortcuts } from "../core/utils.js"
let scriptsCache = await getScripts()
let filePath = await arg(
  {
    placeholder: "Select System Event Script to Edit",
    enter: "Edit",
    shortcuts: cliShortcuts,
    onNoChoices: async () => {
      setPanel(
        md(`# No System Event Scripts Found
        
Create a script with <code>// System:</code> metadata to add it to this list.

Available events:

- suspend
- resume
- on-ac
- on-battery
- shutdown
- lock-screen
- unlock-screen
- user-did-become-active
- user-did-resign-active
- Read about the available events [here](https://www.electronjs.org/docs/latest/api/power-monitor#events)
        `)
      )
    },
  },
  scriptsCache
    .filter(script => script?.system)
    .map(script => {
      return {
        name: script?.menu || script.command,
        description: `Runs on ${script.system}`,
        value: script.filePath,
      }
    })
)
await run(kitPath("cli", "edit-script.js"), filePath)
