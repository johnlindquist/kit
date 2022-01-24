// Description: Subscribe to the Script Kit Newsletter

import { mainScriptPath } from "../core/utils.js"

let email_address = await arg(
  "Enter e-mail to join newsletter:",
  await highlight(`
## Script Kit Newletters include:
* Tips for writing scripts
* Community script highlights
* Automation ideas
* Upcoming features
`)
)

await post(`https://scriptkit.com/api/subscribe`, {
  email_address,
})

await div(
  md(`## Thanks! Make sure to confirm in your mail app 😇`)
)

if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}

export {}
