// Description: A tutorial to introduce concepts of Simple Scripts

import { kitMode } from "../core/utils.js"

export let name = await arg(
  `Let's create a script that creates a file from your GitHub profile data. 
  Please name your script (example: get-profile):`
)

await cli("new", name, "--template", "tutorial")

echo(
  chalk`\n🤯 {yellow.italic Type} {green.bold ${name}} {yellow.italic in any directory to run ${name}.${kitMode()}}" 🤯\n`
)
