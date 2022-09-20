import { createGuideConfig } from "./main-helper.js"

await docs(
  kitPath("GUIDE.md"),
  createGuideConfig({
    itemHeight: 48,
  })
)

export {}
