import { } from "../core/utils.js"

let prompt = arg?.pass
  ? arg.pass
  : await arg({
    placeholder: "Enter a prompt",
    enter: "Submit prompt to scriptkit.com",
  })

let prompt_b64 = Buffer.from(prompt).toString("base64")

await hide()
await browse(`https://scriptkit.com/api/new?prompt_b64=${prompt_b64}`)

