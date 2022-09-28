import { createGuideConfig } from "./main-helper.js"

let script = await docs(
  kitPath("GUIDE.md"),
  createGuideConfig({
    itemHeight: 48,
    placeholder: "Browse Guide",
  })
)

await run(kitPath("cli", script))
await mainScript("", "Guide")

export {}
