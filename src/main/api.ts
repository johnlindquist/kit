import { createGuideConfig } from "./main-helper.js"

let script = await docs(
  kitPath("API.md"),
  createGuideConfig({
    itemHeight: 48,
  })
)

await run(kitPath("cli", script))

await mainScript("", "API")

export {}
