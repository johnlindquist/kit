import { Channel } from "../core/enum.js"
import type { Script, Scriptlet } from "../types"

export let runScriptlet = async (focusedScriptlet: Scriptlet, inputs: string[]) => {

    if(!focusedScriptlet.tool) {
        return await div(md(`# No tool found for ${focusedScriptlet.value.name}
  
  ~~~json
  ${JSON.stringify(focusedScriptlet, null, 2)}
  ~~~
  `))
      }
  
      let scriptlet = focusedScriptlet?.scriptlet
      if(!scriptlet) {
        return await div(md(`# No template found for ${focusedScriptlet.value.name}
  ~~~json      
  ${JSON.stringify(focusedScriptlet, null, 2)}
  ~~~
  `))
      }
  
      
      const namedInputs = focusedScriptlet?.inputs
  
      for (let input of namedInputs) {
        scriptlet = scriptlet.replace(`{${input}}`, inputs.shift())
      }
  
  
      send(Channel.STAMP_SCRIPT, focusedScriptlet as Script)
      switch (focusedScriptlet.tool) {
        case "kit":
        case "ts":
        case "js":
          let quickPath = kenvPath("tmp", `scriptlet-${focusedScriptlet.command}.ts`)
          await writeFile(quickPath, scriptlet)
          return await run(quickPath)
        case "open":
          return await open(scriptlet)
        case "paste":
          return await setSelectedText(scriptlet)
        case "type":
          await hide()
          return await keyboard.type(scriptlet)
        default:
          return await exec(scriptlet, { shell: true })
      }
}