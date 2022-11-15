// Description: Subscribe to the Script Kit Newsletter
import { mainScriptPath } from "../core/utils.js"
setChoices([])
let email = await arg(
  "Enter e-mail to join newsletter:",
  md(`
# Script Kit Newletters include:

* Tips for writing scripts
* Community script highlights
* Automation ideas
* Upcoming features
`)
)
await post(`https://scriptkit.com/api/subscribe`, {
  email,
})
await div(
  md(`## Thanks! Make sure to confirm in your mail app 😇`)
)
if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}
