import { createGuideConfig } from "./main-helper.js"

await docs(
  kitPath("API.md"),
  createGuideConfig({
    itemHeight: 48,
  })
)

export {}
