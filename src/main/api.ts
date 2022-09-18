import { createGuideConfig } from "./main-helper.js"

await guide(
  kitPath("API.md"),
  createGuideConfig({
    itemHeight: 48,
  })
)

export {}
